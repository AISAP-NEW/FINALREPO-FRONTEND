import { Component, OnInit } from '@angular/core';
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
  IonBadge,
  IonSpinner,
  IonButtons,
  IonMenuButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DatasetService, Dataset } from '../../services/dataset.service';

@Component({
  selector: 'app-datasets',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Datasets</ion-title>
        <ion-buttons slot="end">
          <ion-button routerLink="/datasets/new">
            <ion-icon name="add-outline" slot="start"></ion-icon>
            New Dataset
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <!-- Loading State -->
      <div *ngIf="loading" class="ion-padding ion-text-center">
        <ion-spinner></ion-spinner>
        <p>Loading datasets...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="ion-padding">
        <ion-item color="danger">
          <ion-icon name="alert-circle" slot="start"></ion-icon>
          <ion-label>{{ error }}</ion-label>
        </ion-item>
      </div>

      <!-- Data State -->
      <div *ngIf="!loading && !error" class="ion-padding">
        <ion-list *ngIf="datasets.length > 0">
          <ion-item *ngFor="let dataset of datasets" [routerLink]="['/datasets', dataset.datasetId]" detail="true">
            <ion-label>
              <h2>{{ dataset.datasetName }}</h2>
              <p>{{ dataset.description }}</p>
              <p>Files: {{ dataset.fileCount }} ({{ dataset.fileType }})</p>
              <p>Created: {{ dataset.createdAt | date }}</p>
            </ion-label>
          </ion-item>
        </ion-list>

        <!-- Empty State -->
        <div *ngIf="datasets.length === 0" class="ion-text-center ion-padding">
          <p>No datasets found. Click the "New Dataset" button to create one.</p>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    ion-button {
      margin-bottom: 20px;
    }
    ion-item h2 {
      font-weight: bold;
      margin-bottom: 5px;
    }
    ion-badge {
      margin-left: 10px;
    }
    .error-message {
      color: var(--ion-color-danger);
      padding: 16px;
    }
  `],
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
    IonBadge,
    IonSpinner,
    IonButtons,
    IonMenuButton
  ]
})
export class DatasetsComponent implements OnInit {
  datasets: Dataset[] = [];
  loading = true;
  error: string | null = null;

  constructor(private datasetService: DatasetService) {
    addIcons({ addOutline });
  }

  ngOnInit() {
    this.loadDatasets();
  }

  private loadDatasets() {
    this.loading = true;
    this.error = null;
    
    this.datasetService.getAllDatasets().subscribe({
      next: (datasets) => {
        this.datasets = datasets;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading datasets:', error);
        this.error = 'Failed to load datasets. Please try again later.';
        this.loading = false;
      }
    });
  }
} 