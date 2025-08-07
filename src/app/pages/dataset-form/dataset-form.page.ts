import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DatasetService, CreateDatasetDTO } from '../../services/dataset.service';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-dataset-form',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/datasets"></ion-back-button>
        </ion-buttons>
        <ion-title>New Dataset</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <form [formGroup]="datasetForm" (ngSubmit)="onSubmit()" class="ion-padding">
        <ion-item>
          <ion-label position="floating">Dataset Name</ion-label>
          <ion-input formControlName="datasetName" type="text"></ion-input>
        </ion-item>
        <div *ngIf="datasetForm.get('datasetName')?.touched && datasetForm.get('datasetName')?.invalid" class="error-message">
          <ion-text color="danger" *ngIf="datasetForm.get('datasetName')?.errors?.['required']">
            Dataset name is required
          </ion-text>
        </div>

        <ion-item>
          <ion-label position="floating">Description</ion-label>
          <ion-textarea formControlName="description" rows="3"></ion-textarea>
        </ion-item>
        <div *ngIf="datasetForm.get('description')?.touched && datasetForm.get('description')?.invalid" class="error-message">
          <ion-text color="danger" *ngIf="datasetForm.get('description')?.errors?.['required']">
            Description is required
          </ion-text>
        </div>

        <ion-item>
          <ion-label>CSV Files</ion-label>
          <input type="file" (change)="onFileChange($event)" accept=".csv" multiple class="ion-padding-start">
        </ion-item>
        <div *ngIf="selectedFiles.length > 0" class="selected-files">
          <p>Selected files:</p>
          <ion-list>
            <ion-item *ngFor="let file of selectedFiles">
              <ion-label>{{ file.name }}</ion-label>
            </ion-item>
          </ion-list>
        </div>

        <ion-item>
          <ion-label>Thumbnail Image (Optional)</ion-label>
          <input type="file" (change)="onThumbnailChange($event)" accept="image/*" class="ion-padding-start">
        </ion-item>
        <div *ngIf="thumbnailPreview" class="thumbnail-preview">
          <img [src]="thumbnailPreview" alt="Thumbnail preview">
        </div>

        <div class="ion-padding-top">
          <ion-button expand="block" type="submit" [disabled]="!datasetForm.valid || selectedFiles.length === 0 || submitting">
            <ion-spinner *ngIf="submitting" name="dots"></ion-spinner>
            <span *ngIf="!submitting">Create Dataset</span>
            <span *ngIf="submitting">Creating Dataset...</span>
          </ion-button>
        </div>
      </form>
    </ion-content>
  `,
  styles: [`
    .error-message {
      padding: 8px 16px;
      color: var(--ion-color-danger);
      font-size: 14px;
    }

    .selected-files {
      padding: 16px;
      
      p {
        margin: 0 0 8px 0;
        font-weight: 500;
      }
    }

    .thumbnail-preview {
      padding: 16px;
      text-align: center;
      
      img {
        max-width: 200px;
        max-height: 200px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    }

    input[type="file"] {
      padding: 8px 0;
    }
  `],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule]
})
export class DatasetFormPage {
  datasetForm: FormGroup;
  selectedFiles: File[] = [];
  thumbnailFile: File | undefined;
  thumbnailPreview: string | null = null;
  submitting = false;

  constructor(
    private formBuilder: FormBuilder,
    private datasetService: DatasetService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.datasetForm = this.formBuilder.group({
      datasetName: ['', [Validators.required]],
      description: ['', [Validators.required]]
    });
  }

  onFileChange(event: Event) {
    const element = event.target as HTMLInputElement;
    if (element.files) {
      this.selectedFiles = Array.from(element.files);
    }
  }

  onThumbnailChange(event: Event) {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files[0]) {
      this.thumbnailFile = element.files[0];
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.thumbnailPreview = e.target?.result as string;
      };
      reader.readAsDataURL(element.files[0]);
    }
  }

  onSubmit() {
    if (this.datasetForm.valid && this.selectedFiles.length > 0) {
      this.submitting = true;
      const formValue = this.datasetForm.value;
      
      const data: CreateDatasetDTO = {
        datasetName: formValue.datasetName,
        description: formValue.description,
        csvFiles: this.selectedFiles,
        thumbnailImage: this.thumbnailFile
      };

      this.datasetService.createDataset(data).subscribe({
        next: (response) => {
          console.log('Dataset created:', response);
          this.toastService.presentToast('success', 'Dataset created successfully!');
          // Navigate back to datasets page
          this.router.navigate(['/datasets']);
        },
        error: (error) => {
          console.error('Error creating dataset:', error);
          this.toastService.presentToast('error', 'Failed to create dataset. Please try again.');
        },
        complete: () => {
          this.submitting = false;
        }
      });
    }
  }
} 