import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProcessingOptions {
  // Validation options could be expanded later
  // Preprocess options
  handleMissingValues?: boolean;
  removeDuplicates?: boolean;
  fixDataTypes?: boolean;
  scalingMethod?: string;
  // Split options
  trainRatio?: number; // 70..90
  testRatio?: number; // 10..30
  randomSeed?: number;
  stratify?: boolean;
}

export interface ValidationRequest {
  TargetColumn: string;
  FeatureColumns: string[];
}

export interface PreprocessRequest {
  TargetColumn: string;
  FeatureColumns: string[];
  PreprocessOptions: {
    HandleMissingValues: boolean;
    RemoveDuplicates: boolean;
    FixDataTypes: boolean;
    ScalingMethod: string;
  };
}

export interface SplitRequest {
  TargetColumn: string;
  FeatureColumns: string[];
  TrainSplitOptions: {
    TrainRatio: number;
    TestRatio: number;
    RandomSeed: number;
    Stratify: boolean;
  };
}

export interface ValidationResponse {
  Id: string;
  DatasetId: string;
  CsvFileId: number;
  TargetColumn: string;
  FeatureColumns: string;
  IsValid: boolean;
  ErrorMessage: string | null;
  TotalRows: number;
  TotalColumns: number;
  ErrorCount: number;
  QualityScore: number;
  CreatedAt: string;
}

export interface PreprocessResponse {
  Id: string;
  DatasetId: string;
  CsvFileId: number;
  TargetColumn: string;
  FeatureColumns: string;
  Success: boolean;
  OriginalRowCount: number;
  ProcessedRowCount: number;
  OriginalColumnCount: number;
  ProcessedColumnCount: number;
  RowsRemoved: number;
  ColumnsRemoved: number;
  OperationsPerformed: string;
  PreprocessedFilePath: string;
  ErrorMessage: string | null;
  CreatedAt: string;
}

export interface SplitResponse {
  Id: string;
  DatasetId: string;
  CsvFileId: number;
  TargetColumn: string;
  FeatureColumns: string;
  Success: boolean;
  ErrorMessage: string | null;
  TrainingRowCount: number;
  TestRowCount: number;
  TrainingFilePath: string;
  TestFilePath: string;
  SplitRatio: string;
  RandomSeed: number;
  Stratified: boolean;
  CreatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class FeatureTargetProcessingService {
  private base = `${environment.apiUrl}/api/FeatureTargetProcessing`;

  constructor(private http: HttpClient) {}

  validate(datasetId: string, targetColumn: string, featureColumns: string[]): Observable<ValidationResponse> {
    const request: ValidationRequest = { TargetColumn: targetColumn, FeatureColumns: featureColumns };
    return this.http.post<ValidationResponse>(`${this.base}/validate/${datasetId}`, request);
  }

  preprocess(datasetId: string, targetColumn: string, featureColumns: string[], options: ProcessingOptions = {}): Observable<PreprocessResponse> {
    const request: PreprocessRequest = {
      TargetColumn: targetColumn,
      FeatureColumns: featureColumns,
      PreprocessOptions: {
        HandleMissingValues: options.handleMissingValues ?? true,
        RemoveDuplicates: options.removeDuplicates ?? true,
        FixDataTypes: options.fixDataTypes ?? true,
        ScalingMethod: options.scalingMethod ?? 'standard'
      }
    };
    return this.http.post<PreprocessResponse>(`${this.base}/preprocess/${datasetId}`, request);
  }

  split(datasetId: string, targetColumn: string, featureColumns: string[], options: ProcessingOptions = {}): Observable<SplitResponse> {
    const request: SplitRequest = {
      TargetColumn: targetColumn,
      FeatureColumns: featureColumns,
      TrainSplitOptions: {
        TrainRatio: options.trainRatio ?? 80,
        TestRatio: options.testRatio ?? 20,
        RandomSeed: options.randomSeed ?? 42,
        Stratify: options.stratify ?? true
      }
    };
    return this.http.post<SplitResponse>(`${this.base}/split/${datasetId}`, request);
  }

  processAll(datasetId: string, targetColumn: string, featureColumns: string[], options: ProcessingOptions = {}): Observable<any> {
    // For now, we'll chain the operations since there's no single endpoint
    // This could be enhanced with a proper processAll endpoint later
    return this.http.post(`${this.base}/process/${datasetId}`, {
      TargetColumn: targetColumn,
      FeatureColumns: featureColumns,
      Options: options
    });
  }
}


