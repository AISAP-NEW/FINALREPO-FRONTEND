export interface DuplicateModelRequest {
  originalModelId: number;
  newModelName: string;
  copyVersions: boolean;
  copyFiles: boolean;
}

export interface DuplicateModelResponse {
  success: boolean;
  newModelId?: number;
  message?: string;
  errorDetails?: string;
}

export interface NameAvailabilityResponse {
  isAvailable: boolean;
  suggestedName?: string;
  message?: string;
} 