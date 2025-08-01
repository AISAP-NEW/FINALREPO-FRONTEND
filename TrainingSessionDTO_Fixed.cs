using System;
using System.Text.Json;
using System.Collections.Generic;

namespace ProjectManagement.DTOs.Models
{
    public class TrainingSessionDTO
    {
        public int Id { get; set; }
        public int ModelInstanceId { get; set; }
        public Guid? DatasetId { get; set; }
        public string? TrainingConfig { get; set; } // JSON serialized config
        public string? Metrics { get; set; } // JSON serialized metrics
        public string Status { get; set; } = string.Empty;
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime? PausedAt { get; set; }
        public string? LogsPath { get; set; }
        public string? ErrorMessage { get; set; }
        public string? TrainingParameters { get; set; } // JSON serialized parameters
        public float LearningRate { get; set; }
        
        // Model information
        public int? ModelId { get; set; }
        public string? ModelName { get; set; }
        public string? ModelInstanceName { get; set; }
        
        // Dataset information
        public string? DatasetName { get; set; }
        
        // Computed properties - these will work based on Status
        public TimeSpan? Duration => StartedAt.HasValue && CompletedAt.HasValue 
            ? CompletedAt.Value - StartedAt.Value 
            : null;
            
        public bool CanPause => Status == "InProgress";
        public bool CanResume => Status == "Paused";
        public bool CanCancel => Status == "InProgress" || Status == "Paused";
        
        // Helper methods for JSON properties
        public JsonDocument? GetTrainingConfig() => 
            !string.IsNullOrEmpty(TrainingConfig) ? JsonDocument.Parse(TrainingConfig) : null;
            
        public JsonDocument? GetMetrics() => 
            !string.IsNullOrEmpty(Metrics) ? JsonDocument.Parse(Metrics) : null;
            
        public JsonDocument? GetTrainingParameters() => 
            !string.IsNullOrEmpty(TrainingParameters) ? JsonDocument.Parse(TrainingParameters) : null;
    }

    public class TrainingSessionsResponseDTO
    {
        public bool Success { get; set; }
        public List<TrainingSessionDTO> Sessions { get; set; } = new List<TrainingSessionDTO>();
        public int TotalCount { get; set; }
        public object? Filters { get; set; }
        public string? Error { get; set; }
        public string? Details { get; set; }
    }
}