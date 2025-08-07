import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModelService, ModelUploadRequest } from '../../services/model.service';
import { Dataset, DatasetService } from '../../services/dataset.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.service';
import { finalize } from 'rxjs/operators';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonSpinner,
  IonIcon,
  IonText,
  IonNote,
  IonButtons,
  IonBackButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cloudUploadOutline, trashOutline, folderOpenOutline } from 'ionicons/icons';

@Component({
  selector: 'app-model-upload',
  templateUrl: './model-upload.page.html',
  styleUrls: ['./model-upload.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonSpinner,
    IonIcon,
    IonText,
    IonNote,
    IonButtons,
    IonBackButton
  ]
})
export class ModelUploadPage implements OnInit {
  uploadForm: FormGroup;
  isDragging = false;
  selectedFile: File | null = null;
  frameworks = ['TensorFlow', 'PyTorch', 'Scikit-learn', 'ONNX', 'Other'];
  isLoading = false;
  datasets: Dataset[] = [];
  isDatasetsLoading = false;

  constructor(
    private fb: FormBuilder,
    private modelService: ModelService,
    private datasetService: DatasetService,
    private router: Router,
    private toastService: ToastService
  ) {
    addIcons({ cloudUploadOutline, trashOutline, folderOpenOutline });

    this.uploadForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      framework: ['', [Validators.required]],
      version: [''],
      datasetId: [''],
      tags: ['']
    });
  }

  ngOnInit() {
    console.log('Model upload page initialized');
    this.loadDatasets();
  }

  private loadDatasets() {
    console.log('Loading datasets...');
    this.isDatasetsLoading = true;
    this.datasetService.getAllDatasets().pipe(
      finalize(() => {
        this.isDatasetsLoading = false;
        console.log('Datasets loaded:', this.datasets);
      })
    ).subscribe({
      next: (datasets: Dataset[]) => {
        this.datasets = datasets || [];
      },
      error: (error: any) => {
        console.error('Error loading datasets:', error);
        this.toastService.presentToast('error' as any, 'Failed to load datasets. Please try again.');
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target?.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  private handleFile(file: File) {
    console.log('Handling file:', file.name, 'Size:', file.size);
    // Check file size (max 500MB)
    if (file.size > 500 * 1024 * 1024) {
      this.toastService.presentToast('error' as any, 'File is too large. Maximum size is 500MB.');
      return;
    }

    // Check file type - expanded to include script files
    const allowedTypes = ['.h5', '.pb', '.pt', '.pth', '.onnx', '.pkl', '.joblib', '.model', '.py', '.js', '.ts', '.ipynb'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(fileExtension)) {
      this.toastService.presentToast('warning' as any, 
        `Warning: Unrecognized file type (${fileExtension}). Supported types: ${allowedTypes.join(', ')}`);
    }

    this.selectedFile = file;
    console.log('File accepted:', file.name, 'Type:', fileExtension);
  }

  removeFile() {
    this.selectedFile = null;
  }

  onSubmit() {
    if (this.uploadForm.invalid || !this.selectedFile) {
      this.uploadForm.markAllAsTouched();
      if (!this.selectedFile) {
        this.toastService.presentToast('error' as any, 'Please select a model file to upload.');
      }
      return;
    }

    this.isLoading = true;

    const formValue = this.uploadForm.value;
    const formData = new FormData();
    formData.append('modelName', formValue.name);
    formData.append('description', formValue.description);
    formData.append('topicId', '2'); // Hardcoded for now, or make dynamic if needed
    formData.append('codeFile', this.selectedFile!);

    fetch('http://localhost:5183/api/ModelFile/create-model-with-file', {
      method: 'POST',
      body: formData
    })
      .then(async response => {
        this.isLoading = false;
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to upload model.');
        }
        this.toastService.presentToast('success' as any, 'Model uploaded successfully!');
        this.router.navigate(['/models']);
      })
      .catch(error => {
        this.isLoading = false;
        this.toastService.presentToast('error' as any, error.message || 'Failed to upload model.');
      });
  }
}
