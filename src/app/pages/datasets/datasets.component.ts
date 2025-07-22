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
  IonMenuButton,
  IonSearchbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, searchOutline, closeOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatasetService, Dataset } from '../../services/dataset.service';
import { ToastService } from '../../services/toast.service';
import { HttpClient } from '@angular/common/http';

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
          <ion-button (click)="downloadLogsJson()">
            <ion-icon name="download-outline" slot="start"></ion-icon>
            Download Logs (JSON)
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
        <ion-searchbar
          [(ngModel)]="searchTerm"
          (ionInput)="handleSearch($event)"
          placeholder="Search datasets..."
          [animated]="true"
          showClearButton="focus">
        </ion-searchbar>

        <ion-list *ngIf="filteredDatasets.length > 0">
          <ion-item *ngFor="let dataset of filteredDatasets" [routerLink]="['/datasets', dataset.datasetId]" detail="true">
            <ion-label>
              <h2>{{ dataset.datasetName }}</h2>
              <p>{{ dataset.description }}</p>
              <p>Files: {{ dataset.fileCount }} ({{ dataset.fileType }})</p>
              <p>Created: {{ dataset.createdAt | date }}</p>
            </ion-label>
          </ion-item>
        </ion-list>

        <!-- Empty State -->
        <div *ngIf="filteredDatasets.length === 0" class="ion-text-center ion-padding">
          <p *ngIf="searchTerm">No datasets found matching "{{ searchTerm }}"</p>
          <p *ngIf="!searchTerm">No datasets found. Click the "New Dataset" button to create one.</p>
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
    FormsModule,
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
    IonMenuButton,
    IonSearchbar
  ]
})
export class DatasetsComponent implements OnInit {
  datasets: Dataset[] = [];
  filteredDatasets: Dataset[] = [];
  loading = true;
  error: string | null = null;
  searchTerm: string = '';

  constructor(private datasetService: DatasetService, private toastService: ToastService, private http: HttpClient) {
    addIcons({ addOutline, searchOutline, closeOutline });
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
        this.filteredDatasets = datasets;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading datasets:', error);
        this.error = 'Failed to load datasets. Please try again later.';
        this.loading = false;
      }
    });
  }

  handleSearch(event: any) {
    const searchTerm = event.target.value.toLowerCase();
    this.searchTerm = searchTerm;
    
    if (!searchTerm) {
      this.filteredDatasets = this.datasets;
      return;
    }

    this.filteredDatasets = this.datasets.filter(dataset => {
      const searchableFields = [
        dataset.datasetName,
        dataset.description,
        dataset.fileType
      ].map(field => field?.toLowerCase() || '');

      // Split search term into words for multi-term search
      const searchTerms = searchTerm.split(' ').filter((term: string) => term.length > 0);

      // Check if all search terms are found in any of the searchable fields
      return searchTerms.every((term: string) =>
        searchableFields.some(field => field.includes(term))
      );
    });
  }

  async downloadLogsJson() {
    try {
      const blob = await this.http.get('http://localhost:5183/api/export/download/logs-json', { responseType: 'blob' }).toPromise();
      if (!blob) throw new Error('No data received');
      const url = window.URL.createObjectURL(blob as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dataset-logs.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      this.toastService.presentToast('success', '✅ Logs downloaded successfully!', 3500);
    } catch (error) {
      this.toastService.presentToast('error', '❌ Failed to download logs.', 3500);
    }
  }
} 