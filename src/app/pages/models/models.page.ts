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
  ModalController
} from '@ionic/angular/standalone';
import { ModelService } from '../../services/model.service';
import { DatasetService } from '../../services/dataset.service';
import { finalize } from 'rxjs/operators';
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

@Component({
  selector: 'app-models',
  templateUrl: './models.page.html',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
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
    TrainingConfigModalComponent
  ]
})
export class ModelsPage implements OnInit {
  models: any[] = [];
  isLoading = false;
  error: string | null = null;
  selectedModel: any = null;
  fileContent: string | null = null;

  constructor(
    private modelService: ModelService,
    private modalController: ModalController,
    private trainingService: TrainingService,
    private datasetService: DatasetService
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
        },
        error: err => {
          console.error('[loadModels] Error:', err);
          this.error = 'Failed to load models.';
        },
      });
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
      // Map modal data to backend API field names
      const config: any = {
        ModelId: model.modelId,
        ModelVersionId: version.versionId,
        LearningRate: parseFloat(data.learningRate),
        Epochs: parseInt(data.epochs, 10),
        BatchSize: parseInt(data.batchSize, 10),
        DatasetValidationId: data.datasetValidationId,
        TrainingParameters: data.trainingParameters || '',
        Notes: data.notes || ''
      };
      this.isLoading = true;
      this.trainingService.startTraining(config).pipe(finalize(() => this.isLoading = false)).subscribe({
        next: (res: any) => {
          if (res && res.trainSessionId) {
            // Redirect to dashboard with trainSessionId
            window.location.href = `/dashboard/${res.trainSessionId}`;
          } else {
            alert('Training started, but no session ID returned.');
          }
        },
        error: (err) => {
          alert('Failed to start training session.');
          console.error('[startTraining] Error:', err);
        }
      });
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

  clearDetails() {
    this.selectedModel = null;
    this.fileContent = null;
  }
}

