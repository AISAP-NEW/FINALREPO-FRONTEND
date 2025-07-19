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

@Component({
  selector: 'app-models',
  templateUrl: './models.page.html',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
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
    private modalController: ModalController
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
    const modal = await this.modalController.create({
      component: TrainingConfigModalComponent,
      componentProps: {
        modelId: model.modelId,
        modelVersionId: version.versionId,
        datasetOptions: await this.getDatasetOptions()
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      // Navigate to training dashboard
      window.location.href = `/training-dashboard/${model.modelId}/${data.instanceId}`;
    }
  }

  private async getDatasetOptions(): Promise<{ id: number; name: string }[]> {
    // TODO: Replace with actual dataset service call
    return [
      { id: 1, name: 'Dataset 1' },
      { id: 2, name: 'Dataset 2' },
      { id: 3, name: 'Dataset 3' }
    ];
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

