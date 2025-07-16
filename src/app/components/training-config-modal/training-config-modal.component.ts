import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TrainingConfig } from '../../models/training.model';

@Component({
  selector: 'app-training-config-modal',
  templateUrl: './training-config-modal.component.html',
  styleUrls: ['./training-config-modal.component.scss']
})
export class TrainingConfigModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() datasetOptions: { id: number; name: string }[] = [];
  @Output() configSubmit = new EventEmitter<TrainingConfig>();
  @Output() modalDismiss = new EventEmitter<void>();

  trainingForm: FormGroup;
  isLoading = false;

  // Default values
  batchSizes = [16, 32, 64];
  epochsOptions = [10, 50, 100];

  constructor(private fb: FormBuilder) {
    this.trainingForm = this.fb.group({
      learningRate: [0.001, [Validators.required, Validators.min(0.0001), Validators.max(1)]],
      epochs: [50, [Validators.required]],
      batchSize: [32, [Validators.required]],
      datasetValidationId: [null, [Validators.required]]
    });
  }

  ngOnInit() {}

  onSubmit() {
    if (this.trainingForm.valid) {
      this.isLoading = true;
      const config: TrainingConfig = {
        learningRate: parseFloat(this.trainingForm.value.learningRate),
        epochs: parseInt(this.trainingForm.value.epochs, 10),
        batchSize: parseInt(this.trainingForm.value.batchSize, 10),
        datasetValidationId: parseInt(this.trainingForm.value.datasetValidationId, 10)
      };
      this.configSubmit.emit(config);
    }
  }

  onDismiss() {
    this.modalDismiss.emit();
  }

  // Helper to mark all fields as touched
  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
