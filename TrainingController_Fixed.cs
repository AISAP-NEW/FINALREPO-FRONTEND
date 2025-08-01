using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Models.Models;
using ProjectManagement.DTOs.Training;
using ProjectManagement.Models.Training;
using ProjectManagement.Models.DatasetModels;
using System.Diagnostics;
using System.IO;
using ProjectManagement.Services.Interfaces;
using System.Text;
using Microsoft.Extensions.Configuration;
using Renci.SshNet;
using AutoMapper;
using ProjectManagement.DTOs.Models;

namespace ProjectManagement.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TrainingController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly IFileStorageService _fileStorageService;
        private readonly ICodeExecutionService _codeExecutionService;
        private readonly ProjectDbContext _context;
        private readonly ILogger<TrainingController> _logger;
        private readonly IModelInstanceService _modelInstanceService;
        private readonly ITrainingStatusService _trainingStatusService;
        private readonly IMapper _mapper;

        public TrainingController(
            ProjectDbContext context, 
            ILogger<TrainingController> logger,
            IModelInstanceService modelInstanceService,
            IConfiguration configuration,
            IFileStorageService fileStorageService,
            ICodeExecutionService codeExecutionService,
            ITrainingStatusService trainingStatusService,
            IMapper mapper)
        {
            _context = context;
            _logger = logger;
            _modelInstanceService = modelInstanceService;
            _configuration = configuration;
            _fileStorageService = fileStorageService;
            _codeExecutionService = codeExecutionService;
            _trainingStatusService = trainingStatusService;
            _mapper = mapper;
        }

        [HttpPost("start")]
        public async Task<IActionResult> StartTraining([FromBody] StartTrainingDTO dto)
        {
            // 1. Check if model version and model instance exist
            var modelInstance = await _context.ModelInstances
                .FirstOrDefaultAsync(m => m.Model_ID == dto.ModelId && m.Model_Version_ID == dto.ModelVersionId);

            if (modelInstance == null)
            {
                // Create new instance if none exists
                modelInstance = new ModelInstance
                {
                    Model_ID = dto.ModelId,
                    Model_Version_ID = dto.ModelVersionId,
                    Status = "Ready for Training",
                    Version_Number = "1.0",
                    CreationDate = DateTime.UtcNow,
                    Hyperparameters = $"LR: {dto.LearningRate}, Epochs: {dto.Epochs}, Batch: {dto.BatchSize}",
                    CreatedBy = "SYSTEM", // get current user later
                    Notes = dto.Notes,
                    Name = $"Instance for Model {dto.ModelId} v{dto.ModelVersionId}",
                    Performance_Metrics = "{}" // Initialize with empty JSON object
                };
                _context.ModelInstances.Add(modelInstance);
                await _context.SaveChangesAsync();
            }

            // 2. Validate DatasetValidation
            if (!Guid.TryParse(dto.DatasetValidationId.ToString(), out Guid datasetGuid))
            {
                return BadRequest("Invalid DatasetValidationId format.");
            }

            var datasetValidation = await _context.DatasetValidations
                .FirstOrDefaultAsync(v => v.DataValidId == datasetGuid && v.ValidationStatus == "Passed");

            if (datasetValidation == null)
            {
                return BadRequest("No validated dataset found.");
            }

            // Get the associated DatasetMetadata ID
            var datasetId = datasetValidation.DatasetMetadataDatasetId;
            if (datasetId == null)
            {
                return BadRequest("Validated dataset does not have an associated DatasetMetadata.");
            }

            // 3. Create Train
            var train = new Train
            {
                Model_ID = dto.ModelId,
                Accuracy = 0.0f,
                Start_Date = DateTime.UtcNow
            };
            _context.Train.Add(train);
            await _context.SaveChangesAsync();

            // Create logs directory path
            var logsDirectory = Path.Combine("wwwroot", "training-logs");
            Directory.CreateDirectory(logsDirectory);
            var logsPath = Path.Combine(logsDirectory, $"train_{train.Train_ID}_{DateTime.UtcNow:yyyyMMddHHmmss}.log");

            // 4. Create TrainSession
            var trainSession = new TrainSession
            {
                Train_ID = train.Train_ID,
                Status = TrainingStatus.Pending,
                LearningRate = dto.LearningRate,
                Model_Instance_ID = modelInstance.Model_Instance_ID,
                TrainingParameters = dto.TrainingParameters,
                TrainingConfig = $"Epochs: {dto.Epochs}, BatchSize: {dto.BatchSize}",
                StartedAt = DateTime.UtcNow,
                ErrorMessage = "", // Initialize with empty string
                LogsPath = logsPath, // Set the logs path
                Metrics = "{}",
                Dataset_ID = datasetId // Use the correct DatasetMetadata ID
            };

            _context.TrainSessions.Add(trainSession);

            // 5. Log Action (Audit_Log)
            _context.AuditLogs.Add(new AuditLog
            {
                Action_Type = "Start Training",
                TableAffected = "ModelInstance",
                RecordAffected = $"ID: {modelInstance.Model_Instance_ID}",
                Timestamp = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            // 6. Trigger actual training process (now on VM)
            var trainingStarted = await _modelInstanceService.TriggerTrainingAsync(dto.ModelId, modelInstance.Model_Instance_ID);
            if (!trainingStarted)
            {
                _logger.LogError($"Failed to start training process for model instance {modelInstance.Model_Instance_ID}");
                return StatusCode(500, new { message = "Failed to start training process" });
            }

            // 7. Start status monitoring
            await _trainingStatusService.StartStatusMonitoringAsync(modelInstance.Model_Instance_ID);

            return Ok(new
            {
                message = "Training session created and started.",
                trainSessionId = trainSession.Train_Session_ID,
                modelInstanceId = modelInstance.Model_Instance_ID
            });
        }

        [HttpPost("pause/{trainSessionId}")]
        public async Task<IActionResult> PauseTraining(int trainSessionId)
        {
            var session = await _context.TrainSessions
                .Include(s => s.ModelInstance)  // Include ModelInstance to get its ID
                .FirstOrDefaultAsync(s => s.Train_Session_ID == trainSessionId);
            
            if (session == null)
                return NotFound("Training session not found.");

            if (session.Status != TrainingStatus.InProgress)
                return BadRequest("Can only pause a running session.");

            // Try to pause the actual training process (now on VM)
            var paused = await _modelInstanceService.StopTrainingAsync(session.Model_Instance_ID);
            if (!paused)
            {
                return StatusCode(500, new { message = "Failed to pause training process" });
            }

            session.Status = TrainingStatus.Paused;
            session.PausedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Training paused.", trainSessionId });
        }

        [HttpPost("resume/{trainSessionId}")]
        public async Task<IActionResult> ResumeTraining(int trainSessionId)
        {
            var session = await _context.TrainSessions.FindAsync(trainSessionId);
            if (session == null)
                return NotFound("Training session not found.");

            if (session.Status != TrainingStatus.Paused)
                return BadRequest("Can only resume a paused session.");

            var resumed = await _modelInstanceService.ResumeTrainingAsync(session.Model_Instance_ID);
            if (!resumed)
            {
                return StatusCode(500, new { message = "Failed to resume training process" });
            }

            session.Status = TrainingStatus.InProgress;
            session.PausedAt = null;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Training resumed.", trainSessionId });
        }

        [HttpPost("cancel/{trainSessionId}")]
        public async Task<IActionResult> CancelTraining(int trainSessionId)
        {
            var session = await _context.TrainSessions.FindAsync(trainSessionId);
            if (session == null)
                return NotFound("Training session not found.");

            var cancelled = await _modelInstanceService.CancelTrainingAsync(session.Model_Instance_ID);
            if (!cancelled)
            {
                return StatusCode(500, new { message = "Failed to cancel training process" });
            }

            session.Status = TrainingStatus.Cancelled;
            session.CompletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Stop status monitoring
            await _trainingStatusService.StopStatusMonitoringAsync(session.Model_Instance_ID);

            return Ok(new { message = "Training cancelled.", trainSessionId });
        }

        [HttpGet("status/{trainSessionId}")]
        public async Task<IActionResult> GetTrainingStatus(int trainSessionId)
        {
            var session = await _context.TrainSessions
                .Include(s => s.ModelInstance)
                .FirstOrDefaultAsync(s => s.Train_Session_ID == trainSessionId);

            if (session == null)
                return NotFound("Training session not found.");

            // Get real-time VM status
            var vmStatus = await _trainingStatusService.GetVMTrainingStatusAsync(session.Model_Instance_ID);
            var isRunning = await _trainingStatusService.IsTrainingRunningAsync(session.Model_Instance_ID);

            return Ok(new
            {
                trainSessionId = session.Train_Session_ID,
                status = session.Status,
                vmStatus = vmStatus,
                isRunning = isRunning,
                startedAt = session.StartedAt,
                completedAt = session.CompletedAt,
                pausedAt = session.PausedAt,
                errorMessage = session.ErrorMessage,
                logsPath = session.LogsPath
            });
        }

        [HttpGet("logs/{trainSessionId}")]
        public async Task<IActionResult> GetTrainingLogs(int trainSessionId)
        {
            var session = await _context.TrainSessions
                .Include(s => s.ModelInstance)
                .FirstOrDefaultAsync(s => s.Train_Session_ID == trainSessionId);

            if (session == null)
                return NotFound("Training session not found.");

            try
            {
            // Sync latest logs from VM
            await _trainingStatusService.SyncVMLogsAsync(session.Model_Instance_ID);

            // Read the log file
            if (System.IO.File.Exists(session.LogsPath))
            {
                var logContent = await System.IO.File.ReadAllTextAsync(session.LogsPath);
                    return Ok(new { 
                        logs = logContent,
                        logPath = session.LogsPath,
                        lastUpdated = DateTime.UtcNow
                    });
                }
                else
                {
                    // Check if there are any recent log files for this session
                    var logsDirectory = Path.Combine("wwwroot", "training-logs");
                    if (Directory.Exists(logsDirectory))
                    {
                        var logFiles = Directory.GetFiles(logsDirectory, $"train_{session.Model_Instance_ID}_*.log")
                            .OrderByDescending(f => System.IO.File.GetLastWriteTime(f))
                            .ToList();

                        if (logFiles.Any())
                        {
                            var latestLog = logFiles.First();
                            var logContent = await System.IO.File.ReadAllTextAsync(latestLog);
                            return Ok(new { 
                                logs = logContent,
                                logPath = latestLog,
                                lastUpdated = System.IO.File.GetLastWriteTime(latestLog)
                            });
                        }
            }

                    return NotFound(new { 
                        message = "Log file not found.",
                        sessionId = trainSessionId,
                        instanceId = session.Model_Instance_ID,
                        status = session.Status
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving logs for session {trainSessionId}");
                return StatusCode(500, new { 
                    message = "Error retrieving training logs",
                    error = ex.Message
                });
            }
        }

        [HttpPost("execute")]
        public async Task<IActionResult> ExecuteCode([FromBody] ExecuteCodeRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Code))
                {
                    return BadRequest("Code cannot be empty");
                }

                // Execute code in a secure environment
                var result = await _codeExecutionService.ExecuteAsync(
                    request.Code, 
                    request.Language,
                    request.TimeoutInSeconds);

                return Ok(new 
                { 
                    success = true,
                    output = result.Output,
                    error = result.Error,
                    executionTime = result.ExecutionTime,
                    memoryUsed = result.MemoryUsed
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing code");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpGet("sessions")]
        public async Task<IActionResult> GetAllTrainingSessions(
            [FromQuery] string? status = null,
            [FromQuery] int? modelId = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var query = _context.TrainSessions
                    .Include(ts => ts.ModelInstance)
                        .ThenInclude(mi => mi.Model)
                    .Include(ts => ts.DatasetMetadata)
                    .AsQueryable();

                // Apply filters
                if (!string.IsNullOrEmpty(status))
                {
                    if (Enum.TryParse<TrainingStatus>(status, true, out var statusEnum))
                    {
                        query = query.Where(ts => ts.Status == statusEnum);
                    }
                }

                if (modelId.HasValue)
                {
                    query = query.Where(ts => ts.ModelInstance.Model_ID == modelId.Value);
                }

                if (startDate.HasValue)
                {
                    query = query.Where(ts => ts.StartedAt >= startDate.Value);
                }

                if (endDate.HasValue)
                {
                    query = query.Where(ts => ts.StartedAt <= endDate.Value);
                }

                // Use direct projection instead of AutoMapper to avoid mapping issues
                var trainingSessionDtos = await query
                    .OrderByDescending(ts => ts.StartedAt)
                    .Select(ts => new TrainingSessionDTO
                    {
                        Id = ts.Train_Session_ID,
                        ModelInstanceId = ts.Model_Instance_ID,
                        DatasetId = ts.Dataset_ID,
                        TrainingConfig = ts.TrainingConfig,
                        Metrics = ts.Metrics,
                        Status = ts.Status.ToString(),
                        StartedAt = ts.StartedAt,
                        CompletedAt = ts.CompletedAt,
                        PausedAt = ts.PausedAt,
                        LogsPath = ts.LogsPath,
                        ErrorMessage = ts.ErrorMessage,
                        TrainingParameters = ts.TrainingParameters,
                        LearningRate = ts.LearningRate,
                        ModelId = ts.ModelInstance != null ? (int?)ts.ModelInstance.Model_ID : null,
                        ModelName = ts.ModelInstance != null && ts.ModelInstance.Model != null ? ts.ModelInstance.Model.model_name : null,
                        ModelInstanceName = ts.ModelInstance != null ? ts.ModelInstance.Name : null,
                        DatasetName = ts.DatasetMetadata != null ? ts.DatasetMetadata.DatasetName : null,
                        // *** THIS IS THE FIX - ADDED COMPUTED CONTROL PROPERTIES ***
                        CanPause = ts.Status == TrainingStatus.InProgress,
                        CanResume = ts.Status == TrainingStatus.Paused,
                        CanCancel = ts.Status == TrainingStatus.InProgress || ts.Status == TrainingStatus.Paused
                    })
                    .ToListAsync();

                return Ok(new TrainingSessionsResponseDTO
                {
                    Success = true,
                    Sessions = trainingSessionDtos,
                    TotalCount = trainingSessionDtos.Count,
                    Filters = new
                    {
                        status,
                        modelId,
                        startDate,
                        endDate
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching all training sessions");
                return StatusCode(500, new TrainingSessionsResponseDTO
                {
                    Success = false,
                    Error = "Failed to fetch training sessions",
                    Details = ex.Message
                });
            }
        }

        [HttpGet("resources")]
        public IActionResult GetSystemResources()
        {
            try
            {
                var process = Process.GetCurrentProcess();
                var startTime = DateTime.UtcNow - process.StartTime;
                var cpuTime = process.TotalProcessorTime;
                
                // Calculate CPU usage percentage
                var cpuUsage = Math.Round(
                    (cpuTime.TotalMilliseconds / (Environment.ProcessorCount * startTime.TotalMilliseconds)) * 100, 
                    2);

                return Ok(new 
                {
                    cpuUsage = $"{cpuUsage}%",
                    memoryUsage = FormatBytes(process.WorkingSet64),
                    totalMemory = FormatBytes(process.WorkingSet64),
                    processStartTime = process.StartTime,
                    threadCount = process.Threads.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting system resources");
                return StatusCode(500, new { error = "Failed to retrieve system resources" });
            }
        }

        [HttpPost("save")]
        public async Task<IActionResult> SaveFile([FromForm] SaveModelRequest request)
        {
            try
            {
                if (request.File == null || request.File.Length == 0)
                {
                    return BadRequest("No file uploaded");
                }

                // Save file locally
                var savedFileName = await _fileStorageService.SaveFileAsync(request.File, "trained-models");
                var fileUrl = _fileStorageService.GetFileUrl(savedFileName);

                // Log the save action
                _context.AuditLogs.Add(new AuditLog
                {
                    Action_Type = "Model File Saved",
                    TableAffected = "ModelInstance",
                    RecordAffected = $"ID: {request.ModelInstanceId}, File: {request.File.FileName}",
                    Timestamp = DateTime.UtcNow,
                    User_ID = 1 // TODO: Replace with actual user ID from authentication
                });

                await _context.SaveChangesAsync();

                return Ok(new 
                { 
                    success = true,
                    fileUrl,
                    fileName = request.File.FileName,
                    savedFileName,
                    savedAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving model file");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        private string FormatBytes(long bytes)
        {
            string[] sizes = { "B", "KB", "MB", "GB", "TB" };
            int order = 0;
            double len = bytes;
            while (len >= 1024 && order < sizes.Length - 1)
            {
                order++;
                len = len / 1024;
            }
            return $"{len:0.##} {sizes[order]}";
        }
        [HttpPost("start-custom-training/{instanceId}")]
        public async Task<IActionResult> StartCustomTraining(int instanceId, [FromBody] CustomTrainingRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.PythonCode))
                return BadRequest("Python code must be provided.");

            var started = await _modelInstanceService.TriggerTrainingWithCodeAsync(instanceId, instanceId, request.PythonCode);
            if (!started)
                return StatusCode(500, "Failed to start custom training.");

            return Ok(new { message = "Custom training started." });
        }

        [HttpPost("train-with-code/{modelId}/{instanceId}")]
        public async Task<IActionResult> TrainModelWithCode(int modelId, int instanceId, [FromBody] ExecuteCodeRequest request)
        {
            try
            {
                var result = await _modelInstanceService.TriggerTrainingWithCodeAsync(modelId, instanceId, request.Code);
                if (!result)
                {
                    return BadRequest("Training failed to start.");
                }

                return Ok("Training started successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error starting training with code for instance {instanceId}");
                return StatusCode(500, ex.Message);  // Return the exception message in response temporarily
            }
        }

        [HttpGet("test-logs/{instanceId}")]
        public async Task<IActionResult> TestVMLogs(int instanceId)
        {
            try
            {
                using var ssh = new SshClient("innovate-x-vm", "ubuntu", "UJAllTheWay101");
                ssh.Connect();

                // Check various log locations
                var commands = new[]
                {
                    $"ls -la /tmp/train_{instanceId}.log",
                    $"ls -la /tmp/training.log",
                    $"find /tmp -name '*train*' -name '*.log' -mtime -1",
                    $"ps aux | grep python3 | grep train",
                    $"ls -la /home/ubuntu/code-executor/models/"
                };

                var results = new Dictionary<string, string>();

                foreach (var cmd in commands)
                {
                    var command = ssh.CreateCommand(cmd);
                    var result = command.Execute();
                    results[cmd] = result;
                }

                ssh.Disconnect();

                return Ok(new
                {
                    instanceId = instanceId,
                    timestamp = DateTime.UtcNow,
                    results = results
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }


        public class CustomTrainingRequest
        {
            public string PythonCode { get; set; }
        }

    }

    public class ExecuteCodeRequest
    {
        public string Code { get; set; }
        public string Language { get; set; } = "python";
        public int TimeoutInSeconds { get; set; } = 30;
    }

    public class SaveModelRequest
    {
        public int ModelInstanceId { get; set; }
        public string FolderPath { get; set; }
        public IFormFile File { get; set; }
    }


}