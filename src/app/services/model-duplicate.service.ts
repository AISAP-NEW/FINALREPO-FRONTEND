import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { 
  DuplicateModelRequest, 
  DuplicateModelResponse, 
  NameAvailabilityResponse 
} from '../models/duplicate-request.model';

@Injectable({
  providedIn: 'root'
})
export class ModelDuplicateService {
  private baseUrl = `${environment.apiUrl}/api/ModelDuplicate`;

  constructor(private http: HttpClient) {}

  /**
   * Duplicate a model
   */
  duplicateModel(request: DuplicateModelRequest): Observable<DuplicateModelResponse> {
    return this.http.post<DuplicateModelResponse>(`${this.baseUrl}/duplicate`, request)
      .pipe(catchError(this.handleError));
  }

  /**
   * Check name availability
   */
  checkNameAvailability(modelName: string): Observable<NameAvailabilityResponse> {
    return this.http.get<NameAvailabilityResponse>(`${this.baseUrl}/check-name/${encodeURIComponent(modelName)}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get suggested name for duplicated model
   */
  suggestName(originalModelId: number): Observable<string> {
    return this.http.get<string>(`${this.baseUrl}/suggest-name/${originalModelId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get duplication history
   */
  getDuplicationHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/history`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Validate duplication request
   */
  validateDuplicationRequest(request: DuplicateModelRequest): Observable<boolean> {
    return this.http.post<boolean>(`${this.baseUrl}/validate`, request)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get model information for duplication
   */
  getModelForDuplication(modelId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/model-info/${modelId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unexpected error occurred during model duplication.';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'Invalid duplication request.';
          break;
        case 404:
          errorMessage = 'Model not found for duplication.';
          break;
        case 409:
          errorMessage = error.error?.message || 'Model name already exists.';
          break;
        case 500:
          errorMessage = 'Server error occurred during duplication.';
          break;
        default:
          errorMessage = error.error?.message || `Server error: ${error.status}`;
      }
    }
    
    console.error('Model duplicate service error:', error);
    return throwError(() => new Error(errorMessage));
  }
} 