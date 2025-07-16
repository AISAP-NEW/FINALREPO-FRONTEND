import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ModelService, ModelDetails } from '../../services/model.service';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-model-details',
  templateUrl: './model-details.page.html',
  styleUrls: ['./model-details.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule]
})
export class ModelDetailsPage implements OnInit {
  model: ModelDetails | null = null;
  isLoading = true;
  error: string | null = null;
  modelId: string | null = null;

  constructor(
    private modelService: ModelService,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.modelId = this.route.snapshot.paramMap.get('id');
    if (this.modelId) {
      this.loadModel(this.modelId);
    } else {
      this.error = 'No model ID provided';
      this.isLoading = false;
    }
  }

  loadModel(id: string) {
    this.isLoading = true;
    this.error = null;
    
    this.modelService.getModelDetails(Number(id)).pipe(
      catchError(error => {
        console.error('Error loading model:', error);
        this.error = 'Failed to load model details. Please try again later.';
        return of(null);
      }),
      finalize(() => this.isLoading = false)
    ).subscribe((model: ModelDetails | null) => {
      this.model = model;
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFrameworkIcon(framework: string): string {
    switch (framework.toLowerCase()) {
      case 'tensorflow':
        return 'logo-tensorflow';
      case 'pytorch':
        return 'logo-python';
      case 'scikit-learn':
        return 'analytics';
      default:
        return 'cube';
    }
  }

  getFrameworkColor(framework: string): string {
    switch (framework.toLowerCase()) {
      case 'tensorflow':
        return 'warning';
      case 'pytorch':
        return 'danger';
      case 'scikit-learn':
        return 'success';
      default:
        return 'primary';
    }
  }

  downloadModel() {
    if (!this.model) return;
    // This would be implemented to trigger a file download
    console.log('Downloading model:', this.model.modelId);
    // In a real app, you would call your API to get a download URL
    // window.open(downloadUrl, '_blank');
  }

  deleteModel() {
    if (!this.model) return;
    
    // In a real app, you would show a confirmation dialog first
    // and then call the API to delete the model
    console.log('Deleting model:', this.model.modelId);
    // After deletion, navigate back to models list
    this.router.navigate(['/models']);
  }

  startTraining() {
    if (!this.model || !this.model.versions || this.model.versions.length === 0) return;
    // Use the latest version for instanceId (adjust if your backend expects something else)
    const instanceId = this.model.versions[0].model_Version_ID;
    // TODO: Replace with real datasetValidationId if available
    const datasetValidationId = null;
    this.http.post(`/api/models/${this.model.modelId}/instances/${instanceId}/start-training`, {
      datasetValidationId,
      trainingParameters: { learningRate: 0.01, batchSize: 32, epochs: 10 }
    }).subscribe(() => {
      this.router.navigate([`/training-dashboard/${instanceId}`]);
    });
  }
}
