export interface TestResult {
  testResult_ID: number;
  modelInstance_ID: number;
  datasetValidation_ID: string;
  status: string;
  testName: string;
  errorMessage?: string;
  startTime: string;
  endTime?: string;
  createdBy: string;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  confusionMatrix?: string;
  testOutput?: string;
}

export interface TestDatasetValidationRequest {
  modelInstanceId: number;
  datasetId: string;
}

export interface RunModelTestRequest {
  modelInstanceId: number;
  datasetId: string;
  testName: string;
}

export interface DatasetValidation {
  DataValidId: string;
  DatasetName: string;
  Description?: string;
  RecordCount?: number;
  CreatedDate?: string;
  IsCompatible?: boolean;
}

export interface ModelInstance {
  ModelInstance_ID: number;
  ModelName: string;
  VersionNumber: string;
  Status: string;
  CreatedDate: string;
  Description?: string;
} 