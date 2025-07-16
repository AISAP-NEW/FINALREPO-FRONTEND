import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subscription, interval } from 'rxjs';
import { environment } from '../../environments/environment';
import { catchError, tap } from 'rxjs/operators';
import { 
  TrainingConfig, 
  TrainingSession, 
  TrainingMetric, 
  TrainingProgress 
} from '../models/training.model';

export interface ModelFile {
  fileId: number;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
}

export interface ModelVersion {
  model_Version_ID: number;
  version_Number: string;
  creationDate: string;
  files: ModelFile[];
}

export interface ModelDetails {
  modelId: number;
  modelName: string;
  description: string;
  creationDate: string;
  versions: ModelVersion[];
}

export interface ModelUploadRequest {
  modelName: string;
  description: string;
  version?: string;
  datasetId?: number;
  file: File;
}

@Injectable({
  providedIn: 'root'
})
export class ModelService implements OnDestroy {
  private readonly apiUrl = `${environment.apiUrl}/api/Model`;
  private readonly modelFileApiUrl = `${environment.apiUrl}/api/ModelFile`;
  private trainingProgressSubject = new BehaviorSubject<TrainingProgress | null>(null);
  public trainingProgress$ = this.trainingProgressSubject.asObservable();
  private pollSubscription?: Subscription;

  constructor(private http: HttpClient) {}

  // Fetch all models (summary)
  getAllModels(): Observable<any[]> {
    return this.http.get<any[]>(`${this.modelFileApiUrl}/all-models`);
  }

  // Update model details
  updateModel(id: number, data: { modelName: string; description: string; topicId?: number }) {
    return this.http.put(`${this.modelFileApiUrl}/update-model/${id}`, data);
  }

  // Delete a model
  deleteModel(id: number) {
    return this.http.delete(`${this.modelFileApiUrl}/delete-model/${id}`);
  }

  // Fetch full details for a model (includes versions and files)
  getModelDetails(id: number): Observable<ModelDetails> {
    return this.http.get<ModelDetails>(`${this.modelFileApiUrl}/model-details/${id}`);
  }

  // Get a download URL for a file
  getFileDownloadUrl(filePath: string): string {
    return `${environment.apiUrl}${filePath}`;
  }

  // Delete a file
  deleteFile(fileId: number): Observable<any> {
    return this.http.delete(`${this.modelFileApiUrl}/delete-file/${fileId}`);
  }

  // Read file content for preview
  readFileContent(fileId: number): Observable<{ fileName: string, content: string }> {
    return this.http.get<{ fileName: string, content: string }>(`${this.modelFileApiUrl}/read-file/${fileId}`);
  }

  uploadModel(modelData: ModelUploadRequest): Observable<any> {
    const formData = new FormData();
    formData.append('modelName', modelData.modelName);
    formData.append('description', modelData.description);
    formData.append('file', modelData.file, modelData.file.name);
    
    if (modelData.version) formData.append('version', modelData.version);
    if (modelData.datasetId) formData.append('datasetId', modelData.datasetId.toString());
    return this.http.post<any>(this.apiUrl, formData);
  }

  /**
   * Training configuration for starting a new training session
   */
  startTraining(modelId: number, config: TrainingConfig): Observable<TrainingSession> {
    return this.http.post<TrainingSession>(`${this.apiUrl}/${modelId}/train`, config).pipe(
      tap(session => {
        if (session?.id) {
          this.pollTrainingProgress(session.id);
        }
      })
    );
  }

  /**
   * Stop an ongoing training session
   */
  stopTraining(sessionId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/train/${sessionId}/stop`, {});
  }

  /**
   * Get the current training progress for a session
   */
  getTrainingProgress(sessionId: number): Observable<TrainingProgress> {
    return this.http.get<TrainingProgress>(`${this.apiUrl}/train/${sessionId}/progress`);
  }

  /**
   * Poll for training progress updates
   */
  private pollTrainingProgress(sessionId: number): void {
    // Clean up any existing subscription
    this.cleanupPolling();

    this.pollSubscription = interval(2000).subscribe(() => {
      this.getTrainingProgress(sessionId).subscribe({
        next: (progress) => {
          this.trainingProgressSubject.next(progress);
          
          // Stop polling if training is complete
          if (['Completed', 'Failed', 'Stopped'].includes(progress.session.status)) {
            this.cleanupPolling();
          }
        },
        error: (error) => {
          console.error('Error polling training progress:', error);
          this.cleanupPolling();
        }
      });
    });
  }

  /**
   * Clean up polling subscription
   */
  private cleanupPolling(): void {
    if (this.pollSubscription) {
      this.pollSubscription.unsubscribe();
      this.pollSubscription = undefined;
    }
  }

  /**
   * Clean up resources when service is destroyed
   */
  ngOnDestroy(): void {
    this.cleanupPolling();
  }

  /**
   * Get training history for a model
   */
  getTrainingHistory(modelId: number): Observable<TrainingSession[]> {
    return this.http.get<TrainingSession[]>(`${this.apiUrl}/${modelId}/training-sessions`);
  }
}
