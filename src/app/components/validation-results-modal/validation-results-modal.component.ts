import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { ValidationResponse, ValidationError } from '../../services/dataset.service';

@Component({
  selector: 'app-validation-results-modal',
  templateUrl: './validation-results-modal.component.html',
  styleUrls: ['./validation-results-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class ValidationResultsModalComponent implements OnInit {
  @Input() validationResult!: ValidationResponse;
  
  // Safe accessor for errors with default empty array
  get safeErrors(): ValidationError[] {
    return this.validationResult?.errors || [];
  }

  constructor(private modalCtrl: ModalController) {}

  getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
      case 'failed':
        return 'close-circle';
      case 'warning':
        return 'warning';
      default:
        return 'help-circle';
    }
  }

  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'success':
        return 'success';
      case 'error':
      case 'failed':
        return 'danger';
      case 'warning':
        return 'warning';
      default:
        return 'medium';
    }
  }

  closeModal() {
    this.modalCtrl.dismiss();
  }
  
  ngOnInit() {
    // Ensure we have a valid validation result
    if (!this.validationResult) {
      this.validationResult = {
        status: 'error',
        message: 'No validation results available',
        errorCount: 0,
        errorLines: [],
        errors: [],
        totalRows: 0,
        validationId: 'unknown',
        timestamp: new Date().toISOString()
      };
    }
  }
}
