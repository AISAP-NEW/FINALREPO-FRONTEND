import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { DatasetService, ValidationResponse } from '../../services/dataset.service';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';

/**
 * ✅ Dataset Validation Page — AI Model Management System
 * 
 * 🧠 Purpose:
 * - Validate a dataset by checking CSV rows for formatting consistency.
 * - Backend returns number of errors, their row indices, and status ("Passed" or "Failed").
 * 
 * ✅ Backend Endpoint:
 * - POST /Dataset/validate/{datasetId}
 * - Returns:
 *   {
 *     status: "Passed" | "Failed",
 *     errorCount: number,
 *     errorLines: number[],
 *     totalRows: number,
 *     validationId: string
 *   }
 * 
 * 📦 Cursor Tasks:
 * - Trigger validation on button click.
 * - Display result summary with:
 *    - Pass/fail status
 *    - Total rows
 *    - Number of errors
 *    - Top 10 invalid row indices
 * - Handle errors gracefully.
 */

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
                <ion-item>
                  <ion-label>
                    <h2>Invalid Rows</h2>
                    <p>{{ validationResult.errorLines?.length ? validationResult.errorLines.slice(0, 10).join(', ') : 'None' }}</p>
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
    }

    .validation-results {
      h2 {
        font-size: 16px;
        margin: 0 0 4px 0;
      }

      p {
        font-size: 14px;
        color: var(--ion-color-medium);
        margin: 0;
      }
    }

    .status-badge {
      font-size: 14px;
      margin-left: 8px;
    }
  `],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class DatasetValidatePage implements OnInit {
  datasetId: string | null = null;
  validating = false;
  error: string | null = null;
  validationResult: ValidationResponse | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private datasetService: DatasetService,
    private toastService: ToastService
  ) {
    this.datasetId = this.route.snapshot.paramMap.get('id');
  }

  ngOnInit() {}

  /**
   * 🚦 Triggers dataset validation by calling backend.
   * 
   * - Uses: DatasetService.validateDataset(datasetId)
   * - Displays validation summary (status, error count, error lines).
   * - Shows error toast/message on failure.
   */
  startValidation() {
    if (!this.datasetId) {
      this.error = 'No dataset ID provided';
      return;
    }

    this.validating = true;
    this.error = null;

    this.datasetService.validateDataset(this.datasetId).subscribe({
      next: (response) => {
        this.validating = false;
        this.validationResult = response;
        
        // Show success toast
        this.toastService.presentToast(
          response.status === 'Passed' ? 'success' : 'warning',
          `Validation ${response.status.toLowerCase()}: ${response.errorCount} errors found`,
          3000
        );
      },
      error: (err) => {
        this.validating = false;
        this.error = err.error?.message || err.message || 'Failed to validate dataset';
        console.error('Validation error:', err);
      }
    });
  }
}