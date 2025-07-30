export interface VirtualMachine {
  id: number;
  name: string;
  hostAddress: string;
  status: string;
  cpuCores: number;
  memoryGB: number;
  gpuCount?: number;
  gpuType?: string;
  lastPing?: Date;
}

export interface ExperimentExecutionRequest {
  experimentId: number;
  virtualMachineId: number;
  modelType: string;
  parameters: Record<string, any>;
  modelFile?: File;
  customModelName?: string;
}

export interface ExperimentExecutionResult {
  experimentId: number;
  modelId: number;
  success: boolean;
  accuracy?: number;
  loss?: number;
  metrics: Record<string, any>;
  logs: string[];
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  status: string;
  errorMessage?: string;
  modelMetrics?: {
    accuracy: number;
    loss: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    confusionMatrix?: any[][];
  };
  executionDetails?: {
    vmId: number;
    vmName: string;
    executionTimeMs: number;
    memoryUsedMB: number;
  };
  outputFiles?: {
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
}

export interface ExperimentProgress {
  experimentId: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  currentStep: string;
  logs: string[];
  startTime: Date;
  estimatedTimeRemaining?: number; // in seconds
}
