import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModelService, ModelUploadRequest } from '../../services/model.service';
import { Dataset, DatasetService } from '../../services/dataset.service';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-model-upload',
  templateUrl: './model-upload.page.html',
  styleUrls: ['./model-upload.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule]
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
    this.uploadForm = this.fb.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      framework: ['', [Validators.required]],
      version: [''],
      datasetId: [''],
      tags: ['']
    });
  }

  ngOnInit() {
    this.loadDatasets();
  }

  private loadDatasets() {
    this.isDatasetsLoading = true;
    this.datasetService.getAllDatasets().pipe(
      finalize(() => this.isDatasetsLoading = false)
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
    // Check file size (max 500MB)
    if (file.size > 500 * 1024 * 1024) {
      this.toastService.presentToast('error' as any, 'File is too large. Maximum size is 500MB.');
      return;
    }

    this.selectedFile = file;
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
    const modelData: ModelUploadRequest = {
      modelName: formValue.name,  // Map form field to modelName
      description: formValue.description,
     
      version: formValue.version,
      datasetId: formValue.datasetId ? Number(formValue.datasetId) : undefined,
      file: this.selectedFile!,
      
    };

    this.modelService.uploadModel(modelData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.toastService.presentToast('success' as any, 'Model uploaded successfully!');
        this.router.navigate(['/models', response.id]);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error uploading model:', error);
        this.toastService.presentToast('error' as any, error.error?.message || 'Failed to upload model');
      }
    });
  }
}
