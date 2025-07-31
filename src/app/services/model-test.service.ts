import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { 
  TestResult, 
  TestDatasetValidationRequest, 
  RunModelTestRequest, 
  DatasetValidation 
} from '../models/test-result.model';

@Injectable({
  providedIn: 'root'
})
export class ModelTestService {
  private baseUrl = `${environment.apiUrl}/api/ModelTest`;

  constructor(private http: HttpClient) {}

  /**
   * Get available test datasets
   */
  getTestDatasets(): Observable<DatasetValidation[]> {
    return this.http.get<DatasetValidation[]>(`${this.baseUrl}/test-datasets`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Validate dataset compatibility with model
   */
  validateDataset(request: TestDatasetValidationRequest): Observable<boolean> {
    return this.http.post<boolean>(`${this.baseUrl}/validate-dataset`, request)
      .pipe(catchError(this.handleError));
  }

  /**
   * Start model testing
   */
  runTest(request: RunModelTestRequest): Observable<{ testId: number }> {
    return this.http.post<{ testId: number }>(`${this.baseUrl}/run-test`, request)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get test results
   */
  getTestResults(testId: number): Observable<TestResult> {
    return this.http.get<TestResult>(`${this.baseUrl}/results/${testId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Export test results
   */
  exportTestResults(testId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export/${testId}`, { 
      responseType: 'blob' 
    }).pipe(catchError(this.handleError));
  }

  /**
   * Get test history for a model
   */
  getTestHistory(modelInstanceId: number): Observable<TestResult[]> {
    return this.http.get<TestResult[]>(`${this.baseUrl}/history/${modelInstanceId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Cancel running test
   */
  cancelTest(testId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/cancel/${testId}`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unexpected error occurred during model testing.';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'Invalid request parameters.';
          break;
        case 404:
          errorMessage = 'Test dataset or model not found.';
          break;
        case 409:
          errorMessage = 'Test is already running for this model.';
          break;
        case 500:
          errorMessage = 'Server error occurred during testing.';
          break;
        default:
          errorMessage = error.error?.message || `Server error: ${error.status}`;
      }
    }
    
    console.error('Model test service error:', error);
    return throwError(() => new Error(errorMessage));
  }
} 