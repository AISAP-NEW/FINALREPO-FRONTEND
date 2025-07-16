import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { DatasetService, ValidationResponse as BackendValidationResponse } from '../../services/dataset.service';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';

// Extended interface with normalized status
type NormalizedValidationResponse = Omit<BackendValidationResponse, 'status'> & {
  status: 'success' | 'error' | 'warning' | 'failed';
  originalStatus: string;
};

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
                <ion-badge [color]="getStatusColor(validationResult.status)" class="status-badge">
                  {{ getStatusDisplay(validationResult.status) }}
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
  validationResult: NormalizedValidationResponse | null = null;

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
   * Maps internal status to display text
   */
  getStatusDisplay(status: string): string {
    switch (status) {
      case 'success': return 'Passed';
      case 'error': return 'Error';
      case 'warning': return 'Warning';
      case 'failed': return 'Failed';
      default: return status;
    }
  }

  /**
   * Gets the color for a given status
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'success': return 'success';
      case 'error':
      case 'failed': return 'danger';
      case 'warning': return 'warning';
      default: return 'medium';
    }
  }

  /**
   * 🚦 Triggers dataset validation by calling backend.
   * 
   * - Uses: DatasetService.validateDataset(datasetId)
   * - Displays validation summary (status, error count, error lines).
   * - Shows error toast/message on failure.
   */
  private normalizeValidationResponse(response: BackendValidationResponse): NormalizedValidationResponse {
    // Map the status to a normalized format
    let normalizedStatus: 'success' | 'error' | 'warning' | 'failed';
    const status = response.status.toLowerCase();
    
    if (status === 'passed') {
      normalizedStatus = 'success';
    } else if (status === 'error' || status === 'warning' || status === 'failed') {
      normalizedStatus = status;
    } else {
      console.warn(`Unexpected status '${response.status}' received from server, defaulting to 'error'`);
      normalizedStatus = 'error';
    }
    
    return {
      ...response,
      status: normalizedStatus,
      originalStatus: response.status
    };
  }

  startValidation() {
    if (!this.datasetId) {
      this.error = 'No dataset ID provided';
      return;
    }

    this.validating = true;
    this.error = null;

    this.datasetService.validateDataset(this.datasetId).subscribe({
      next: (response) => {
        try {
          this.validationResult = this.normalizeValidationResponse(response);
          
          this.toastService.presentToast(
            this.validationResult.status === 'success' ? 'success' : 'warning',
            `Validation ${this.getStatusDisplay(this.validationResult.status)}: ${this.validationResult.errorCount} errors found`,
            3000
          );
        } catch (error) {
          console.error('Error normalizing validation response:', error);
          this.error = 'Failed to process validation results';
          this.toastService.presentToast('error', 'Failed to process validation results', 3000);
        } finally {
          this.validating = false;
        }
      },
      error: (err) => {
        console.error('Validation error:', err);
        const errorMessage = err?.message || 'Failed to validate dataset';
        this.error = errorMessage;
        this.validating = false;
        this.toastService.presentToast('error', errorMessage, 3000);
      }
    });
  }
}