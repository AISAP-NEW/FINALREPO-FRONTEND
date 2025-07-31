import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonSpinner,
  IonButtons,
  IonMenuButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonAccordionGroup,
  IonAccordion,
  IonNote,
  ModalController,
  IonFab,
  IonFabButton,
  IonIcon as IonFabIcon
} from '@ionic/angular/standalone';
import { ModelService } from '../../services/model.service';
import { DatasetService } from '../../services/dataset.service';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { addIcons } from 'ionicons';
import {
  cubeOutline,
  cloudUploadOutline,
  trashOutline,
  downloadOutline,
  documentTextOutline,
  closeOutline,
  timeOutline,
  informationCircleOutline,
  playOutline,
  eyeOutline
} from 'ionicons/icons';
import { TrainingConfigModalComponent } from '../../components/training-config-modal/training-config-modal.component';
import { TrainingService } from '../../services/training.service';
import { NotebookPanelComponent } from '../../notebook-panel/notebook-panel.component';
import { FormsModule } from '@angular/forms';
import { UpdateModelModalComponent } from '../../components/update-model-modal/update-model-modal.component';
import { ToastService } from '../../services/toast.service';
import { HttpClient } from '@angular/common/http';
import { LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-models',
  templateUrl: './models.page.html',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    IonHeader,
    NotebookPanelComponent,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonSpinner,
    IonButtons,
    IonMenuButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonAccordionGroup,
    IonAccordion,
    IonNote,
    TrainingConfigModalComponent,
    IonFab,
    IonFabButton,
    IonFabIcon
  ]
})
export class ModelsPage implements OnInit {
  models: any[] = [];
  filteredModels: any[] = [];
  searchTerm: string = '';
  isLoading = false;
  error: string | null = null;
  selectedModel: any = null;
  fileContent: string | null = null;
  
  // Get full URL for a thumbnail
  getThumbnailUrl(thumbnailPath: string | null): string | null {
    if (!thumbnailPath) return null;
    return `${environment.apiUrl}/uploads/thumbnails/${thumbnailPath}`;
  }
  
  // Handle image loading errors
  handleImageError(event: any) {
    console.error('Error loading thumbnail:', event);
    // Hide the image on error
    event.target.style.display = 'none';
  }

  constructor(
    private modelService: ModelService,
    private modalController: ModalController,
    private trainingService: TrainingService,
    private datasetService: DatasetService,
    private toastService: ToastService,
    private http: HttpClient,
    private loadingCtrl: LoadingController,
    private router: Router
  ) {
    addIcons({
      cubeOutline,
      cloudUploadOutline,
      trashOutline,
      downloadOutline,
      documentTextOutline,
      closeOutline,
      timeOutline,
      informationCircleOutline,
      playOutline,
      eyeOutline
    });
  }

  ngOnInit() {
    this.loadModels();
  }

  loadModels() {
    this.isLoading = true;
    this.error = null;
    this.selectedModel = null;
    this.fileContent = null;
    this.modelService.getAllModels()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (models: any[]) => {
          console.log('[loadModels] API response:', models);
          this.models = (models || []).map((m: any) => ({
            modelId: m.modelId || m.Model_ID || m.id,
            modelName: m.modelName || m.ModelName || m.name || '',
            description: m.description || m.Description || m.desc || '',
            creationDate: m.creationDate || m.CreationDate || m.uploadDate || m.UploadDate || m.created || '',
          }));
          this.filteredModels = this.models;
        },
        error: err => {
          console.error('[loadModels] Error:', err);
          this.error = 'Failed to load models.';
        },
      });
  }

  onSearch() {
    const term = this.searchTerm.toLowerCase();
    this.filteredModels = this.models.filter(model =>
      model.modelName.toLowerCase().includes(term) ||
      (model.description && model.description.toLowerCase().includes(term))
    );
  }

  async openUpdateModel(model: any) {
    const modal = await this.modalController.create({
      component: UpdateModelModalComponent,
      componentProps: {
        model: {
          modelId: model.modelId,
          modelName: model.modelName,
          topicId: model.topicId,
          categoryId: model.categoryId
        }
      },
      cssClass: 'update-model-modal-small'
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data && data.updated) {
      this.loadModels();
    }
  }

  selectModel(model: any) {
    this.selectedModel = null;
    this.fileContent = null;
    this.isLoading = true;
    this.modelService.getModelDetails(model.modelId)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (details: any) => {
          console.log('[selectModel] API response:', details);
          this.selectedModel = {
            modelId: details.ModelId,
            modelName: details.ModelName,
            description: details.Description,
            creationDate: details.CreationDate,
            versions: (details.Versions || []).map((v: any) => ({
              versionId: v.Model_Version_ID,
              versionNumber: v.Version_Number,
              creationDate: v.CreationDate,
              files: (v.Files || []).map((f: any) => ({
                fileId: f.FileId,
                fileName: f.FileName,
                filePath: f.FilePath,
                fileType: f.FileType,
                fileSize: f.FileSize,
                uploadDate: f.UploadDate,
                description: f.Description,
                isPrimary: f.IsPrimary,
              })),
            })),
          };
        },
        error: err => {
          console.error('[selectModel] Error:', err);
          this.error = 'Failed to load model details.';
        },
      });
  }

  async startTraining(model: any, version: any) {
    try {
      // Only allow validated datasets for training (DatasetValidationId must be valid)
      const modal = await this.modalController.create({
        component: TrainingConfigModalComponent,
        componentProps: {
          modelId: model.modelId,
          modelVersionId: version.versionId
        }
      });

      await modal.present();
      const { data } = await modal.onWillDismiss();

      if (data) {
        // Show loading indicator
        const loading = await this.loadingCtrl.create({
          message: 'Starting training session...',
          spinner: 'crescent'
        });
        await loading.present();

        // Map modal data to backend API field names (matching StartTrainingDTO)
        const config = {
          ModelId: model.modelId,
          ModelVersionId: version.versionId,
          LearningRate: parseFloat(data.learningRate),
          Epochs: parseInt(data.epochs, 10),
          BatchSize: parseInt(data.batchSize, 10),
          DatasetValidationId: data.datasetValidationId,
          TrainingParameters: data.trainingParameters || '',
          Notes: data.notes || ''
        };

        this.trainingService.startTraining(config).subscribe({
          next: (res: any) => {
            loading.dismiss();
            
            if (res && res.trainSessionId) {
              // Show success message
              this.toastService.presentToast('success', 'Training session started successfully!');
              
              // Navigate to training dashboard with trainSessionId
              this.router.navigate(['/training-dashboard', res.trainSessionId]);
            } else {
              this.toastService.presentToast('error', 'Training started, but no session ID returned.');
            }
          },
          error: (err) => {
            loading.dismiss();
            
            // Enhanced error handling with VM-specific messages
            let errorMessage = 'Failed to start training session.';
            
            if (err.message) {
              if (err.message.includes('virtual machine') || err.message.includes('VM')) {
                errorMessage = err.message;
              } else if (err.message.includes('execution service')) {
                errorMessage = 'Training process could not start: Execution service unavailable. Please try again later.';
              } else if (err.message.includes('dataset')) {
                errorMessage = `Training configuration error: ${err.message}`;
              } else {
                errorMessage = err.message;
              }
            }
            
            this.toastService.presentToast('error', errorMessage);
            console.error('[startTraining] Error:', err);
          }
        });
      }
    } catch (error) {
      console.error('[startTraining] Unexpected error:', error);
      this.toastService.presentToast('error', 'An unexpected error occurred while starting training.');
    }
  }

  private async getDatasetOptions(): Promise<{ id: string; name: string }[]> {
    // Fetch validated datasets from DatasetService
    return new Promise((resolve, reject) => {
      this.datasetService.getValidatedDatasets().subscribe({
        next: (datasets) => {
          const options = (datasets || []).map(ds => ({
            id: ds.datasetId,
            name: ds.datasetName || ''
          }));
          resolve(options);
        },
        error: (err) => {
          console.error('Failed to load datasets for training config:', err);
          resolve([]); // Return empty array to avoid modal hanging
        }
      });
    });
  }

  viewFile(fileId: number) {
    this.fileContent = null;
    this.isLoading = true;
    this.modelService.readFileContent(fileId)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: res => {
          console.log('[viewFile] API response:', res);
          this.fileContent = res && res.content ? res.content : 'No content available.';
        },
        error: err => {
          console.error('[viewFile] Error:', err);
          this.fileContent = 'Failed to load file content.';
        },
      });
  }

  onFileClick(file: any) {
    console.log('[onFileClick] File object:', file);
    this.viewFile(file.fileId);
  }

  confirmDeleteModel(model: any) {
    if (window.confirm(`Are you sure you want to delete model "${model.modelName}"? This cannot be undone.`)) {
      this.isLoading = true;
      this.modelService.deleteModel(model.modelId)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe({
          next: () => {
            this.loadModels();
          },
          error: err => {
            alert('Failed to delete model.');
            console.error('[deleteModel] Error:', err);
          }
        });
    }
  }

  confirmDeleteFile(file: any) {
    if (window.confirm(`Are you sure you want to delete file "${file.fileName}"? This cannot be undone.`)) {
      this.isLoading = true;
      this.modelService.deleteFile(file.fileId)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe({
          next: () => {
            if (this.selectedModel) {
              this.selectModel(this.selectedModel);
            }
          },
          error: err => {
            alert('Failed to delete file.');
            console.error('[deleteFile] Error:', err);
          }
        });
    }
  }

  downloadFile(file: any) {
    const url = this.modelService.getFileDownloadUrl(file.filePath);
    window.open(url, '_blank');
  }

  async downloadExcelReport() {
    const loading = await this.loadingCtrl.create({
      message: 'Downloading Excel report...'
    });
    await loading.present();
    try {
      const blob = await this.http.get('http://localhost:5183/api/export/models-to-excel', { responseType: 'blob' }).toPromise();
      if (!blob) throw new Error('No data received');
      const url = window.URL.createObjectURL(blob as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'AI_Model_Report.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      await loading.dismiss();
      this.toastService.presentToast('success', '✅ Excel report downloaded!', 3500);
    } catch (error) {
      await loading.dismiss();
      this.toastService.presentToast('error', '❌ Failed to download Excel report.', 3500);
    }
  }

  clearDetails() {
    this.selectedModel = null;
    this.fileContent = null;
  }
}

