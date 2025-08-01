import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface StartTrainingDTO {
  ModelId: number;
  ModelVersionId: number;
  LearningRate: number;
  Epochs: number;
  BatchSize: number;
  DatasetValidationId: string; // This should be a GUID string that gets converted
  TrainingParameters?: string;
  Notes?: string;
}

export interface TrainingStatus {
  trainSessionId: number;
  status: string;
  vmStatus?: string;
  isRunning?: boolean;
  startedAt?: string;
  completedAt?: string;
  pausedAt?: string;
  errorMessage?: string;
  logsPath?: string;
}

export interface TrainingLogs {
  logs: string;
  logPath: string;
  lastUpdated: string;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  error: string;
  executionTime?: number;
  memoryUsed?: number;
}

// Updated interfaces to match backend DTOs exactly
export interface TrainingSessionDTO {
  id: number; // Maps to Train_Session_ID
  modelInstanceId: number; // Maps to Model_Instance_ID
  datasetId?: string; // Maps to Dataset_ID (Guid? becomes string)
  trainingConfig?: string;
  metrics?: string;
  status: string; // Maps to Status enum as string
  startedAt?: string; // Maps to StartedAt (DateTime? becomes string)
  completedAt?: string; // Maps to CompletedAt
  pausedAt?: string; // Maps to PausedAt
  logsPath?: string;
  errorMessage?: string;
  trainingParameters?: string;
  learningRate: number; // Maps to LearningRate (float)
  modelId?: number; // From ModelInstance.Model_ID
  modelName?: string; // From ModelInstance.Model.model_name
  modelInstanceName?: string; // From ModelInstance.Name
  datasetName?: string; // From DatasetMetadata.DatasetName
  // Computed properties from backend - these should be calculated server-side
  canPause?: boolean;
  canResume?: boolean;
  canCancel?: boolean;
  // Additional computed property
  duration?: string;
}

export interface TrainingSessionsResponseDTO {
  success: boolean;
  sessions: TrainingSessionDTO[];
  totalCount: number;
  filters?: any;
  error?: string;
  details?: string;
}

@Injectable({ providedIn: 'root' })
export class TrainingService {
  private readonly API_URL = `${environment.apiUrl}/api/Training`;

  constructor(private http: HttpClient) {}

  /**
   * Start a new training session
   * Maps to: POST /api/Training/start
   */
  startTraining(config: StartTrainingDTO): Observable<any> {
    console.log('Starting training with config:', config);
    console.log('DatasetValidationId type:', typeof config.DatasetValidationId);
    console.log('DatasetValidationId value:', config.DatasetValidationId);
    console.log('DatasetValidationId length:', config.DatasetValidationId?.length);
    console.log('Is DatasetValidationId a valid GUID format?', this.isValidGuid(config.DatasetValidationId));
    
    // Convert the config to match backend expectations
    const backendConfig = {
      ...config,
      DatasetValidationId: config.DatasetValidationId // Keep as string, backend will parse it
    };
    
    console.log('Final backend config being sent:', backendConfig);
    
    return this.http.post(`${this.API_URL}/start`, backendConfig).pipe(
      tap(response => {
        console.log('Training start response:', response);
      }),
      catchError(this.handleTrainingError.bind(this))
    );
  }

  /**
   * Get training status for a session
   * Maps to: GET /api/Training/status/{trainSessionId}
   */
  getStatus(sessionId: number): Observable<TrainingStatus> {
    return this.http.get<TrainingStatus>(`${this.API_URL}/status/${sessionId}`).pipe(
      catchError(this.handleTrainingError.bind(this))
    );
  }

  /**
   * Pause training session
   * Maps to: POST /api/Training/pause/{trainSessionId}
   */
  pause(sessionId: number): Observable<any> {
    return this.http.post(`${this.API_URL}/pause/${sessionId}`, {}).pipe(
      catchError(this.handleTrainingError.bind(this))
    );
  }

  /**
   * Resume training session
   * Maps to: POST /api/Training/resume/{trainSessionId}
   */
  resume(sessionId: number): Observable<any> {
    return this.http.post(`${this.API_URL}/resume/${sessionId}`, {}).pipe(
      catchError(this.handleTrainingError.bind(this))
    );
  }

  /**
   * Cancel training session
   * Maps to: POST /api/Training/cancel/{trainSessionId}
   */
  cancel(sessionId: number): Observable<any> {
    return this.http.post(`${this.API_URL}/cancel/${sessionId}`, {}).pipe(
      catchError(this.handleTrainingError.bind(this))
    );
  }

  /**
   * Get training logs
   * Maps to: GET /api/Training/logs/{trainSessionId}
   */
  getLogs(sessionId: number): Observable<TrainingLogs> {
    return this.http.get<TrainingLogs>(`${this.API_URL}/logs/${sessionId}`).pipe(
      catchError(this.handleTrainingError.bind(this))
    );
  }

  /**
   * Execute code on VM
   * Maps to: POST /api/Training/execute
   */
  executeCode(code: string, language: string = 'python', timeoutSeconds: number = 30): Observable<ExecutionResult> {
    return this.http.post<ExecutionResult>(`${this.API_URL}/execute`, {
      Code: code,
      Language: language,
      TimeoutInSeconds: timeoutSeconds
    }).pipe(
      catchError(this.handleTrainingError.bind(this))
    );
  }

  /**
   * Get system resources
   * Maps to: GET /api/Training/resources
   */
  getSystemResources(): Observable<any> {
    return this.http.get(`${this.API_URL}/resources`).pipe(
      catchError(this.handleTrainingError.bind(this))
    );
  }

  /**
   * Start custom training with code
   * Maps to: POST /api/Training/train-with-code/{modelId}/{instanceId}
   */
  trainWithCode(modelId: number, instanceId: number, code: string): Observable<any> {
    return this.http.post(`${this.API_URL}/train-with-code/${modelId}/${instanceId}`, {
      Code: code,
      Language: 'python'
    }).pipe(
      catchError(this.handleTrainingError.bind(this))
    );
  }

  /**
   * Test VM logs for debugging
   * Maps to: GET /api/Training/test-logs/{instanceId}
   */
  testVMLogs(instanceId: number): Observable<any> {
    return this.http.get(`${this.API_URL}/test-logs/${instanceId}`).pipe(
      catchError(this.handleTrainingError.bind(this))
    );
  }

  /**
   * Get all training sessions with optional filters
   * Maps to: GET /api/Training/sessions
   */
  getAllTrainingSessions(filters?: {
    status?: string;
    modelId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Observable<TrainingSessionsResponseDTO> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.modelId) params = params.set('modelId', filters.modelId.toString());
      if (filters.startDate) params = params.set('startDate', filters.startDate.toISOString());
      if (filters.endDate) params = params.set('endDate', filters.endDate.toISOString());
    }
    
    const url = `${this.API_URL}/sessions`;
    console.log('🔍 Making API call to:', url);
    console.log('📊 With params:', params.toString());
    console.log('🌐 Full URL:', params.toString() ? `${url}?${params.toString()}` : url);
    
    return this.http.get<TrainingSessionsResponseDTO>(url, { params }).pipe(
      tap(response => {
        console.log('✅ TrainingService API response:', response);
        console.log('📈 Sessions count:', response?.sessions?.length || 0);
        console.log('🎯 Success flag:', response?.success);
      }),
      catchError(error => {
        console.error('❌ TrainingService API error:', error);
        console.error('🔍 Error status:', error.status);
        console.error('📝 Error message:', error.message);
        console.error('🌐 Error URL:', error.url);
        
        // Just throw the original error - don't create mock responses
        return throwError(() => error);
      })
    );
  }

  /**
   * Pause training session by session ID
   * Maps to: POST /api/Training/pause/{trainSessionId}
   */
  pauseTrainingSession(sessionId: number): Observable<any> {
    console.log('⏸️ Pausing training session:', sessionId);
    return this.http.post(`${this.API_URL}/pause/${sessionId}`, {}).pipe(
      tap(response => console.log('✅ Pause response:', response)),
      catchError(this.handleTrainingError.bind(this))
    );
  }

  /**
   * Resume training session by session ID
   * Maps to: POST /api/Training/resume/{trainSessionId}
   */
  resumeTrainingSession(sessionId: number): Observable<any> {
    console.log('▶️ Resuming training session:', sessionId);
    return this.http.post(`${this.API_URL}/resume/${sessionId}`, {}).pipe(
      tap(response => console.log('✅ Resume response:', response)),
      catchError(this.handleTrainingError.bind(this))
    );
  }

  /**
   * Cancel training session by session ID
   * Maps to: POST /api/Training/cancel/{trainSessionId}
   */
  cancelTrainingSession(sessionId: number): Observable<any> {
    console.log('🛑 Cancelling training session:', sessionId);
    return this.http.post(`${this.API_URL}/cancel/${sessionId}`, {}).pipe(
      tap(response => console.log('✅ Cancel response:', response)),
      catchError(this.handleTrainingError.bind(this))
    );
  }

  /**
   * Test connection to training API and check if sessions endpoint works
   */
  testConnection(): Observable<any> {
    console.log('🧪 Testing connection to:', `${this.API_URL}/sessions`);
    return this.http.get(`${this.API_URL}/sessions`).pipe(
      tap(response => {
        console.log('✅ Connection test successful:', response);
      }),
      catchError(error => {
        console.error('❌ Training API connection test failed:', error);
        console.error('🔍 Error details:', {
          status: error.status,
          message: error.message,
          url: error.url
        });
        return throwError(() => new Error(`Training API connection failed: ${error.status} - ${error.message}`));
      })
    );
  }

  /**
   * Test if backend is reachable at all
   */
  testBackendHealth(): Observable<any> {
    const healthUrl = `${environment.apiUrl}/api/health`; // Common health check endpoint
    console.log('🏥 Testing backend health at:', healthUrl);
    return this.http.get(healthUrl).pipe(
      tap(response => {
        console.log('✅ Backend health check successful:', response);
      }),
      catchError(error => {
        console.error('❌ Backend health check failed:', error);
        // Try a simple GET to the base API URL
        return this.http.get(`${environment.apiUrl}/api`).pipe(
          tap(response => {
            console.log('✅ Base API reachable:', response);
          }),
          catchError(baseError => {
            console.error('❌ Base API also unreachable:', baseError);
            return throwError(() => new Error(`Backend unreachable: ${baseError.status} - ${baseError.message}`));
          })
        );
      })
    );
  }

  /**
   * Enhanced error handling with VM-specific error messages
   */
  private handleTrainingError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unexpected error occurred during training.';

    if (error.status === 0) {
      // Network error - likely VM connection issue
      errorMessage = 'Training failed: Unable to connect to the virtual machine. Please check your network connection and try again.';
    } else if (error.status === 500) {
      // Server error - check error message
      if (error.error?.message) {
        if (error.error.message.includes('execution service')) {
          errorMessage = 'Training process could not start: Execution service unavailable. Please try again later.';
        } else if (error.error.message.includes('VM') || error.error.message.includes('virtual machine')) {
          errorMessage = `Training failed: ${error.error.message}`;
        } else {
          errorMessage = `Training failed: ${error.error.message}`;
        }
      } else {
        errorMessage = 'Training failed: Internal server error. Please try again later.';
      }
    } else if (error.status === 404) {
      errorMessage = 'Training session not found. The session may have been deleted or expired.';
    } else if (error.status === 400) {
      if (error.error?.message) {
        if (error.error.message.includes('DatasetValidationId')) {
          errorMessage = 'Invalid dataset validation ID. Please ensure the dataset has been validated before training.';
        } else if (error.error.message.includes('dataset')) {
          errorMessage = `Training configuration error: ${error.error.message}`;
        } else {
          errorMessage = `Training configuration error: ${error.error.message}`;
        }
      } else {
        errorMessage = 'Invalid training configuration. Please check your parameters and try again.';
      }
    } else if (error.status === 503) {
      errorMessage = 'Training service temporarily unavailable. The virtual machine may be busy or offline.';
    }

    console.error('Training service error:', error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Check if a string is a valid GUID format
   */
  private isValidGuid(guid: string): boolean {
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return guidRegex.test(guid);
  }
}
