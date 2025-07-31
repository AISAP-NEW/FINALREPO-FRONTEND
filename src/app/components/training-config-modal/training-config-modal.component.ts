import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonSpinner,
  IonButtons,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonNote,
  ModalController,
  IonCard,
  IonCardContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import { DatasetService, Dataset } from '../../services/dataset.service';

export interface ValidatedDataset {
  datasetId: string;
  datasetName: string;
  validationId: string; // This is the DatasetValidationId that the backend expects
  description: string;
  validationStatus: string;
}

@Component({
  selector: 'app-training-config-modal',
  templateUrl: './training-config-modal.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonSpinner,
    IonButtons,
    IonSelect,
    IonSelectOption,
    IonInput,
    IonNote,
    IonCard,
    IonCardContent
  ],
  providers: [DatasetService]
})
export class TrainingConfigModalComponent implements OnInit {
  @Input() modelId!: number;
  @Input() modelVersionId!: number;
  
  validatedDatasets: ValidatedDataset[] = [];
  trainingForm: FormGroup;
  isLoading = false;
  error: string = '';

  // Default values
  batchSizes = [16, 32, 64];
  epochsOptions = [10, 50, 100];

  constructor(
    private formBuilder: FormBuilder,
    private modalController: ModalController,
    private datasetService: DatasetService
  ) {
    addIcons({ closeOutline });

    this.trainingForm = this.formBuilder.group({
      learningRate: [0.001, [Validators.required, Validators.min(0.0001), Validators.max(1)]],
      epochs: [50, [Validators.required]],
      batchSize: [32, [Validators.required]],
      datasetValidationId: [null, [Validators.required]],
      notes: ['']
    });
  }

  ngOnInit() {
    console.log('Training config modal initialized');
    this.loadValidatedDatasets();
  }

  /**
   * Load validated datasets that can be used for training
   * Only datasets with validation status 'Passed' should be available
   */
  loadValidatedDatasets() {
    console.log('Loading validated datasets...');
    this.isLoading = true;
    this.error = '';
    
    this.datasetService.getValidatedDatasets().subscribe({
      next: (datasets: Dataset[]) => {
        console.log('Received validated datasets:', datasets);
        
        // Filter and map datasets to include validation ID
        this.validatedDatasets = datasets
          .filter(dataset => 
            dataset.validationStatus === 'Passed' && 
            !dataset.hasErrors &&
            dataset.isValidated
          )
          .map(dataset => ({
            datasetId: dataset.datasetId,
            datasetName: dataset.datasetName,
            validationId: dataset.datasetId, // For now, use datasetId as validationId
            description: dataset.description,
            validationStatus: dataset.validationStatus
          }));
        
        console.log('Filtered validated datasets:', this.validatedDatasets);
        this.isLoading = false;
        
        if (this.validatedDatasets.length === 0) {
          this.error = 'No validated datasets available. Please validate a dataset before starting training.';
        }
      },
      error: (error) => {
        console.error('Error loading validated datasets:', error);
        this.error = 'Failed to load validated datasets. Please try again.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Submit training configuration
   * Maps to backend StartTrainingDTO interface
   */
  onSubmit() {
    if (this.trainingForm.valid) {
      this.isLoading = true;
      
      // Get the selected dataset
      const selectedValidationId = this.trainingForm.value.datasetValidationId;
      const selectedDataset = this.validatedDatasets.find(ds => ds.validationId === selectedValidationId);
      
      if (!selectedDataset) {
        this.error = 'Please select a valid dataset for training.';
        this.isLoading = false;
        return;
      }
      
      const config = {
        modelId: this.modelId,
        modelVersionId: this.modelVersionId,
        learningRate: parseFloat(this.trainingForm.value.learningRate),
        epochs: parseInt(this.trainingForm.value.epochs, 10),
        batchSize: parseInt(this.trainingForm.value.batchSize, 10),
        datasetValidationId: selectedDataset.validationId, // This maps to DatasetValidationId in backend
        trainingParameters: JSON.stringify({
          learningRate: parseFloat(this.trainingForm.value.learningRate),
          epochs: parseInt(this.trainingForm.value.epochs, 10),
          batchSize: parseInt(this.trainingForm.value.batchSize, 10)
        }),
        notes: this.trainingForm.value.notes || ''
      };

      console.log('Submitting training configuration:', config);
      this.modalController.dismiss(config);
    } else {
      // Mark all invalid fields as touched to show validation errors
      Object.keys(this.trainingForm.controls).forEach(key => {
        const control = this.trainingForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
    }
  }

  onDismiss() {
    this.modalController.dismiss();
  }

  /**
   * Retry loading datasets
   */
  retryLoadDatasets() {
    this.error = '';
    this.loadValidatedDatasets();
  }
}
