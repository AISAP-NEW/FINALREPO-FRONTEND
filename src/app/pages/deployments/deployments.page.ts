import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSearchbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButtons,
  IonMenuButton,
  IonFab,
  IonFabButton,
  IonButton,
  IonIcon,
  IonSpinner,
  IonBadge,
  IonChip,
  AlertController,
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { DeploymentService, PipelineResponseDTO, VirtualMachineDTO, DeploymentScheduleResponseDTO, ModelDeploymentResponseDTO } from '../../services/deployment.service';
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
    CommonModule,
    FormsModule,
    HttpClientModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonSearchbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButtons,
    IonMenuButton,
    IonFab,
    IonFabButton,
    IonButton,
    IonIcon,
    IonSpinner,
    IonBadge,
    IonChip
  ]
})
export class DeploymentsPage implements OnInit, OnDestroy {
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

  private subscriptions: Subscription[] = [];
  
  // Real data from backend
  pipelines: PipelineResponseDTO[] = [];
  virtualMachines: VirtualMachineDTO[] = [];
  scheduledDeployments: DeploymentScheduleResponseDTO[] = [];
  deployments: ModelDeploymentResponseDTO[] = [];
  
  // UI state
  selectedSegment: string = 'pipelines';
  searchTerm: string = '';
  isLoading: boolean = false;
  
  constructor(
    private deploymentService: DeploymentService,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    this.registerIcons();
  }

  ngOnInit() {
    this.loadAllData();
  }
  
  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  async loadAllData() {
    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: 'Loading deployment data...'
    });
    await loading.present();
    
    try {
      // Load pipelines
      const pipelinesSub = this.deploymentService.pipelines$.subscribe({
        next: (pipelines) => {
          this.pipelines = pipelines;
        },
        error: (error) => {
          console.error('Error loading pipelines:', error);
          this.showErrorToast('Failed to load pipelines');
        }
      });
      this.subscriptions.push(pipelinesSub);
      
      // Load virtual machines
      const vmSub = this.deploymentService.virtualMachines$.subscribe({
        next: (vms) => {
          this.virtualMachines = vms;
        },
        error: (error) => {
          console.error('Error loading virtual machines:', error);
          this.showErrorToast('Failed to load virtual machines');
        }
      });
      this.subscriptions.push(vmSub);
      
      // Load scheduled deployments
      const scheduleSub = this.deploymentService.scheduledDeployments$.subscribe({
        next: (schedules) => {
          this.scheduledDeployments = schedules;
        },
        error: (error) => {
          console.error('Error loading scheduled deployments:', error);
          this.showErrorToast('Failed to load scheduled deployments');
        }
      });
      this.subscriptions.push(scheduleSub);
      
      // Load deployments
      const deploymentsSub = this.deploymentService.deployments$.subscribe({
        next: (deployments) => {
          this.deployments = deployments;
        },
        error: (error) => {
          console.error('Error loading deployments:', error);
          this.showErrorToast('Failed to load deployments');
        }
      });
      this.subscriptions.push(deploymentsSub);
      
    } catch (error) {
      console.error('Error loading deployment data:', error);
      this.showErrorToast('Failed to load deployment data');
    } finally {
      this.isLoading = false;
      await loading.dismiss();
    }
  }

  async refreshDeployments(event?: any) {
    this.loadAllData();
    if (event) {
      event.target.complete();
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
              
              this.showSuccessToast('Deployment created successfully');
              this.loadAllData();
              return true; // Allow dialog to close
            } catch (error) {
              console.error('Error creating deployment:', error);
              this.showErrorToast('Failed to create deployment');
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

  viewDeployment(deployment: ModelDeploymentResponseDTO) {
    console.log('View deployment:', deployment);
    // Navigate to deployment details
  }

  editDeployment(deployment: ModelDeploymentResponseDTO) {
    console.log('Edit deployment:', deployment);
    // Open edit modal or navigate to edit page
  }

  async deleteDeployment(deployment: ModelDeploymentResponseDTO) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete the deployment "${deployment.appName || 'Unknown'}"?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            try {
              const loading = await this.loadingController.create({
                message: 'Deleting deployment...'
              });
              await loading.present();
              
              // TODO: Implement actual deletion via API
              // await this.deploymentService.deleteDeployment(deployment.deploymentId);
              
              // For now, remove from local array
              this.deployments = this.deployments.filter(d => d.deploymentId !== deployment.deploymentId);
              
              await loading.dismiss();
              this.showSuccessToast('Deployment deleted successfully');
            } catch (error) {
              console.error('Error deleting deployment:', error);
              this.showErrorToast('Failed to delete deployment');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Utility Methods
  private registerIcons(): void {
    // Icons are already imported and assigned to class properties
    // This method exists for consistency with other pages
  }

  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'danger',
      position: 'bottom'
    });
    await toast.present();
  }

  private async showSuccessToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'success',
      position: 'bottom'
    });
    await toast.present();
  }

  private async presentToast(message: string, color: 'success' | 'danger' | 'warning' = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  // Filtering and Search Methods
  getFilteredPipelines(): PipelineResponseDTO[] {
    if (!this.searchTerm) {
      return this.pipelines;
    }
    return this.pipelines.filter(pipeline => 
      pipeline.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      pipeline.status.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  getFilteredVirtualMachines(): VirtualMachineDTO[] {
    if (!this.searchTerm) {
      return this.virtualMachines;
    }
    return this.virtualMachines.filter(vm => 
      vm.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      vm.environment.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      vm.status.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  getFilteredScheduledDeployments(): DeploymentScheduleResponseDTO[] {
    if (!this.searchTerm) {
      return this.scheduledDeployments;
    }
    return this.scheduledDeployments.filter(schedule => 
      schedule.pipelineName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      schedule.targetEnv.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      schedule.status.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  getFilteredDeployments(): ModelDeploymentResponseDTO[] {
    if (!this.searchTerm) {
      return this.deployments;
    }
    return this.deployments.filter(deployment => 
      deployment.appName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      deployment.environment.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      deployment.status.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  // Segment Change Handler
  onSegmentChange(event: any): void {
    this.selectedSegment = event.detail.value;
  }

  // Search Handler
  onSearchChange(event: any): void {
    this.searchTerm = event.detail.value;
  }

  // Status Utility Methods
  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'deployed':
      case 'running':
      case 'healthy':
      case 'success':
        return 'success';
      case 'pending':
      case 'scheduled':
      case 'deploying':
      case 'updating':
        return 'warning';
      case 'failed':
      case 'error':
      case 'unhealthy':
      case 'offline':
        return 'danger';
      case 'stopped':
      case 'inactive':
        return 'medium';
      default:
        return 'primary';
    }
  }

  getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'deployed':
      case 'running':
      case 'healthy':
      case 'success':
        return 'checkmark-circle-outline';
      case 'pending':
      case 'scheduled':
      case 'deploying':
      case 'updating':
        return 'time-outline';
      case 'failed':
      case 'error':
      case 'unhealthy':
      case 'offline':
        return 'close-circle-outline';
      case 'stopped':
      case 'inactive':
        return 'pause-circle-outline';
      default:
        return 'ellipse-outline';
    }
  }
}
