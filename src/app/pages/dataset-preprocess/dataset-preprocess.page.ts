import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { DatasetService, PreprocessOptions } from '../../services/dataset.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastService, ToastType } from '../../services/toast.service';

/**
 * Dataset Preprocess Page Component
 *
 * This component handles the preprocessing of a dataset. It provides a form for the user to select
 * preprocessing options and displays the results of the preprocessing process.
 */
/**
 * 🧠 Preprocessing Page — AI Model Management System
 * 
 * ✅ Purpose:
 * - Provide UI to run preprocessing on a dataset.
 * - Interact with backend endpoint: POST /Preprocess/preprocess-by-id?datasetId={id}
 * 
 * ✅ Backend Requirements:
 * - Endpoint accepts: PreprocessOptions (handleMissingValues, removeDuplicates, fixDataTypes, scalingMethod)
 * - Returns: { message, datasetId, results[] }
 * 
 * ✅ Component Features:
 * - Angular Reactive Form to collect preprocessing options.
 * - Calls DatasetService.preprocessDataset(datasetId, options).
 * - Shows processing status, errors, and results.
 * 
 * 🛠️ Cursor Tasks:
 * - Check datasetId from ActivatedRoute.
 * - Bind form controls for options.
 * - Show result rows: original path + cleaned path.
 * - Show toast on success (optional).
 */

interface PreprocessResult {
  message: string;
  datasetId: string;
  results: Array<{
    original: string;
    cleaned: string;
  }>;
}

@Component({
  selector: 'app-dataset-preprocess',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/datasets"></ion-back-button>
        </ion-buttons>
        <ion-title>Preprocess Dataset</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <form [formGroup]="preprocessForm" (ngSubmit)="onSubmit()" class="ion-padding">
        <ion-list>
          <ion-item>
            <ion-checkbox formControlName="handleMissingValues">Handle Missing Values</ion-checkbox>
          </ion-item>
          <ion-item>
            <ion-checkbox formControlName="removeDuplicates">Remove Duplicates</ion-checkbox>
          </ion-item>
          <ion-item>
            <ion-checkbox formControlName="fixDataTypes">Fix Data Types</ion-checkbox>
          </ion-item>
          <ion-item>
            <ion-label>Scaling Method</ion-label>
            <ion-select formControlName="scalingMethod">
              <ion-select-option value="none">None</ion-select-option>
              <ion-select-option value="normalize">Normalize</ion-select-option>
              <ion-select-option value="standardize">Standardize</ion-select-option>
            </ion-select>
          </ion-item>
        </ion-list>

        <div class="ion-padding-top">
          <ion-button expand="block" type="submit" [disabled]="processing">
            {{ processing ? 'Processing...' : 'Process Dataset' }}
          </ion-button>
        </div>

        <div *ngIf="error" class="error-message ion-padding-top">
          <ion-text color="danger">{{ error }}</ion-text>
        </div>

        <div *ngIf="preprocessResults" class="ion-padding-top">
          <ion-card>
            <ion-card-header>
              <ion-card-title>Preprocessing Results</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-list>
                <ion-item *ngFor="let result of preprocessResults.results">
                  <ion-label>
                    <h3>Original Path:</h3>
                    <p>{{ result.original }}</p>
                    <h3>Cleaned Path:</h3>
                    <p>{{ result.cleaned }}</p>
                  </ion-label>
                </ion-item>
              </ion-list>
            </ion-card-content>
          </ion-card>
        </div>
      </form>
    </ion-content>
  `,
  styles: [`
    .error-message {
      color: var(--ion-color-danger);
      font-size: 14px;
    }

    .results {
      h2 {
        font-size: 18px;
        font-weight: 500;
        margin-bottom: 16px;
      }

      ion-item {
        --padding-start: 0;
      }

      h3 {
        font-size: 16px;
        margin: 0 0 4px 0;
      }

      p {
        font-size: 14px;
        color: var(--ion-color-medium);
        margin: 0;
      }
    }
  `],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule]
})
export class DatasetPreprocessPage implements OnInit {
  datasetId: string | null = null;
  preprocessForm: FormGroup;
  processing = false;
  error: string | null = null;
  preprocessResults: PreprocessResult | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private datasetService: DatasetService,
    private toastService: ToastService
  ) {
    this.preprocessForm = this.formBuilder.group({
      handleMissingValues: [true],
      removeDuplicates: [true],
      fixDataTypes: [true],
      scalingMethod: ['none']
    });
  }

  ngOnInit() {
    this.datasetId = this.route.snapshot.paramMap.get('id');
  }

  /**
   * 🧠 Cursor Note:
   * Submits preprocessing options to backend for selected dataset.
   * 
   * - Calls: DatasetService.preprocessDataset(datasetId, options)
   * - Handles success:
   *   - Displays cleaned dataset paths.
   *   - Shows success toast using ToastController.
   * - Handles errors:
   *   - Displays message in <ion-text color="danger">.
   */
  async onSubmit() {
    if (!this.datasetId) {
      this.error = 'Dataset ID is missing';
      return;
    }

    this.processing = true;
    this.error = null;

    const options: PreprocessOptions = this.preprocessForm.value;

    try {
      // First, call the preprocessing endpoint
      const response = await this.datasetService.preprocessDataset(this.datasetId, options).toPromise();
      
      if (!response) {
        throw new Error('No response from preprocessing service');
      }

      // Then update the dataset status
      await this.datasetService.updateDatasetStatus(this.datasetId, {
        preprocessingStatus: 'complete'
      }).toPromise();

      // Show success message
      this.toastService.presentToast('success' as ToastType, response.message || 'Preprocessing completed successfully');
      
      // Navigate back to dataset details
      this.router.navigate(['/datasets', this.datasetId]);
      
    } catch (error: any) {
      console.error('Preprocessing error:', error);
      const errorMessage = error.error?.message || error.message || 'Failed to preprocess dataset';
      this.error = errorMessage;
      this.toastService.presentToast('error' as ToastType, errorMessage);
    } finally {
      this.processing = false;
    }
  }
}