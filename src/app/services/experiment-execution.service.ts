import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface VirtualMachine {
  VmId: number;
  Name: string;
  HostAddress: string;
  Status: string;
  Environment: string;
}

export interface ExperimentExecutionRequest {
  ExperimentId: number;
  ModelId?: number;
  ModelFile?: File;
  ModelFileName?: string;
  ModelType?: string;
  VirtualMachineId: number;
  Parameters?: { [key: string]: any };
  CustomModelName?: string;
}

export interface ExperimentExecutionResult {
  ExperimentId: number;
  ModelId?: number;
  success: boolean;
  accuracy?: number;
  metrics?: { [key: string]: any };
  executionTime?: string;
  modelType?: string;
  fileName?: string;
  fileSize?: number;
  Logs?: string[];
  ErrorMessage?: string;
  Status?: string;
  DurationSeconds?: number;
}

export interface ExperimentProgress {
  ExperimentId: number;
  Status: string;
  ProgressPercentage: number;
  CurrentStep?: string;
  LastUpdate: Date;
  Logs?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExperimentExecutionService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Virtual Machine operations
  getVirtualMachines(): Observable<VirtualMachine[]> {
    return this.http.get<VirtualMachine[]>(`${this.baseUrl}/api/VirtualMachine`);
  }

  getAvailableVMs(): Observable<VirtualMachine[]> {
    return this.http.get<VirtualMachine[]>(`${this.baseUrl}/api/VirtualMachine?status=available`);
  }

  // Experiment execution
  runExperiment(request: ExperimentExecutionRequest): Observable<ExperimentExecutionResult> {
    const formData = new FormData();
    
    // Append file if it exists
    if (request.ModelFile) {
      formData.append('modelFile', request.ModelFile);
    }
    
    // Append other required fields
    formData.append('experimentId', request.ExperimentId.toString());
    formData.append('virtualMachineId', request.VirtualMachineId.toString());
    if (request.ModelType) {
      formData.append('modelType', request.ModelType);
    }
    formData.append('parameters', JSON.stringify(request.Parameters || {}));
    
    // Append optional fields if they exist
    if (request.CustomModelName) {
      formData.append('customModelName', request.CustomModelName);
    }

    return this.http.post<ExperimentExecutionResult>(
      `${this.baseUrl}/api/Experiment/run`,
      formData
    ).pipe(
      catchError(error => {
        console.error('Error in runExperiment:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to run experiment'));
      })
    );
  }

  getExperimentProgress(experimentId: number): Observable<ExperimentProgress> {
    return this.http.get<ExperimentProgress>(`${this.baseUrl}/api/Experiment/${experimentId}/progress`);
  }

  cancelExperiment(experimentId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/Experiment/${experimentId}/cancel`, {});
  }

  getExperimentResults(experimentId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/Experiment/${experimentId}/results`);
  }
}
