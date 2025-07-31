import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  IonInput,
  IonCheckbox,
  IonGrid,
  IonRow,
  IonCol,
  IonText
} from '@ionic/angular/standalone';

import { ModelDuplicateService } from '../../services/model-duplicate.service';
import { NotificationService } from '../../services/notification.service';
import { 
  DuplicateModelRequest, 
  DuplicateModelResponse, 
  NameAvailabilityResponse 
} from '../../models/duplicate-request.model';
import { ModelInstance } from '../../models/test-result.model';

@Component({
  selector: 'app-model-duplication',
  templateUrl: './model-duplication.component.html',
  styleUrls: ['./model-duplication.component.scss'],
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
    IonInput,
    IonCheckbox,
    IonGrid,
    IonRow,
    IonCol,
    IonText
  ]
})
export class ModelDuplicationComponent implements OnInit {
  // Data properties
  availableModels: ModelInstance[] = [];
  selectedModel: ModelInstance | null = null;
  newModelName = '';
  isNameAvailable = false;
  isCheckingName = false;
  
  // State properties
  isDuplicating = false;
  isLoading = false;
  showErrorToast = false;
  errorMessage = '';
  
  // Form properties
  copyVersions = true;
  copyFiles = true;
  searchTerm = '';
  
  // Name validation
  nameValidationMessage = '';
  nameValidationColor = '';

  constructor(
    private modelDuplicateService: ModelDuplicateService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadAvailableModels();
  }

  /**
   * Load available models for duplication
   */
  async loadAvailableModels() {
    this.isLoading = true;
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
        },
        {
          ModelInstance_ID: 3,
          ModelName: 'Object Detection Model',
          VersionNumber: '1.5.0',
          Status: 'Trained',
          CreatedDate: '2024-01-25',
          Description: 'YOLO model for object detection'
        }
      ];
    } catch (error) {
      console.error('Failed to load available models:', error);
      this.showError('Failed to load available models');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Check name availability
   */
  async checkNameAvailability() {
    if (!this.newModelName.trim()) {
      this.resetNameValidation();
      return;
    }

    this.isCheckingName = true;
    this.resetNameValidation();

    try {
      const response = await this.modelDuplicateService.checkNameAvailability(this.newModelName).toPromise();
      this.isNameAvailable = response?.isAvailable || false;
      
      if (this.isNameAvailable) {
        this.nameValidationMessage = '✓ Name is available';
        this.nameValidationColor = 'success';
      } else {
        this.nameValidationMessage = '✗ Name is not available';
        this.nameValidationColor = 'danger';
      }
    } catch (error) {
      console.error('Failed to check name availability:', error);
      this.nameValidationMessage = 'Error checking name availability';
      this.nameValidationColor = 'warning';
      this.isNameAvailable = false;
    } finally {
      this.isCheckingName = false;
    }
  }

  /**
   * Get suggested name for duplicated model
   */
  async suggestName() {
    if (!this.selectedModel) {
      this.showError('Please select a model first');
      return;
    }

    try {
      const suggestedName = await this.modelDuplicateService.suggestName(this.selectedModel.ModelInstance_ID).toPromise();
      if (suggestedName) {
        this.newModelName = suggestedName;
        this.isNameAvailable = true;
        this.nameValidationMessage = '✓ Suggested name is available';
        this.nameValidationColor = 'success';
        this.notificationService.showSuccess('Suggested name applied');
      }
    } catch (error) {
      console.error('Failed to get suggested name:', error);
      this.showError('Failed to get suggested name');
    }
  }

  /**
   * Validate duplication request
   */
  async validateRequest(): Promise<boolean> {
    if (!this.selectedModel || !this.newModelName.trim()) {
      this.showError('Please select a model and enter a name');
      return false;
    }

    if (!this.isNameAvailable) {
      this.showError('Please choose an available model name');
      return false;
    }

    try {
      const request: DuplicateModelRequest = {
        originalModelId: this.selectedModel.ModelInstance_ID,
        newModelName: this.newModelName.trim(),
        copyVersions: this.copyVersions,
        copyFiles: this.copyFiles
      };

      const isValid = await this.modelDuplicateService.validateDuplicationRequest(request).toPromise();
      return isValid || false;
    } catch (error) {
      console.error('Validation failed:', error);
      this.showError('Validation failed');
      return false;
    }
  }

  /**
   * Duplicate the selected model
   */
  async duplicateModel() {
    const isValid = await this.validateRequest();
    if (!isValid) return;

    this.isDuplicating = true;

    try {
      const request: DuplicateModelRequest = {
        originalModelId: this.selectedModel!.ModelInstance_ID,
        newModelName: this.newModelName.trim(),
        copyVersions: this.copyVersions,
        copyFiles: this.copyFiles
      };

      const response = await this.modelDuplicateService.duplicateModel(request).toPromise();
      
      if (response?.success) {
        this.notificationService.showSuccess('Model duplicated successfully');
        this.resetForm();
      } else {
        throw new Error(response?.message || 'Duplication failed');
      }
    } catch (error) {
      console.error('Failed to duplicate model:', error);
      this.showError('Failed to duplicate model');
    } finally {
      this.isDuplicating = false;
    }
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
      case 'trained':
        return 'success';
      case 'training':
        return 'primary';
      case 'failed':
        return 'danger';
      case 'pending':
        return 'warning';
      default:
        return 'medium';
    }
  }

  /**
   * Reset name validation
   */
  private resetNameValidation() {
    this.nameValidationMessage = '';
    this.nameValidationColor = '';
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
    this.newModelName = '';
    this.isNameAvailable = false;
    this.copyVersions = true;
    this.copyFiles = true;
    this.searchTerm = '';
    this.resetNameValidation();
  }

  /**
   * Handle model selection change
   */
  onModelSelectionChange() {
    this.newModelName = '';
    this.isNameAvailable = false;
    this.resetNameValidation();
  }

  /**
   * Handle name input change
   */
  onNameInputChange() {
    // Debounce the name availability check
    setTimeout(() => {
      this.checkNameAvailability();
    }, 500);
  }
} 