import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { PreprocessOptions, TrainSplitRequest, ValidationResult, SplitResult, PreprocessResult } from '../models/dataset.models';

@Injectable({
  providedIn: 'root'
})
export class DatasetOperationsService {
  private readonly baseUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  // Data Validation
  validateDataset(datasetId: string): Observable<ValidationResult> {
    return this.http.post<ValidationResult>(
      `${this.baseUrl}/Dataset/validate/${datasetId}`, 
      {}
    ).pipe(
      map(response => ({
        ...response,
        status: response.status as 'Passed' | 'Failed'
      }))
    );
  }

  // Train/Test Split
  splitDataset(
    datasetId: string, 
    trainRatio: number, 
    testRatio: number,
    options: { shuffle?: boolean, stratifyBy?: string } = {}
  ): Observable<SplitResult> {
    const request: TrainSplitRequest = {
      trainRatio,
      testRatio,
      shuffle: options.shuffle,
      stratifyBy: options.stratifyBy
    };

    return this.http.post<SplitResult>(
      `${this.baseUrl}/Dataset/train-split/${datasetId}`,
      request
    );
  }

  // Data Preprocessing
  preprocessDataset(
    datasetId: string, 
    options: PreprocessOptions
  ): Observable<PreprocessResult> {
    return this.http.post<PreprocessResult>(
      `${this.baseUrl}/Preprocess/preprocess-by-id?datasetId=${datasetId}`,
      options
    );
  }

  /**
   * Fetches a preview of the dataset
   * @param datasetId The ID of the dataset to preview
   * @param rows Number of rows to fetch (default: 100)
   * @returns Observable with preview data in a consistent format
   */
  getDatasetPreview(datasetId: string, rows: number = 100): Observable<any> {
    console.log(`Fetching preview for dataset ${datasetId}, rows: ${rows}`);
    
    return this.http.get(`${this.baseUrl}/Dataset/${datasetId}/preview?rows=${rows}`).pipe(
      map(response => {
        console.log('Raw preview response:', response);
        
        // If response is already in the expected format, return as is
        if (response && typeof response === 'object' && 'preview' in response) {
          console.log('Response already has preview property');
          return response;
        }
        
        // If response is an array, wrap it in the expected format
        if (Array.isArray(response)) {
          console.log('Response is an array, wrapping in preview object');
          return {
            preview: {
              data: response,
              totalPreviewRows: response.length,
              headers: response.length > 0 ? Object.keys(response[0]) : []
            }
          };
        }
        
        // If response is an object with data/headers, convert to expected format
        if (response && typeof response === 'object' && 'data' in response) {
          console.log('Response has data property, normalizing format');
          const responseData = response as { 
            data: any[], 
            totalRows?: number, 
            totalPreviewRows?: number,
            headers?: string[] 
          };
          
          // Ensure data is an array
          const dataArray = Array.isArray(responseData.data) ? responseData.data : [];
          
          // Get headers from first data row if not provided
          const headers = responseData.headers || 
                         (dataArray.length > 0 ? Object.keys(dataArray[0]) : []);
          
          return {
            preview: {
              data: dataArray,
              totalPreviewRows: responseData.totalPreviewRows || 
                               responseData.totalRows || 
                               dataArray.length,
              headers: headers
            }
          };
        }
        
        console.warn('Unexpected response format, returning empty preview');
        // Default fallback
        return {
          preview: {
            data: [],
            totalPreviewRows: 0,
            headers: []
          }
        };
      }),
      catchError(error => {
        console.error('Error fetching dataset preview:', error);
        return of({
          preview: {
            data: [],
            totalPreviewRows: 0
          }
        });
      })
    );
  }

  // Get dataset schema
  getDatasetSchema(datasetId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/Dataset/${datasetId}/schema`);
  }
}
