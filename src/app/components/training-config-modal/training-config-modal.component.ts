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
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import { DatasetService, Dataset } from '../../services/dataset.service';

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
    IonNote
  ],
  providers: [DatasetService]
})
export class TrainingConfigModalComponent implements OnInit {
  @Input() modelId!: number;
  @Input() modelVersionId!: number;
  
  allDatasets: Dataset[] = [];
  trainingForm: FormGroup;
  isLoading = false;

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
    this.loadAllDatasets();
  }

  loadAllDatasets() {
    console.log('Loading validated datasets...');
    this.isLoading = true;
    this.datasetService.getValidatedDatasets().subscribe({
      next: (datasets) => {
        console.log('Received validated datasets:', datasets);
        this.allDatasets = datasets;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading validated datasets:', error);
        this.isLoading = false;
      }
    });
  }

  onSubmit() {
    if (this.trainingForm.valid) {
      this.isLoading = true;
      const config = {
        modelId: this.modelId,
        modelVersionId: this.modelVersionId,
        learningRate: parseFloat(this.trainingForm.value.learningRate),
        epochs: parseInt(this.trainingForm.value.epochs, 10),
        batchSize: parseInt(this.trainingForm.value.batchSize, 10),
        datasetValidationId: this.trainingForm.value.datasetValidationId,
        notes: this.trainingForm.value.notes
      };

      this.modalController.dismiss(config);
    } else {
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
}
