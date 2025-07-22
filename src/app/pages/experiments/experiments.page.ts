import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { IonButton, IonContent, IonHeader, IonItem, IonLabel, IonList, IonTitle, IonToolbar, IonSearchbar, IonIcon } from '@ionic/angular/standalone';
import { ExperimentModalComponent } from './experiment-modal.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-experiments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonSearchbar, IonIcon, ExperimentModalComponent],
  templateUrl: './experiments.page.html',
  styleUrls: ['./experiments.page.scss']
})
export class ExperimentsPage implements OnInit {
  experiments: any[] = [];
  searchTerm: string = '';
  datasets: any[] = [];

  // Modal state
  modalOpen = false;
  modalMode: 'create' | 'edit' | 'view' = 'view';
  modalExperiment: any = {};

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadExperiments();
    this.loadDatasets();
  }

  loadExperiments() {
    this.http.get<any[]>(`${environment.apiUrl}/api/Experiment`).subscribe(data => {
      this.experiments = data;
    });
  }

  loadDatasets() {
    this.http.get<any[]>(`${environment.apiUrl}/api/Dataset`).subscribe(data => {
      this.datasets = data;
    });
  }

  filteredExperiments() {
    if (!this.searchTerm) return this.experiments;
    const term = this.searchTerm.toLowerCase();
    return this.experiments.filter(e =>
      (e.name && e.name.toLowerCase().includes(term)) ||
      (e.description && e.description.toLowerCase().includes(term))
    );
  }

  openCreateModal() {
    this.modalExperiment = { name: '', description: '' };
    this.modalMode = 'create';
    this.modalOpen = true;
  }

  openEditModal(experiment: any) {
    this.modalExperiment = { ...experiment };
    this.modalMode = 'edit';
    this.modalOpen = true;
  }

  viewExperiment(experiment: any) {
    this.modalExperiment = { ...experiment };
    this.modalMode = 'view';
    this.modalOpen = true;
  }

  closeModal() {
    this.modalOpen = false;
  }

  saveExperiment(exp: any) {
    if (this.modalMode === 'create') {
      this.http.post(`${environment.apiUrl}/api/Experiment`, exp).subscribe(() => {
        this.loadExperiments();
      });
    } else if (this.modalMode === 'edit') {
      this.http.put(`${environment.apiUrl}/api/Experiment/${exp.experimentId}`, exp).subscribe(() => {
        this.loadExperiments();
      });
    }
    this.closeModal();
  }

  deleteExperiment(experiment: any) {
    if (confirm('Delete experiment: ' + experiment.name + '?')) {
      this.http.delete(`${environment.apiUrl}/api/Experiment/${experiment.experimentId}`).subscribe(() => {
        this.loadExperiments();
      });
    }
  }
} 