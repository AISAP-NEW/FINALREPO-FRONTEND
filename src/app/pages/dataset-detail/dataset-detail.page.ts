import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonSpinner,
  IonItem,
  IonLabel,
  IonList,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { DatasetService, Dataset } from '../../services/dataset.service';
import { addIcons } from 'ionicons';
import { 
  documentOutline,
  informationCircleOutline,
  checkmarkCircleOutline,
  analyticsOutline,
  gitBranchOutline,
  trashOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-dataset-detail',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/datasets"></ion-back-button>
        </ion-buttons>
        <ion-title>Dataset Details</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <ion-spinner></ion-spinner>
        <p>Loading dataset...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="error-message">
        <ion-icon name="alert-circle-outline" color="danger" size="large"></ion-icon>
        <p>{{ error }}</p>
        <div class="error-actions">
          <ion-button (click)="loadDataset()" fill="outline" size="small">
            <ion-icon name="refresh-outline" slot="start"></ion-icon>
            Try Again
          </ion-button>
          <ion-button routerLink="/datasets" fill="outline" size="small">
            <ion-icon name="arrow-back-outline" slot="start"></ion-icon>
            Back to Datasets
          </ion-button>
        </div>
      </div>

      <!-- Dataset Content -->
      <div *ngIf="!loading && !error && dataset" class="dataset-container">
        <!-- Dataset Header -->
        <div class="dataset-header">
          <img [src]="dataset.thumbnailBase64 ? ('data:image/jpeg;base64,' + dataset.thumbnailBase64) : 'assets/default-dataset.png'" 
               [alt]="dataset.datasetName"
               class="dataset-thumbnail">
          <div class="dataset-info">
            <h1>{{ dataset.datasetName }}</h1>
            <p class="description">{{ dataset.description }}</p>
            <div class="metadata">
              <span class="label">Created:</span>
              <span class="value">{{ dataset.createdAt | date:'medium' }}</span>
            </div>
          </div>
        </div>

        <!-- Dataset Details -->
        <ion-list>
          <ion-item lines="none">
            <ion-icon name="document-outline" slot="start"></ion-icon>
            <ion-label>
              <h2>Files</h2>
              <p>{{ dataset.fileCount }} {{ dataset.fileType }} files</p>
            </ion-label>
          </ion-item>

          <ion-item lines="none">
            <ion-icon name="information-circle-outline" slot="start"></ion-icon>
            <ion-label>
              <h2>Description</h2>
              <p>{{ dataset.description }}</p>
            </ion-label>
          </ion-item>

          <ion-item lines="none" *ngIf="dataset.filePath">
            <ion-icon name="folder-outline" slot="start"></ion-icon>
            <ion-label>
              <h2>File Path</h2>
              <p>{{ dataset.filePath }}</p>
            </ion-label>
          </ion-item>
        </ion-list>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <ion-button expand="block" color="primary" (click)="validateDataset()">
            <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
            VALIDATE DATASET
          </ion-button>
          
          <ion-button expand="block" color="secondary" (click)="preprocessDataset()">
            <ion-icon name="analytics-outline" slot="start"></ion-icon>
            PREPROCESS DATA
          </ion-button>

          <ion-button expand="block" color="tertiary" (click)="splitDataset()">
            <ion-icon name="git-branch-outline" slot="start"></ion-icon>
            SPLIT DATASET
          </ion-button>

          <ion-button expand="block" color="danger" (click)="confirmDelete()">
            <ion-icon name="trash-outline" slot="start"></ion-icon>
            DELETE DATASET
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      
      p {
        margin-top: 16px;
        color: var(--ion-color-medium);
      }
    }

    .error-message {
      text-align: center;
      padding: 40px 20px;
      color: var(--ion-color-danger);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;

      ion-icon {
        font-size: 48px;
      }

      p {
        margin: 0;
        font-size: 16px;
      }

      .error-actions {
        display: flex;
        gap: 8px;
        margin-top: 16px;
      }
    }

    .dataset-container {
      max-width: 800px;
      margin: 0 auto;
    }

    .dataset-header {
      display: flex;
      gap: 20px;
      margin-bottom: 24px;
      padding: 16px;
      background: var(--ion-color-light);
      border-radius: 8px;

      .dataset-thumbnail {
        width: 120px;
        height: 120px;
        object-fit: cover;
        border-radius: 4px;
      }

      .dataset-info {
        flex: 1;

        h1 {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: var(--ion-color-dark);
        }

        .description {
          font-size: 16px;
          color: var(--ion-color-medium);
          margin-bottom: 16px;
        }

        .metadata {
          display: flex;
          gap: 8px;
          align-items: center;

          .label {
            color: var(--ion-color-medium);
            font-size: 14px;
          }

          .value {
            font-size: 14px;
            color: var(--ion-color-dark);
          }
        }
      }
    }

    ion-list {
      background: transparent;
      padding: 0;
      margin-bottom: 24px;

      ion-item {
        --background: var(--ion-color-light);
        margin-bottom: 8px;
        border-radius: 8px;
        --padding-start: 16px;
        --inner-padding-end: 16px;

        ion-icon {
          font-size: 24px;
          margin-right: 16px;
        }

        h2 {
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 4px;
        }

        p {
          color: var(--ion-color-medium);
        }
      }
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;

      ion-button {
        margin: 0;
        height: 48px;
        --border-radius: 8px;
        font-weight: 500;
        --padding-start: 16px;
        --padding-end: 16px;
      }

      ion-button ion-icon {
        margin-right: 8px;
      }
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonSpinner,
    IonItem,
    IonLabel,
    IonList
  ]
})
export class DatasetDetailPage implements OnInit {
  dataset: Dataset | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private datasetService: DatasetService,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    addIcons({ 
      documentOutline,
      informationCircleOutline,
      checkmarkCircleOutline,
      analyticsOutline,
      gitBranchOutline,
      trashOutline
    });
  }

  ngOnInit() {
    this.loadDataset();
  }

  loadDataset() {
    this.loading = true;
    this.error = null;
    
    const datasetId = this.route.snapshot.paramMap.get('id');
    console.log('Loading dataset with ID:', datasetId);
    
    if (!datasetId) {
      this.error = 'Dataset ID is missing';
      this.loading = false;
      return;
    }

    this.datasetService.getDatasetById(datasetId).subscribe({
      next: (dataset) => {
        console.log('Received dataset:', dataset);
        this.dataset = dataset;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading dataset:', err);
        this.error = err.error?.message || 'Failed to load dataset';
        this.loading = false;
      }
    });
  }

  async validateDataset() {
    if (!this.dataset?.datasetId) return;
    
    const loading = await this.toastController.create({
      message: 'Validating dataset...',
      duration: 0
    });
    await loading.present();
    
    this.datasetService.validateDataset(this.dataset.datasetId).subscribe({
      next: async (response) => {
        await loading.dismiss();
        const toast = await this.toastController.create({
          message: `Validation ${response.status}: ${response.errorCount} errors found`,
          duration: 3000,
          color: response.status === 'Passed' ? 'success' : 'warning'
        });
        await toast.present();
      },
      error: async (err) => {
        await loading.dismiss();
        const toast = await this.toastController.create({
          message: err.error?.message || 'Validation failed',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }
    });
  }

  async preprocessDataset() {
    if (!this.dataset?.datasetId) return;

    const loading = await this.toastController.create({
      message: 'Preprocessing dataset...',
      duration: 0
    });
    await loading.present();

    const options = {
      handleMissingValues: true,
      removeDuplicates: true,
      fixDataTypes: true
    };

    this.datasetService.preprocessDataset(this.dataset.datasetId, options).subscribe({
      next: async (response) => {
        await loading.dismiss();
        const toast = await this.toastController.create({
          message: response.message,
          duration: 3000,
          color: 'success'
        });
        await toast.present();
      },
      error: async (err) => {
        await loading.dismiss();
        const toast = await this.toastController.create({
          message: err.error?.message || 'Preprocessing failed',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }
    });
  }

  async splitDataset() {
    if (!this.dataset?.datasetId) return;

    const loading = await this.toastController.create({
      message: 'Splitting dataset...',
      duration: 0
    });
    await loading.present();

    this.datasetService.splitDataset(this.dataset.datasetId).subscribe({
      next: async (response) => {
        await loading.dismiss();
        const toast = await this.toastController.create({
          message: response.message,
          duration: 3000,
          color: 'success'
        });
        await toast.present();
      },
      error: async (err) => {
        await loading.dismiss();
        const toast = await this.toastController.create({
          message: err.error?.message || 'Split failed',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }
    });
  }

  async confirmDelete() {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete this dataset? This action cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            // TODO: Implement delete functionality
            console.log('Delete dataset:', this.dataset?.datasetId);
          }
        }
      ]
    });

    await alert.present();
  }
} 