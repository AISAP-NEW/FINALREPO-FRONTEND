import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { DatasetService, SplitResponse } from '../../services/dataset.service';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';

/**
 * Dataset Split Page Component
 * 
 * This component is responsible for handling the dataset split functionality.
 * It provides a form for the user to input the training set ratio and 
 * displays the split results.
 */
@Component({
  selector: 'app-dataset-split',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/datasets"></ion-back-button>
        </ion-buttons>
        <ion-title>Split Dataset</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <form [formGroup]="splitForm" (ngSubmit)="onSubmit()" class="ion-padding">
        <ion-item>
          <ion-label position="floating">Training Set Percentage (10% - 90%)</ion-label>
          <ion-input
            type="number"
            formControlName="trainRatio"
            min="10"
            max="90"
            step="5"
          ></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="floating">Test Set Percentage</ion-label>
          <ion-input
            type="number"
            readonly
            [value]="testRatio"
          ></ion-input>
        </ion-item>
        <div *ngIf="splitForm.get('trainRatio')?.touched && splitForm.get('trainRatio')?.invalid" class="error-message">
          <ion-text color="danger" *ngIf="splitForm.get('trainRatio')?.errors?.['required']">
            Training percentage is required
          </ion-text>
          <ion-text color="danger" *ngIf="splitForm.get('trainRatio')?.errors?.['min'] || splitForm.get('trainRatio')?.errors?.['max']">
            Training percentage must be between 10% and 90%
          </ion-text>
        </div>

        <div class="ion-padding-top">
          <ion-button expand="block" type="submit" [disabled]="!splitForm.valid || splitting">
            {{ splitting ? 'Splitting...' : 'Split Dataset' }}
          </ion-button>
        </div>

        <div *ngIf="error" class="error-message ion-padding-top">
          <ion-text color="danger">{{ error }}</ion-text>
        </div>

        <div *ngIf="splitResult" class="split-results ion-padding-top">
          <ion-card>
            <ion-card-header>
              <ion-card-title>Split Results</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-list>
                <ion-item>
                  <ion-label>
                    <h2>Training Set</h2>
                    <p>{{ splitResult.trainFileName }}</p>
                    <p>{{ splitResult.trainCount }} rows</p>
                  </ion-label>
                </ion-item>
                <ion-item>
                  <ion-label>
                    <h2>Test Set</h2>
                    <p>{{ splitResult.testFileName }}</p>
                    <p>{{ splitResult.testCount }} rows</p>
                  </ion-label>
                </ion-item>
                <ion-item>
                  <ion-label>
                    <h2>Split ID</h2>
                    <p>{{ splitResult.splitId }}</p>
                  </ion-label>
                </ion-item>
                <ion-item>
                  <ion-label>
                    <h2>Version ID</h2>
                    <p>{{ splitResult.versionId }}</p>
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
      margin: 8px 16px;
    }

    .split-results {
      ion-card {
        margin: 16px 0;
      }

      h2 {
        font-size: 16px;
        font-weight: 500;
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
export class DatasetSplitPage implements OnInit {
  datasetId: string | null = null;
  splitForm: FormGroup;
  splitting = false;
  error: string | null = null;
  splitResult: SplitResponse | null = null;
  testRatio: number = 20; // Default to 20% since train is 80% by default

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private datasetService: DatasetService
  ) {
    this.splitForm = this.formBuilder.group({
      trainRatio: [80, [Validators.required, Validators.min(10), Validators.max(90)]]
    });

    // Calculate test ratio based on train ratio
    this.splitForm.get('trainRatio')?.valueChanges.subscribe((value) => {
      this.testRatio = 100 - value;
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

    if (this.splitForm.valid) {
      this.splitting = true;
      this.error = null;
      this.splitResult = null;

      const trainRatio = this.splitForm.get('trainRatio')?.value;
      const testRatio = 100 - trainRatio;

      this.datasetService.splitDataset(this.datasetId, trainRatio, testRatio).subscribe({
        next: (response) => {
          this.splitting = false;
          this.splitResult = response;
        },
        error: (err) => {
          this.splitting = false;
          this.error = 'Error splitting dataset: ' + (err.error?.message || err.message || 'Unknown error');
        }
      });
    }
  }
} 