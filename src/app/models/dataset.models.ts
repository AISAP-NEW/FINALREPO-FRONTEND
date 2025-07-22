export interface PreprocessOptions {
  handleMissingValues: boolean;
  removeDuplicates: boolean;
  fixDataTypes: boolean;
  scalingMethod?: string;
}

export interface TrainSplitRequest {
  trainRatio: number;
  testRatio: number;
  datasetVersionId?: string;
  shuffle?: boolean;
  stratifyBy?: string;
}

export interface ValidationResult {
  status: 'Passed' | 'Failed' | 'Not Validated';
  errorCount: number;
  errorLines: number[];
  totalRows: number;
  validationId: string;
  versionId: string;
  details?: {
    nullValues?: Record<string, number>;
    duplicates?: number;
    outliers?: Record<string, number[]>;
    typeErrors?: Record<string, string[]>;
    customErrors?: Record<string, string[]>
  };
}

export interface SplitResult {
  message: string;
  versionId: string;
  trainCount: number;
  testCount: number;
  trainPercentage: number;
  testPercentage: number;
}

export interface PreprocessResult {
  message: string;
  datasetId: string;
  results: Array<{
    original: string;
    cleaned: string;
  }>;
}
