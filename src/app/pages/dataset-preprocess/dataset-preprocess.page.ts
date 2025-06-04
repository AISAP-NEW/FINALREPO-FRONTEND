import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { DatasetService, PreprocessOptions } from '../../services/dataset.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

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

        <div *ngIf="results" class="results ion-padding-top">
          <h2>Processing Results</h2>
          <ion-list>
            <ion-item *ngFor="let result of results">
              <ion-label>
                <h3>Original: {{ result.original }}</h3>
                <p>Cleaned: {{ result.cleaned }}</p>
              </ion-label>
            </ion-item>
          </ion-list>
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
  results: any[] | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private datasetService: DatasetService
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

  onSubmit() {
    if (!this.datasetId) {
      this.error = 'Dataset ID is missing';
      return;
    }

    this.processing = true;
    this.error = null;
    this.results = null;

    const options: PreprocessOptions = this.preprocessForm.value;

    this.datasetService.preprocessDataset(this.datasetId, options).subscribe({
      next: (response) => {
        this.processing = false;
        this.results = response.results;
      },
      error: (err) => {
        this.processing = false;
        this.error = 'Error processing dataset: ' + (err.error?.message || err.message || 'Unknown error');
      }
    });
  }
} 