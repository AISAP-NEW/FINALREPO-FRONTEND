import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Dataset {
  datasetId: string;
  datasetName: string;
  description: string;
  fileType: string;
  fileCount: number;
  createdAt: string;
  thumbnailBase64: string | null;
  filePath: string;
}

export interface JsonNetResponse<T> {
  $id: string;
  $values: T[];
}

export interface JsonNetArrayResponse<T> extends JsonNetResponse<T> {
  $values: T[];
}

export interface SchemaInfo {
  columns: {
    name: string;
    type: string;
    nullable: boolean;
    statistics?: {
      min?: number;
      max?: number;
      mean?: number;
      uniqueCount?: number;
      nullCount?: number;
    };
  }[];
  rowCount: number;
  fileSize: number;
}

export interface DatasetResponse {
  metadata: Dataset;
  preview: JsonNetArrayResponse<string> | string[];
  thumbnailBase64: string | null;
  schema?: SchemaInfo;
}

export interface DatasetContentResponse {
  content: string;
  fileName: string;
}

export interface ValidationResponse {
  status: string;
  errorCount: number;
  errorLines: number[];
  totalRows: number;
  validationId: string;
}

export interface SplitResponse {
  message: string;
  trainFileName: string;
  testFileName: string;
  trainCount: number;
  testCount: number;
  splitId: string;
  versionId: string;
  validationId: string;
}

export interface PreprocessOptions {
  handleMissingValues: boolean;
  removeDuplicates: boolean;
  fixDataTypes: boolean;
  scalingMethod?: string;
}

export interface PreprocessResult {
  original: string;
  cleaned: string;
}

export interface PreprocessResponse {
  message: string;
  datasetId: string;
  results: PreprocessResult[];
}

export interface PreprocessingStatistics {
  removedNullCount: number;
  removedOutliersCount: number;
  normalizedColumns: string[];
}

export interface PreprocessedData {
  originalData: any[];
  processedData: any[];
  statistics: PreprocessingStatistics;
}

export interface CreateDatasetDTO {
  datasetName: string;
  description: string;
  csvFiles: File[];
  thumbnailImage?: File;
}

@Injectable({
  providedIn: 'root'
})
export class DatasetService {
  private readonly baseUrl = 'http://localhost:5183/api';
  private readonly datasetUrl = `${this.baseUrl}/Dataset`;
  private readonly preprocessUrl = `${this.baseUrl}/Preprocess`;

  constructor(private http: HttpClient) { }

  getAllDatasets(): Observable<Dataset[]> {
    return this.http.get<Dataset[]>(this.datasetUrl).pipe(
      map(response => {
        console.log('Received datasets:', response);
        return response;
      }),
      catchError(error => {
        console.error('Error fetching datasets:', error);
        throw error;
      })
    );
  }

  getDatasetById(datasetId: string): Observable<Dataset> {
    console.log(`Making API request to: ${this.datasetUrl}/${datasetId}`);
    return this.http.get<Dataset>(`${this.datasetUrl}/${datasetId}`).pipe(
      map(response => {
        console.log('Received dataset:', response);
        return response;
      }),
      catchError(error => {
        console.error('Error fetching dataset:', error);
        throw error;
      })
    );
  }

  createDataset(data: CreateDatasetDTO): Observable<{ message: string; datasetId: string }> {
    const formData = new FormData();
    formData.append('datasetName', data.datasetName);
    formData.append('description', data.description);
    
    data.csvFiles.forEach(file => {
      formData.append('csvFiles', file);
    });

    if (data.thumbnailImage) {
      formData.append('thumbnailImage', data.thumbnailImage);
    }

    return this.http.post<{ message: string; datasetId: string }>(`${this.datasetUrl}/define`, formData);
  }

  validateDataset(datasetId: string): Observable<ValidationResponse> {
    return this.http.post<ValidationResponse>(`${this.datasetUrl}/validate/${datasetId}`, {});
  }

  splitDataset(datasetId: string, trainRatio: number = 0.8): Observable<SplitResponse> {
    return this.http.post<SplitResponse>(`${this.datasetUrl}/split/${datasetId}?trainRatio=${trainRatio}`, {});
  }

  preprocessDataset(datasetId: string, options: PreprocessOptions): Observable<{ message: string; results: any[] }> {
    return this.http.post<{ message: string; results: any[] }>(
      `${this.preprocessUrl}/preprocess-by-id?datasetId=${datasetId}`,
      options
    );
  }

  getDatasetContent(datasetId: string): Observable<DatasetContentResponse> {
    if (!datasetId) {
      throw new Error('Dataset ID is required');
    }
    console.log('Fetching actual dataset content:', datasetId);
    return this.http.get<DatasetContentResponse>(`${this.datasetUrl}/${datasetId}/content`).pipe(
      catchError(error => {
        console.error(`Error fetching dataset content ${datasetId}:`, error);
        throw error;
      })
    );
  }

  downloadPreprocessedData(data: any[], filename: string = 'preprocessed-data.csv'): void {
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        }).join(',')
      )
    ];
    const csvContent = csvRows.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }
} 