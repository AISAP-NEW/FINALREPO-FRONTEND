import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  IonIcon,
  IonButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSearchbar,
  IonBadge,
  IonProgressBar,
  IonGrid,
  IonRow,
  IonCol,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  flaskOutline,
  eyeOutline,
  gitCompareOutline,
  downloadOutline,
  trashOutline,
  addCircleOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  createOutline,
  informationCircleOutline
} from 'ionicons/icons';

interface Experiment {
  id: string;
  name: string;
  description: string;
  status: 'running' | 'completed' | 'failed' | 'pending';
  createdAt: Date;
  metrics?: {
    accuracy?: number;
    loss?: number;
  };
  duration?: string;
  model?: string;
  progress?: number;
}

interface Activity {
  id: string;
  type: 'created' | 'completed' | 'failed' | 'updated';
  title: string;
  description: string;
  timestamp: Date;
}

@Component({
  selector: 'app-experiments',
  templateUrl: './experiments.page.html',
  styleUrls: ['./experiments.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonMenuButton,
    IonIcon,
    IonButton,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonSearchbar,
    IonBadge,
    IonProgressBar
  ]
})
export class ExperimentsPage implements OnInit {
  experiments: Experiment[] = [];
  filteredExperiments: Experiment[] = [];
  recentActivity: Activity[] = [];
  selectedStatus: string = 'all';
  searchTerm: string = '';

  constructor(
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      'add-outline': addOutline,
      'flask-outline': flaskOutline,
      'eye-outline': eyeOutline,
      'git-compare-outline': gitCompareOutline,
      'download-outline': downloadOutline,
      'trash-outline': trashOutline,
      'add-circle-outline': addCircleOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'close-circle-outline': closeCircleOutline,
      'create-outline': createOutline,
      'information-circle-outline': informationCircleOutline
    });
  }

  ngOnInit() {
    this.loadExperiments();
    this.loadRecentActivity();
  }

  loadExperiments() {
    // Mock data - replace with actual API call
    this.experiments = [
      {
        id: 'exp_001',
        name: 'Image Classification Model v1',
        description: 'Training CNN model for image classification with ResNet architecture',
        status: 'running',
        createdAt: new Date('2024-01-15T10:30:00'),
        metrics: {
          accuracy: 87.5,
          loss: 0.234
        },
        duration: '2h 15m',
        model: 'ResNet-50',
        progress: 65
      },
      {
        id: 'exp_002',
        name: 'Sentiment Analysis BERT',
        description: 'Fine-tuning BERT model for sentiment analysis on customer reviews',
        status: 'completed',
        createdAt: new Date('2024-01-14T14:20:00'),
        metrics: {
          accuracy: 92.3,
          loss: 0.156
        },
        duration: '4h 32m',
        model: 'BERT-base'
      },
      {
        id: 'exp_003',
        name: 'Time Series Forecasting',
        description: 'LSTM model for predicting stock prices with technical indicators',
        status: 'failed',
        createdAt: new Date('2024-01-13T09:15:00'),
        metrics: {
          accuracy: 45.2,
          loss: 1.234
        },
        duration: '1h 45m',
        model: 'LSTM'
      },
      {
        id: 'exp_004',
        name: 'Object Detection YOLOv8',
        description: 'Training YOLOv8 model for real-time object detection',
        status: 'completed',
        createdAt: new Date('2024-01-12T16:45:00'),
        metrics: {
          accuracy: 89.7,
          loss: 0.189
        },
        duration: '6h 12m',
        model: 'YOLOv8'
      },
      {
        id: 'exp_005',
        name: 'Recommendation System',
        description: 'Collaborative filtering model for product recommendations',
        status: 'pending',
        createdAt: new Date('2024-01-16T08:00:00'),
        model: 'Matrix Factorization'
      }
    ];

    this.filteredExperiments = [...this.experiments];
  }

  loadRecentActivity() {
    // Mock data - replace with actual API call
    this.recentActivity = [
      {
        id: 'act_001',
        type: 'completed',
        title: 'Experiment Completed',
        description: 'Sentiment Analysis BERT experiment finished successfully',
        timestamp: new Date('2024-01-15T16:30:00')
      },
      {
        id: 'act_002',
        type: 'created',
        title: 'New Experiment Created',
        description: 'Image Classification Model v1 experiment started',
        timestamp: new Date('2024-01-15T10:30:00')
      },
      {
        id: 'act_003',
        type: 'failed',
        title: 'Experiment Failed',
        description: 'Time Series Forecasting experiment encountered an error',
        timestamp: new Date('2024-01-13T11:00:00')
      },
      {
        id: 'act_004',
        type: 'updated',
        title: 'Experiment Updated',
        description: 'Object Detection YOLOv8 parameters were modified',
        timestamp: new Date('2024-01-12T14:20:00')
      }
    ];
  }

  filterByStatus(event: any) {
    this.selectedStatus = event.detail.value;
    this.applyFilters();
  }

  filterExperiments(event: any) {
    this.searchTerm = event.target.value;
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.experiments];

    // Filter by status
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(exp => exp.status === this.selectedStatus);
    }

    // Filter by search term
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(exp => 
        exp.name.toLowerCase().includes(term) ||
        exp.description.toLowerCase().includes(term) ||
        exp.id.toLowerCase().includes(term) ||
        (exp.model && exp.model.toLowerCase().includes(term))
      );
    }

    this.filteredExperiments = filtered;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'running':
        return 'primary';
      case 'completed':
        return 'success';
      case 'failed':
        return 'danger';
      case 'pending':
        return 'warning';
      default:
        return 'medium';
    }
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'created':
        return 'add-circle-outline';
      case 'completed':
        return 'checkmark-circle-outline';
      case 'failed':
        return 'close-circle-outline';
      case 'updated':
        return 'create-outline';
      default:
        return 'information-circle-outline';
    }
  }

  async createNewExperiment() {
    const alert = await this.alertController.create({
      header: 'Create New Experiment',
      message: 'This feature will open the experiment creation wizard.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Continue',
          handler: () => {
            this.showToast('Experiment creation wizard would open here');
          }
        }
      ]
    });

    await alert.present();
  }

  async viewExperiment(experiment: Experiment) {
    this.showToast(`Viewing details for: ${experiment.name}`);
    // Navigate to experiment details page
  }

  async compareExperiment(experiment: Experiment) {
    this.showToast(`Compare feature for: ${experiment.name}`);
    // Navigate to experiment comparison page
  }

  async downloadResults(experiment: Experiment) {
    this.showToast(`Downloading results for: ${experiment.name}`);
    // Implement download functionality
  }

  async deleteExperiment(experiment: Experiment) {
    const alert = await this.alertController.create({
      header: 'Delete Experiment',
      message: `Are you sure you want to delete "${experiment.name}"? This action cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.experiments = this.experiments.filter(exp => exp.id !== experiment.id);
            this.applyFilters();
            this.showToast('Experiment deleted successfully');
          }
        }
      ]
    });

    await alert.present();
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }
}
