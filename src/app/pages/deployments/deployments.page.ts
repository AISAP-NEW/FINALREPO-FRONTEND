import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonButton, 
  IonIcon, 
  IonList, 
  IonItem, 
  IonLabel, 
  IonBadge, 
  IonSpinner,
  IonItemSliding,
  IonItemOption,
  IonItemOptions,
  IonButtons,
  IonMenuButton,
  IonFab,
  IonFabButton,
  IonNote,
  AlertController,
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
// Import individual icons from ionicons
import { 
  addOutline as addIcon,
  refreshOutline as refreshIcon,
  trashOutline as trashIcon,
  createOutline as createIcon,
  eyeOutline as eyeIcon,
  cloudOfflineOutline,
  cloudDoneOutline,
  cloudUploadOutline,
  cloudOffline,
  warningOutline as warningIcon,
  checkmarkCircleOutline as checkmarkCircleIcon,
  closeCircleOutline as closeCircleIcon
} from 'ionicons/icons';

interface Deployment {
  id: string;
  name: string;
  modelName: string;
  environment: string;
  status: 'active' | 'inactive' | 'deploying' | 'error' | 'updating';
  lastUpdated: Date;
  endpoint?: string;
}

@Component({
  selector: 'app-deployments',
  templateUrl: './deployments.page.html',
  styleUrls: ['./deployments.page.scss'],
  standalone: true,
  imports: [
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    IonButton, 
    IonIcon, 
    IonList, 
    IonItem, 
    IonLabel, 
    IonBadge, 
    IonSpinner,
    IonItemSliding,
    IonItemOption,
    IonItemOptions,
    IonButtons,
    IonMenuButton,
    IonFab,
    IonFabButton,
    IonNote,
    CommonModule, 
    FormsModule,
    DatePipe,
    TitleCasePipe,
    RouterLink
  ]
})
export class DeploymentsPage implements OnInit {
  // Icons for the template
  addIcon = 'add-outline';
  refreshIcon = 'refresh-outline';
  trashIcon = 'trash-outline';
  createIcon = 'create-outline';
  eyeIcon = 'eye-outline';
  cloudOfflineOutline = 'cloud-offline-outline';
  cloudDoneOutline = 'cloud-done-outline';
  cloudUploadOutline = 'cloud-upload-outline';
  warningIcon = 'warning-outline';
  checkmarkCircleIcon = 'checkmark-circle-outline';
  closeCircleIcon = 'close-circle-outline';

  loading = true;
  deployments: Deployment[] = [];

  constructor(
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {}

  ngOnInit() {
    this.loadDeployments();
  }

  async loadDeployments() {
    try {
      this.loading = true;
      // TODO: Replace with actual API call
      // this.deployments = await this.deploymentService.getDeployments().toPromise();
      
      // Mock data for now
      setTimeout(() => {
        this.deployments = [
          {
            id: '1',
            name: 'Sentiment Analysis Prod',
            modelName: 'sentiment-analysis-v3',
            environment: 'production',
            status: 'active',
            lastUpdated: new Date('2025-07-15T10:30:00'),
            endpoint: 'https://api.example.com/v1/sentiment'
          },
          {
            id: '2',
            name: 'Image Classifier Staging',
            modelName: 'image-classifier-v2',
            environment: 'staging',
            status: 'updating',
            lastUpdated: new Date('2025-07-18T14:22:00')
          },
          {
            id: '3',
            name: 'Fraud Detection',
            modelName: 'fraud-detection-v1',
            environment: 'development',
            status: 'error',
            lastUpdated: new Date('2025-07-19T09:15:00')
          }
        ];
        this.loading = false;
      }, 1000);
    } catch (error) {
      console.error('Error loading deployments:', error);
      this.presentToast('Failed to load deployments', 'danger');
      this.loading = false;
    }
  }

  async refreshDeployments(event?: any) {
    await this.loadDeployments();
    if (event) {
      event.target.complete();
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'medium';
      case 'deploying':
      case 'updating':
        return 'warning';
      case 'error': return 'danger';
      default: return 'medium';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'active': return 'cloud-done-outline';
      case 'inactive': return 'cloud-offline';
      case 'deploying':
      case 'updating':
        return 'cloud-upload-outline';
      case 'error': return 'warning';
      default: return 'cloud-offline-outline';
    }
  }

  async addDeployment() {
    const alert = await this.alertController.create({
      header: 'New Deployment',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Deployment Name'
        },
        {
          name: 'modelId',
          type: 'text',
          placeholder: 'Model ID'
        },
        {
          name: 'environment',
          type: 'text',
          placeholder: 'Environment (e.g., production, staging)'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            return true; // Allow cancel
          }
        },
        {
          text: 'Deploy',
          handler: async (data) => {
            if (!data.name || !data.modelId || !data.environment) {
              this.presentToast('Please fill in all fields', 'warning');
              return false; // Prevent dialog from closing
            }
            
            const loading = await this.loadingController.create({
              message: 'Creating deployment...'
            });
            
            try {
              await loading.present();
              // TODO: Replace with actual API call
              // await this.deploymentService.createDeployment(data).toPromise();
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              this.presentToast('Deployment created successfully', 'success');
              this.loadDeployments();
              return true; // Allow dialog to close
            } catch (error) {
              console.error('Error creating deployment:', error);
              this.presentToast('Failed to create deployment', 'danger');
              return false; // Keep dialog open on error
            } finally {
              loading.dismiss();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  viewDeployment(deployment: Deployment): void {
    console.log('View deployment:', deployment);
    // Navigate to deployment details page
    // this.router.navigate(['/deployments', deployment.id]);
  }

  editDeployment(deployment: Deployment) {
    console.log('Edit deployment:', deployment);
    // Open edit modal or navigate to edit page
  }

  async deleteDeployment(deployment: Deployment) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete the deployment "${deployment.name}"?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Deleting deployment...'
            });
            
            try {
              await loading.present();
              // TODO: Replace with actual API call
              // await this.deploymentService.deleteDeployment(deployment.id).toPromise();
              await new Promise(resolve => setTimeout(resolve, 800));
              
              this.presentToast('Deployment deleted', 'success');
              this.deployments = this.deployments.filter(d => d.id !== deployment.id);
            } catch (error) {
              console.error('Error deleting deployment:', error);
              this.presentToast('Failed to delete deployment', 'danger');
            } finally {
              loading.dismiss();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  private async presentToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
