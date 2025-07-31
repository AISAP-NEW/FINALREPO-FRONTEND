import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { 
  IonButton, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent, 
  IonSelect, 
  IonSelectOption, 
  IonSpinner, 
  IonIcon, 
  IonBadge, 
  IonItem, 
  IonLabel, 
  IonList, 
  IonToast,
  IonProgressBar,
  IonGrid,
  IonRow,
  IonCol,
  IonText
} from '@ionic/angular/standalone';

import { ModelTestService } from '../../services/model-test.service';
import { NotificationService } from '../../services/notification.service';
import { 
  TestResult, 
  TestDatasetValidationRequest, 
  RunModelTestRequest, 
  DatasetValidation, 
  ModelInstance 
} from '../../models/test-result.model';

@Component({
  selector: 'app-model-testing',
  templateUrl: './model-testing.component.html',
  styleUrls: ['./model-testing.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonIcon,
    IonBadge,
    IonItem,
    IonLabel,
    IonList,
    IonToast,
    IonProgressBar,
    IonGrid,
    IonRow,
    IonCol,
    IonText
  ]
})
export class ModelTestingComponent implements OnInit, OnDestroy {
  // Data properties
  testDatasets: DatasetValidation[] = [];
  availableModels: ModelInstance[] = [];
  selectedDataset: DatasetValidation | null = null;
  selectedModel: ModelInstance | null = null;
  testResults: TestResult | null = null;
  
  // State properties
  isTestRunning = false;
  isValidationRunning = false;
  isLoading = false;
  testId: number | null = null;
  validationResult: boolean | null = null;
  
  // UI properties
  searchTerm = '';
  statusFilter = 'all';
  showErrorToast = false;
  errorMessage = '';
  
  // Polling
  private pollSubscription?: Subscription;
  private pollInterval = 2000; // 2 seconds
  
  // Make Object available in template
  protected readonly Object = Object;

  constructor(
    private modelTestService: ModelTestService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadInitialData();
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  /**
   * Load initial data
   */
  async loadInitialData() {
    this.isLoading = true;
    try {
      await Promise.all([
        this.loadTestDatasets(),
        this.loadAvailableModels()
      ]);
    } catch (error) {
      this.showError('Failed to load initial data');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Load available test datasets
   */
  async loadTestDatasets() {
    try {
      this.testDatasets = await this.modelTestService.getTestDatasets().toPromise() || [];
    } catch (error) {
      console.error('Failed to load test datasets:', error);
      this.showError('Failed to load test datasets');
    }
  }

  /**
   * Load available models
   */
  async loadAvailableModels() {
    try {
      // This would typically come from your model service
      // For now, we'll create some mock data
      this.availableModels = [
        {
          ModelInstance_ID: 1,
          ModelName: 'Image Classification Model',
          VersionNumber: '1.0.0',
          Status: 'Trained',
          CreatedDate: '2024-01-15',
          Description: 'CNN model for image classification'
        },
        {
          ModelInstance_ID: 2,
          ModelName: 'Text Sentiment Model',
          VersionNumber: '2.1.0',
          Status: 'Trained',
          CreatedDate: '2024-01-20',
          Description: 'BERT model for sentiment analysis'
        }
      ];
    } catch (error) {
      console.error('Failed to load available models:', error);
      this.showError('Failed to load available models');
    }
  }

  /**
   * Validate dataset compatibility
   */
  async validateDataset() {
    if (!this.selectedModel || !this.selectedDataset) {
      this.showError('Please select both a model and dataset');
      return;
    }

    this.isValidationRunning = true;
    this.validationResult = null;

    try {
      const request: TestDatasetValidationRequest = {
        modelInstanceId: this.selectedModel.ModelInstance_ID,
        datasetId: this.selectedDataset.DataValidId
      };

      const isValid = await this.modelTestService.validateDataset(request).toPromise();
      this.validationResult = isValid;

      if (isValid) {
        this.notificationService.showSuccess('Dataset is compatible with the model');
      } else {
        this.notificationService.showWarning('Dataset may not be compatible with this model');
      }
    } catch (error) {
      console.error('Validation failed:', error);
      this.showError('Dataset validation failed');
    } finally {
      this.isValidationRunning = false;
    }
  }

  /**
   * Start model testing
   */
  async runTest() {
    if (!this.selectedModel || !this.selectedDataset) {
      this.showError('Please select both a model and dataset');
      return;
    }

    this.isTestRunning = true;
    this.testResults = null;

    try {
      const request: RunModelTestRequest = {
        modelInstanceId: this.selectedModel.ModelInstance_ID,
        datasetId: this.selectedDataset.DataValidId,
        testName: `Test_${this.selectedModel.ModelName}_${Date.now()}`
      };

      const response = await this.modelTestService.runTest(request).toPromise();
      this.testId = response?.testId || null;

      if (this.testId) {
        this.notificationService.showSuccess('Test started successfully');
        this.startPolling();
      } else {
        throw new Error('No test ID received');
      }
    } catch (error) {
      console.error('Failed to start test:', error);
      this.showError('Failed to start test');
      this.isTestRunning = false;
    }
  }

  /**
   * Start polling for test results
   */
  private startPolling() {
    if (!this.testId) return;

    this.pollSubscription = interval(this.pollInterval).subscribe(async () => {
      try {
        const results = await this.modelTestService.getTestResults(this.testId!).toPromise();
        
        if (results) {
          this.testResults = results;
          
          if (results.status === 'Completed' || results.status === 'Failed') {
            this.stopPolling();
            this.isTestRunning = false;
            
            if (results.status === 'Completed') {
              this.notificationService.showSuccess('Test completed successfully');
            } else {
              this.showError(`Test failed: ${results.errorMessage || 'Unknown error'}`);
            }
          }
        }
      } catch (error) {
        console.error('Error polling test results:', error);
      }
    });
  }

  /**
   * Stop polling
   */
  private stopPolling() {
    if (this.pollSubscription) {
      this.pollSubscription.unsubscribe();
      this.pollSubscription = undefined;
    }
  }

  /**
   * Cancel running test
   */
  async cancelTest() {
    if (!this.testId) return;

    try {
      await this.modelTestService.cancelTest(this.testId).toPromise();
      this.stopPolling();
      this.isTestRunning = false;
      this.notificationService.showSuccess('Test cancelled successfully');
    } catch (error) {
      console.error('Failed to cancel test:', error);
      this.showError('Failed to cancel test');
    }
  }

  /**
   * Export test results
   */
  async exportResults() {
    if (!this.testId) return;

    try {
      const blob = await this.modelTestService.exportTestResults(this.testId).toPromise();
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `test_results_${this.testId}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export results:', error);
      this.showError('Failed to export test results');
    }
  }

  /**
   * Get filtered datasets
   */
  get filteredDatasets(): DatasetValidation[] {
    return this.testDatasets.filter(dataset => 
      dataset.DatasetName.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  /**
   * Get filtered models
   */
  get filteredModels(): ModelInstance[] {
    return this.availableModels.filter(model => 
      model.ModelName.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  /**
   * Get status badge color
   */
  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'running':
      case 'inprogress':
        return 'primary';
      case 'failed':
      case 'error':
        return 'danger';
      case 'cancelled':
        return 'warning';
      default:
        return 'medium';
    }
  }

  /**
   * Show error message
   */
  private showError(message: string) {
    this.errorMessage = message;
    this.showErrorToast = true;
  }

  /**
   * Dismiss error toast
   */
  dismissError() {
    this.showErrorToast = false;
  }

  /**
   * Reset form
   */
  resetForm() {
    this.selectedModel = null;
    this.selectedDataset = null;
    this.testResults = null;
    this.validationResult = null;
    this.stopPolling();
    this.isTestRunning = false;
    this.isValidationRunning = false;
  }
} 