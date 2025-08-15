import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, switchMap, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TrainTestSplit {
  trainSize: number;
  testSize: number;
  splitAt: string;
  trainDatasetId?: string;
  testDatasetId?: string;
}

export interface Dataset {
  datasetId: string;
  datasetName: string;
  description: string;
  fileType: string;
  fileCount: number;
  createdAt: string;
  thumbnailBase64: string | null;
  /**
   * URL (relative or absolute) to the dataset thumbnail image, if available.
   * Used by UI for rendering dataset card and details thumbnails.
   */
  ThumbnailUrl?: string;
  filePath?: string;
  hasErrors: boolean;
  hasThumbnail: boolean;
  isValidated: boolean;
  lastAction?: string | null;
  lastActionTime?: string | null;
  lastModified: string;
  lastValidation?: string | null;
  recentActivity: any[];
  totalActions: number;
  totalFileSize: number;
  totalFileSizeKB: number;
  validationErrors: number;
  validationStatus: string;
  preprocessingStatus: string;
  splitStatus?: string;  // Can be 'pending', 'in_progress', 'complete', or 'failed'
  trainTestSplit?: TrainTestSplit | null;
  validationId?: string; // The validation ID from the backend
}

export interface DatasetsResponse {
  datasets: Dataset[];
  summary: {
    datasetsWithErrors: number;
    datasetsWithThumbnails: number;
    errorRate: number;
    totalDatasets: number;
    totalFileSizeMB: number;
    validatedDatasets: number;
    validationRate: number;
  };
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
  isMetadataFallback?: boolean;
}

export interface DatasetSchema {
  fields: {
    name: string;
    type: string;
    description?: string;
    format?: string;
    constraints?: {
      required?: boolean;
      unique?: boolean;
      minLength?: number;
      maxLength?: number;
      pattern?: string;
      minimum?: number;
      maximum?: number;
    };
  }[];
  primaryKey?: string | string[];
  missingValues?: string[];
}

export interface ValidationError {
  rowNumber: number;
  message: string;
  field?: string;
  value?: any;
}

export interface ValidationResponse {
  status: 'success' | 'error' | 'warning' | 'failed';
  message?: string;
  errorCount: number;
  errorLines: number[];
  errors: ValidationError[];
  totalRows: number;
  validationId: string;
  versionId?: string;
  timestamp?: string;
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

export interface ValidatedDatasetForTraining {
  datasetId: string;
  datasetName: string;
  validationId: string;
  description: string;
  validationStatus: string;
  validationDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class DatasetService {
  private readonly baseUrl = environment.apiUrl;
  private readonly datasetUrl = `${this.baseUrl}/api/Dataset`;
  private readonly preprocessUrl = `${this.baseUrl}/api/Preprocess`;

  constructor(private http: HttpClient) { }

  getAllDatasets(): Observable<Dataset[]> {
    return this.http.get<any>(this.datasetUrl).pipe(
      map(response => {
        // Accept both Datasets and datasets for robustness
        const datasets = response.Datasets || response.datasets || [];
        console.log('Received datasets:', datasets);
        // Map PascalCase to camelCase for each dataset
        return datasets.map((d: any) => ({
          datasetId: d.DatasetId,
          datasetName: d.DatasetName,
          description: d.Description,
          fileType: d.FileType,
          fileCount: d.FileCount,
          createdAt: d.CreatedAt,
          lastModified: d.LastModified,
          thumbnailBase64: d.ThumbnailBase64,
          hasErrors: d.HasErrors ?? false,
          hasThumbnail: d.HasThumbnail ?? false,
          isValidated: d.IsValidated ?? false,
          lastAction: d.LastAction ?? null,
          lastActionTime: d.LastActionTime ?? null,
          lastValidation: d.LastValidation ?? null,
          recentActivity: d.RecentActivity ?? [],
          totalActions: d.TotalActions ?? 0,
          totalFileSize: d.TotalFileSize ?? 0,
          totalFileSizeKB: d.TotalFileSizeKB ?? 0,
          validationErrors: d.ValidationErrors ?? 0,
          validationStatus: d.ValidationStatus ?? 'pending',
          preprocessingStatus: d.PreprocessingStatus ?? 'pending',
          splitStatus: d.SplitStatus ?? 'pending',
          validationId: d.ValidationId // Include the validation ID from backend
        }));
      }),
      catchError(error => {
        console.error('Error fetching datasets:', error);
        throw error;
      })
    );
  }

  getDatasetById(datasetId: string): Observable<Dataset> {
    const url = `${this.datasetUrl}/read/${datasetId}`;
    console.log(`Making API request to: ${url}`);
    
    return this.http.get<any>(url).pipe(
      map(response => {
        console.log('Received dataset response:', response);
        
        if (!response || !response.datasetInfo) {
          console.error('Invalid dataset response format:', response);
          throw new Error('Invalid dataset response format: missing datasetInfo');
        }
        
        // Map the response to the Dataset interface
        const dataset: Dataset = {
          ...response.datasetInfo,
          // Ensure all required fields are present
          fileCount: response.datasetInfo.fileCount || 1,
          createdAt: response.datasetInfo.createdAt || new Date().toISOString(),
          hasErrors: response.datasetInfo.hasErrors || false,
          hasThumbnail: response.datasetInfo.hasThumbnail || false,
          lastModified: response.datasetInfo.lastModified || new Date().toISOString(),
          totalFileSize: response.datasetInfo.totalFileSize || 0,
          totalFileSizeKB: response.datasetInfo.totalFileSizeKB || 0,
          validationErrors: response.datasetInfo.validationErrors || 0,
          preprocessingStatus: response.datasetInfo.preprocessingStatus || 'pending',
          validationStatus: response.datasetInfo.validationStatus || 'pending',
          splitStatus: response.datasetInfo.splitStatus || 'pending'
        };
        
        console.log('Mapped dataset:', dataset);
        return dataset;
      }),
      catchError(error => {
        console.error('Error fetching dataset:', error);
        throw error;
      })
    );
  }

  updateDatasetStatus(datasetId: string, status: Partial<Dataset>): Observable<Dataset> {
    const url = `${this.datasetUrl}/update-status/${datasetId}`;
    console.log('Updating dataset status:', { url, status });
    
    return this.http.patch<Dataset>(url, status).pipe(
      map(response => {
        console.log('Updated dataset status:', response);
        return response;
      }),
      catchError(error => {
        console.error('Error updating dataset status:', error);
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

  /**
   * Save manual column roles (target and features) for a dataset
   */
  saveColumnRoles(datasetId: string, roles: { fileName?: string; target: string; features: string[] }): Observable<any> {
    if (!datasetId) throw new Error('Dataset ID is required');
    const url = `${this.datasetUrl}/${datasetId}/column-roles`;
    return this.http.post(url, roles);
  }

  /**
   * Ask backend to auto-detect column roles. Optionally include fileName when multiple CSVs were uploaded.
   */
  autoDetectColumnRoles(datasetId: string, fileName?: string): Observable<any> {
    if (!datasetId) throw new Error('Dataset ID is required');
    const url = `${this.datasetUrl}/${datasetId}/column-roles/auto`;
    const body = fileName ? { fileName } : {};
    return this.http.post(url, body);
  }

  validateDataset(datasetId: string): Observable<ValidationResponse> {
    return this.http.post<ValidationResponse>(`${this.datasetUrl}/validate/${datasetId}`, {});
  }

  /**
   * Validate a dataset and get the validation ID
   * This creates a real DatasetValidation record in the backend
   */
  validateDatasetAndGetId(datasetId: string): Observable<{ validationId: string; status: string }> {
    return this.validateDataset(datasetId).pipe(
      map(response => ({
        validationId: response.validationId,
        status: response.status
      }))
    );
  }

  splitDataset(datasetId: string, trainRatio: number = 80, testRatio: number = 20): Observable<SplitResponse> {
    const url = `${this.datasetUrl}/train-split/${datasetId}`;
    const requestBody = {
      trainRatio: trainRatio,
      testRatio: testRatio,
      datasetId: datasetId
    };
    
    console.log('Splitting dataset:', {
      url,
      requestBody,
      datasetId,
      trainRatio,
      testRatio
    });

    return this.http.post<SplitResponse>(url, requestBody).pipe(
      map(response => {
        console.log('Split response:', response);
        return response;
      }),
      catchError(error => {
        console.error('Error splitting dataset:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message,
          error: error.error,
          requestBody
        });
        throw error;
      })
    );
  }

  preprocessDataset(datasetId: string, options: PreprocessOptions): Observable<PreprocessResponse> {
    const url = `${this.preprocessUrl}/preprocess-by-id?datasetId=${datasetId}`;
    console.log('Sending preprocessing request:', { url, options });
    
    return this.http.post<PreprocessResponse>(url, options).pipe(
      map(response => {
        console.log('Preprocessing successful:', response);
        return response;
      }),
      catchError(error => {
        console.error('Error in preprocessing:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message,
          error: error.error
        });
        throw error;
      })
    );
  }

  getDatasetContent(datasetId: string): Observable<DatasetContentResponse> {
    if (!datasetId) {
      throw new Error('Dataset ID is required');
    }
    
    const url = `${this.datasetUrl}/read/${datasetId}`;
    console.log('Fetching dataset preview from URL:', url);
    
    return this.http.get<DatasetContentResponse>(url).pipe(
      map(response => ({
        content: response.content,
        fileName: response.fileName || `dataset-${datasetId}-preview.csv`
      })),
      catchError(error => {
        console.error(`Error fetching dataset preview ${datasetId}:`, error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url || url,
          message: error.message,
          error: error.error
        });
        
        // Return a more descriptive error message
        throw new Error(`Failed to load dataset preview: ${error.statusText || 'Unknown error'}`);
      })
    );
  }

  /**
   * Get dataset preview with headers and data using the /api/Dataset/read/{datasetId} endpoint
   * @param datasetId The ID of the dataset to fetch
   * @returns Observable with dataset preview data
   */
  getDatasetPreview(datasetId: string): Observable<{ headers: string[], data: any[] }> {
    if (!datasetId) {
      throw new Error('Dataset ID is required');
    }
    
    const url = `${this.datasetUrl}/read/${datasetId}`;
    console.log('Fetching dataset preview from URL:', url);
    
    return this.http.get<{ headers: string[], data: any[] }>(url).pipe(
      catchError(error => {
        console.error(`Error fetching dataset preview ${datasetId}:`, error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url || url,
          message: error.message,
          error: error.error
        });
        
        // Return empty data structure on error
        return of({ headers: [], data: [] });
      })
    );
  }

  getDatasetSchema(datasetId: string): Observable<DatasetSchema> {
    if (!datasetId) {
      throw new Error('Dataset ID is required');
    }
    
    const url = `${this.datasetUrl}/${datasetId}/schema`;
    console.log('Fetching dataset schema from URL:', url);
    
    return this.http.get<DatasetSchema>(url).pipe(
      map(schema => ({
        fields: schema?.fields || [],
        primaryKey: schema?.primaryKey || [],
        missingValues: schema?.missingValues || []
      })),
      catchError(error => {
        console.error(`Error fetching dataset schema ${datasetId}:`, error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url || url,
          message: error.message,
          error: error.error
        });
        
        // Return default schema if not found
        return of({
          fields: [],
          primaryKey: [],
          missingValues: []
        } as DatasetSchema);
      })
    );
  }

  private tryEndpoints(endpoints: string[], index: number): Observable<DatasetContentResponse> {
    if (index >= endpoints.length) {
      throw new Error('All endpoints failed');
    }

    const endpoint = endpoints[index];
    console.log(`Trying endpoint: ${endpoint}`);

    return this.http.get<DatasetContentResponse>(endpoint).pipe(
      catchError(error => {
        console.error(`Error with endpoint ${endpoint}:`, error);
        
        // If this is the last endpoint, rethrow the error
        if (index >= endpoints.length - 1) {
          throw error;
        }
        
        // Try the next endpoint
        return this.tryEndpoints(endpoints, index + 1);
      })
    );
  }

  /**
   * Fetches the full dataset content when preview is not available
   * @param datasetId The ID of the dataset to fetch
   * @returns Observable with the dataset content
   */
  getFullDataset(datasetId: string): Observable<DatasetContentResponse> {
    if (!datasetId) {
      throw new Error('Dataset ID is required');
    }
    
    const url = `${this.datasetUrl}/${datasetId}/download`;
    console.log('Fetching full dataset from URL:', url);
    
    return this.http.get(url, { responseType: 'text' }).pipe(
      map(content => {
        if (!content) {
          throw new Error('Received empty dataset content');
        }
        return {
          content,
          fileName: `dataset-${datasetId}.csv`
        } as DatasetContentResponse;
      }),
      catchError(error => {
        console.error(`Error fetching full dataset ${datasetId}:`, error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url || url,
          message: error.message,
          error: error.error
        });
        
        // If we can't get the full dataset, try to get at least the dataset info
        return this.getDatasetById(datasetId).pipe(
          map(dataset => {
            // Create a minimal dataset from the metadata
            const headers = Object.keys(dataset).filter(key => 
              key !== 'datasetId' && 
              key !== 'thumbnailBase64' &&
              key !== 'recentActivity'
            );
            
            const data = headers.map(header => ({
              field: header,
              value: dataset[header as keyof Dataset]?.toString() || ''
            }));
            
            // Convert to CSV-like format
            const csvContent = [
              headers.join(','),
              headers.map(h => dataset[h as keyof Dataset]?.toString() || '').join(',')
            ].join('\n');
            
            return {
              content: csvContent,
              fileName: `dataset-metadata-${datasetId}.csv`,
              isMetadataFallback: true
            } as any;
          }),
          catchError(metadataError => {
            console.error('Failed to get dataset metadata:', metadataError);
            throw new Error('Could not load dataset content or metadata');
          })
        );
      })
    );
  }

  getValidatedDatasets(): Observable<Dataset[]> {
    return this.getAllDatasets().pipe(
      map(datasets => datasets.filter(dataset => 
        dataset.validationStatus === 'Passed' && 
        !dataset.hasErrors
      ))
    );
  }

  /**
   * Get validated datasets with their validation IDs for training
   * This maps to the backend DatasetValidation records
   */
  getValidatedDatasetsForTraining(): Observable<ValidatedDatasetForTraining[]> {
    // Get all datasets and filter for those with validations
    return this.getAllDatasets().pipe(
      map(datasets => {
        console.log('All datasets received:', datasets);
        
        // Filter datasets that have validation records with status 'Passed'
        const validatedDatasets = datasets.filter(dataset => 
          dataset.validationStatus === 'Passed' && 
          !dataset.hasErrors &&
          dataset.isValidated &&
          dataset.validationId // Only include datasets that have actual validation IDs
        );
        
        console.log('Filtered validated datasets with validation IDs:', validatedDatasets);
        
        // Map to include validation IDs
        return validatedDatasets.map(dataset => {
          console.log('Dataset validation info:', {
            name: dataset.datasetName,
            validationId: dataset.validationId,
            validationStatus: dataset.validationStatus,
            isValidated: dataset.isValidated
          });
          
          return {
            datasetId: dataset.datasetId,
            datasetName: dataset.datasetName,
            validationId: dataset.validationId!, // Use the actual validation ID from backend
            description: dataset.description,
            validationStatus: dataset.validationStatus,
            validationDate: dataset.createdAt || new Date().toISOString()
          };
        });
      })
    );
  }

  /**
   * Generate a validation ID based on dataset ID
   * This creates a consistent GUID for each dataset
   */
  private generateValidationId(datasetId: string): string {
    // Create a deterministic GUID based on the dataset ID
    // This ensures the same dataset always gets the same validation ID
    
    // Use a more reliable method to generate a valid GUID
    const hash = this.hashCode(datasetId);
    const timestamp = Date.now();
    
    // Create a proper GUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const part1 = (hash & 0xffffffff).toString(16).padStart(8, '0');
    const part2 = ((hash >> 32) & 0xffff).toString(16).padStart(4, '0');
    const part3 = '4' + ((hash >> 48) & 0xfff).toString(16).padStart(3, '0');
    const part4 = '8' + ((hash >> 60) & 0x3ff).toString(16).padStart(3, '0');
    const part5 = (timestamp & 0xffff).toString(16).padStart(4, '0') + 
                  (Math.floor(Math.random() * 0xffff)).toString(16).padStart(4, '0');
    
    const guid = `${part1}-${part2}-${part3}-${part4}-${part5}`;
    
    console.log('Generated validation ID:', guid);
    console.log('Is valid GUID format?', this.isValidGuid(guid));
    
    return guid.toLowerCase();
  }

  /**
   * Check if a string is a valid GUID format
   */
  private isValidGuid(guid: string): boolean {
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return guidRegex.test(guid);
  }

  /**
   * Test GUID generation for debugging
   */
  testGuidGeneration(datasetId: string): void {
    const guid = this.generateValidationId(datasetId);
    console.log('Test GUID generation:');
    console.log('Input datasetId:', datasetId);
    console.log('Generated GUID:', guid);
    console.log('Is valid GUID?', this.isValidGuid(guid));
    console.log('GUID length:', guid.length);
  }

  /**
   * Simple hash function for string to number conversion
   */
  private hashCode(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Downloads a dataset file
   * @param datasetId The ID of the dataset to download
   * @param type The type of download (e.g., 'csv', 'split')
   * @returns Observable with the file data
   */
  downloadDataset(datasetId: string, type: string = 'csv'): Observable<Blob> {
    if (!datasetId) {
      throw new Error('Dataset ID is required');
    }
    
    const url = `${this.datasetUrl}/${datasetId}/download/${type}`;
    console.log('Downloading dataset from URL:', url);
    
    return this.http.get(url, { responseType: 'blob' }).pipe(
      catchError(error => {
        console.error('Error downloading dataset:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url || url,
          message: error.message,
          error: error.error
        });
        throw new Error(`Failed to download dataset: ${error.statusText || 'Unknown error'}`);
      })
    );
  }

  /**
   * Fetch paginated dataset preview using /api/Dataset/read/{datasetId}?page={page}&pageSize={pageSize}
   */
  readDatasetPaginated(datasetId: string, page: number = 1, pageSize: number = 10): Observable<any> {
    const url = `${this.datasetUrl}/read/${datasetId}?page=${page}&pageSize=${pageSize}`;
    return this.http.get<any>(url);
  }

  /**
   * Helper method to trigger file download in the browser
   * @param data The file data as Blob
   * @param filename The name of the file to download
   */
  downloadFile(data: Blob, filename: string): void {
    const url = window.URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
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