/**
 * Training configuration for starting a new training session
 */
export interface TrainingConfig {
  learningRate: number;
  epochs: number;
  batchSize: number;
  datasetValidationId: number;
}

/**
 * Represents a training session
 */
export interface TrainingSession {
  id: number;
  modelId: number;
  status: 'Queued' | 'In Progress' | 'Completed' | 'Failed' | 'Stopped';
  startTime: string;
  endTime?: string;
  learningRate?: number;
  epochs?: number;
  batchSize?: number;
  datasetValidationId?: number;
  createdBy?: string;
  lastModified?: string;
}

/**
 * Training metric for a specific epoch
 */
export interface TrainingMetric {
  id: number;
  sessionId: number;
  epoch: number;
  loss: number;
  accuracy?: number;
  timestamp: string;
}

/**
 * Current training progress
 */
export interface TrainingProgress {
  session: TrainingSession;
  metrics: TrainingMetric[];
  currentEpoch: number;
  totalEpochs: number;
  currentLoss: number;
  currentAccuracy?: number;
}
