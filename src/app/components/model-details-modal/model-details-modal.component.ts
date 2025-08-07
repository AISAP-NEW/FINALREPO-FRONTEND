import { Component, Input } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ModelDetails, ModelService } from '../../services/model.service';

@Component({
  selector: 'app-model-details-modal',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './model-details-modal.component.html',
  styleUrls: ['./model-details-modal.component.scss']
})
export class ModelDetailsModalComponent {
  @Input() model!: ModelDetails;
  isTraining = false;
  trainError: string | null = null;

  constructor(
    private modalCtrl: ModalController,
    public modelService: ModelService,
    private router: Router,
    private http: HttpClient
  ) {}

  close() {
    this.modalCtrl.dismiss();
  }

  downloadFile(filePath: string) {
    window.open(this.modelService.getFileDownloadUrl(filePath), '_blank');
  }

  startTraining() {
    if (!this.model || !this.model.versions || this.model.versions.length === 0) return;
    this.isTraining = true;
    this.trainError = null;
    const instanceId = this.model.versions[0].model_Version_ID;
    const datasetValidationId = null; // Replace with real value if needed
    this.http.post(`/api/models/${this.model.modelId}/instances/${instanceId}/start-training`, {
      datasetValidationId,
      trainingParameters: { learningRate: 0.01, batchSize: 32, epochs: 10 }
    }).subscribe({
      next: () => {
        this.isTraining = false;
        this.modalCtrl.dismiss();
        this.router.navigate([`/training-dashboard/${instanceId}`]);
      },
      error: (err) => {
        this.isTraining = false;
        this.trainError = 'Failed to start training. Please try again.';
        console.error('Training error:', err);
      }
    });
  }

  openTrainingDashboard() {
    if (!this.model || !this.model.versions || this.model.versions.length === 0) {
      this.trainError = 'No model version available';
      return;
    }
    const instanceId = this.model.versions[0].model_Version_ID;
    this.modalCtrl.dismiss();
    this.router.navigate([`/training-dashboard/${instanceId}`]);
  }
}
