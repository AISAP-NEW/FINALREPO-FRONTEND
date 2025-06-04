import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { DatasetService, ValidationResponse } from '../../services/dataset.service';

@Component({
  selector: 'app-dataset-validate',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/datasets"></ion-back-button>
        </ion-buttons>
        <ion-title>Validate Dataset</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="ion-padding">
        <ion-button expand="block" (click)="startValidation()" [disabled]="validating">
          {{ validating ? 'Validating...' : 'Start Validation' }}
        </ion-button>

        <div *ngIf="error" class="error-message ion-padding-top">
          <ion-text color="danger">{{ error }}</ion-text>
        </div>

        <div *ngIf="validationResult" class="validation-results ion-padding-top">
          <ion-card>
            <ion-card-header>
              <ion-card-title>
                Validation Results
                <ion-badge [color]="validationResult.status === 'Passed' ? 'success' : 'danger'" class="status-badge">
                  {{ validationResult.status }}
                </ion-badge>
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-list>
                <ion-item>
                  <ion-label>
                    <h2>Total Rows</h2>
                    <p>{{ validationResult.totalRows }}</p>
                  </ion-label>
                </ion-item>
                <ion-item>
                  <ion-label>
                    <h2>Error Count</h2>
                    <p>{{ validationResult.errorCount }}</p>
                  </ion-label>
                </ion-item>
                <ion-item *ngIf="validationResult.errorLines?.length">
                  <ion-label>
                    <h2>Error Lines</h2>
                    <p>{{ validationResult.errorLines.join(', ') }}</p>
                  </ion-label>
                </ion-item>
              </ion-list>
            </ion-card-content>
          </ion-card>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .error-message {
      color: var(--ion-color-danger);
      font-size: 14px;
      margin: 16px 0;
    }

    .validation-results {
      ion-card {
        margin: 16px 0;
      }

      ion-card-title {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .status-badge {
        font-size: 14px;
        padding: 4px 8px;
        border-radius: 12px;
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
  imports: [CommonModule, IonicModule]
})
export class DatasetValidatePage implements OnInit {
  datasetId: string | null = null;
  validating = false;
  error: string | null = null;
  validationResult: ValidationResponse | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private datasetService: DatasetService
  ) {}

  ngOnInit() {
    this.datasetId = this.route.snapshot.paramMap.get('id');
  }

  startValidation() {
    if (!this.datasetId) {
      this.error = 'Dataset ID is missing';
      return;
    }

    this.validating = true;
    this.error = null;
    this.validationResult = null;

    this.datasetService.validateDataset(this.datasetId).subscribe({
      next: (response) => {
        this.validating = false;
        this.validationResult = response;
      },
      error: (err) => {
        this.validating = false;
        this.error = 'Error validating dataset: ' + (err.error?.message || err.message || 'Unknown error');
      }
    });
  }
} 