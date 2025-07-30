import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { 
  IonButton, IonContent, IonHeader, IonItem, IonLabel, IonList, 
  IonTitle, IonToolbar, IonSearchbar, IonIcon, IonBadge, IonButtons,
  ModalController, AlertController, IonFab, IonFabButton
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { addCircleOutline, play, eye, create, trash, refresh } from 'ionicons/icons';
import { ExperimentModalComponent } from './experiment-modal.component';
import { ExperimentExecutionComponent } from './experiment-execution.component';

@Component({
  selector: 'app-experiments',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonList, 
    IonItem, 
    IonLabel, 
    IonButton, 
    IonSearchbar, 
    IonIcon, 
    IonBadge, 
    IonButtons,
    IonFab,
    IonFabButton,
    ExperimentExecutionComponent,
    ExperimentModalComponent
  ],
  templateUrl: './experiments.page.html',
  styles: [`
    ion-item {
      --padding-start: 0;
      --inner-padding-end: 0;
    }
  `]
})
export class ExperimentsPage implements OnInit {
  experiments: any[] = [];
  searchTerm: string = '';
  datasets: any[] = [];
  
  // Modal state
  modalOpen = false;
  modalMode: 'create' | 'edit' | 'view' = 'view';
  modalExperiment: any = {};
  
  // Execution state
  executionModalOpen = false;
  executionExperiment: any = {};
  executionResults: { [key: number]: any } = {};

  constructor(
    private http: HttpClient,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private router: Router
  ) {
    addIcons({ 
      add: 'add',
      addCircleOutline, 
      play, 
      eye, 
      create, 
      trash, 
      refresh 
    });
  }

  ngOnInit() {
    this.loadExperiments();
    this.loadDatasets();
  }

  loadExperiments() {
    console.log('Loading experiments...');
    this.http.get<any[]>(`${environment.apiUrl}/api/Experiment`).subscribe({
      next: (data) => {
        console.log('Experiments loaded:', data);
        this.experiments = data || [];
      },
      error: (error) => {
        console.error('Error loading experiments:', error);
      }
    });
  }

  get filteredExperiments() {
    if (!this.searchTerm.trim()) {
      return this.experiments;
    }
    const term = this.searchTerm.toLowerCase();
    return this.experiments.filter(exp => 
      (exp.Name && exp.Name.toLowerCase().includes(term)) ||
      (exp.name && exp.name.toLowerCase().includes(term)) ||
      (exp.Description && exp.Description.toLowerCase().includes(term)) ||
      (exp.description && exp.description.toLowerCase().includes(term))
    );
  }
  
  // Simple method to load datasets (if needed)
  loadDatasets() {
    // This is a placeholder - implement if needed
    console.log('Datasets would be loaded here');
  }
  
  // Method to handle refreshing the experiments list
  refreshExperiments() {
    this.loadExperiments();
  }

  // Modal and action methods
  openCreateModal() {
    this.modalExperiment = { 
      Name: '', 
      Description: '',
      Status: 'Draft'
    };
    this.modalMode = 'create';
    this.modalOpen = true;
  }

  openEditModal(experiment: any) {
    this.modalExperiment = { 
      ...experiment,
      Name: experiment.name || experiment.Name,
      Description: experiment.description || experiment.Description,
      Status: experiment.status || experiment.Status || 'Draft',
      ExperimentId: experiment.id || experiment.ExperimentId
    };
    this.modalMode = 'edit';
    this.modalOpen = true;
  }

  viewExperiment(experiment: any) {
    this.modalExperiment = { 
      ...experiment,
      Name: experiment.name || experiment.Name,
      Description: experiment.description || experiment.Description,
      Status: experiment.status || experiment.Status || 'Draft',
      ExperimentId: experiment.id || experiment.ExperimentId
    };
    this.modalMode = 'view';
    this.modalOpen = true;
  }

  closeModal() {
    this.modalOpen = false;
  }

  async confirmDelete(experiment: any) {
    const alert = await this.alertCtrl.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete "${experiment.Name || experiment.name}"?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          handler: () => this.deleteExperiment(experiment)
        }
      ]
    });
    await alert.present();
  }

  deleteExperiment(experiment: any) {
    const experimentId = experiment.ExperimentId || experiment.id;
    if (!experimentId) {
      console.error('No experiment ID found for deletion');
      return;
    }

    this.http.delete(`${environment.apiUrl}/api/Experiment/${experimentId}`).subscribe({
      next: () => {
        this.loadExperiments();
      },
      error: (error) => {
        console.error('Error deleting experiment:', error);
      }
    });
  }

  runExperiment(experiment: any) {
    this.executionExperiment = { 
      ...experiment,
      ExperimentId: experiment.ExperimentId || experiment.id
    };
    this.executionModalOpen = true;
  }

  closeExecutionModal() {
    this.executionModalOpen = false;
  }

  onExecutionComplete(result: any) {
    if (result && result.ExperimentId) {
      this.executionResults[result.ExperimentId] = result;
    }
    this.loadExperiments();
  }

  async saveExperiment(event: any) {
    const { formData, mode, experiment, onComplete } = event;
    
    try {
      const url = mode === 'create' 
        ? `${environment.apiUrl}/api/Experiment` 
        : `${environment.apiUrl}/api/Experiment/${experiment.ExperimentId}`;
      
      console.log(`Saving experiment (${mode}) to:`, url);
      
      const request = mode === 'create' 
        ? this.http.post(url, formData) 
        : this.http.put(url, formData);
      
      request.subscribe({
        next: async (response) => {
          console.log('Experiment saved successfully:', response);
          
          // Show success message
          const alert = await this.alertCtrl.create({
            header: 'Success',
            message: `Experiment ${mode === 'create' ? 'created' : 'updated'} successfully`,
            buttons: ['OK']
          });
          await alert.present();
          
          // Refresh the experiments list
          this.loadExperiments();
          this.closeModal();
          
          // Call the completion handler
          if (onComplete) onComplete();
        },
        error: async (error) => {
          console.error('Error saving experiment:', error);
          
          // Show error message
          const alert = await this.alertCtrl.create({
            header: 'Error',
            message: `Failed to ${mode} experiment: ${error.message || 'Unknown error'}`,
            buttons: ['OK']
          });
          await alert.present();
          
          // Call the completion handler
          if (onComplete) onComplete();
        }
      });
    } catch (error) {
      console.error('Unexpected error during save:', error);
      if (onComplete) onComplete();
    }
  }

  // Helper methods
  getStatusColor(status: string): string {
    if (!status) return 'medium';
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'running':
        return 'primary';
      case 'failed':
        return 'danger';
      case 'pending':
        return 'warning';
      case 'draft':
      default:
        return 'medium';
    }
  }

  hasExecutionResult(experimentId: number): boolean {
    return !!this.executionResults[experimentId];
  }

  private getExperimentId(experiment: any): number {
    return experiment.ExperimentId || experiment.id;
  }



  // Get execution status for display
  getExecutionStatus(experimentId: number): string {
    const result = this.executionResults[experimentId];
    if (!result) return '';
    return result.status || result.Status || '';
  }

  // Get color for execution status
  getExecutionStatusColor(experimentId: number): string {
    const status = this.getExecutionStatus(experimentId).toLowerCase();
    switch (status) {
      case 'completed':
        return 'success';
      case 'running':
        return 'primary';
      case 'failed':
        return 'danger';
      case 'pending':
        return 'warning';
      default:
        return 'medium';
    }
  }
}