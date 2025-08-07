import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  IonChip,
  IonRefresher,
  IonRefresherContent,
  IonText,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline,
  mailOutline,
  timeOutline,
  checkmarkOutline,
  closeOutline,
  briefcaseOutline,
  alertCircleOutline
} from 'ionicons/icons';
import { ProjectService, Project } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';
import { firstValueFrom } from 'rxjs';

interface PendingRequest {
  projectMemberId: number;
  projectId: number;
  userId: number;
  username: string;
  email: string;
  requestDate: Date;
  projectName?: string;
}

@Component({
  selector: 'app-access-levels',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Access Requests</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Loading State -->
      <div *ngIf="loading" class="ion-text-center ion-padding">
        <ion-spinner></ion-spinner>
        <p>Loading requests...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="ion-padding">
        <ion-item color="danger">
          <ion-icon name="alert-circle-outline" slot="start"></ion-icon>
          <ion-label class="ion-text-wrap">{{ error }}</ion-label>
        </ion-item>
      </div>

      <!-- Data State -->
      <ion-list *ngIf="!loading && !error">
        <div *ngFor="let project of projects">
          <ion-item lines="none" class="project-header">
            <ion-icon name="briefcase-outline" slot="start"></ion-icon>
            <ion-label>
              <h2>{{ project.name }}</h2>
              <p>
                <ion-chip [color]="getPendingRequestsForProject(project).length > 0 ? 'warning' : 'medium'" size="small">
                  {{ getPendingRequestsForProject(project).length }} Pending Requests
                </ion-chip>
              </p>
            </ion-label>
          </ion-item>

          <ion-item *ngFor="let request of getPendingRequestsForProject(project)" class="request-item">
            <ion-icon name="person-outline" slot="start" color="medium"></ion-icon>
            <ion-label>
              <h3>{{ request.username }}</h3>
              <p>
                <ion-icon name="mail-outline"></ion-icon>
                {{ request.email }}
              </p>
              <p>
                <ion-icon name="time-outline"></ion-icon>
                Requested: {{ request.requestDate | date:'medium' }}
              </p>
            </ion-label>
            <div class="action-buttons" slot="end">
              <ion-button
                fill="clear"
                color="success"
                [disabled]="processingRequest === request.projectMemberId"
                (click)="approveRequest(request)">
                <ion-spinner *ngIf="processingRequest === request.projectMemberId"></ion-spinner>
                <ion-icon *ngIf="processingRequest !== request.projectMemberId" name="checkmark-outline"></ion-icon>
              </ion-button>
              <ion-button
                fill="clear"
                color="danger"
                [disabled]="processingRequest === request.projectMemberId"
                (click)="denyRequest(request)">
                <ion-icon name="close-outline"></ion-icon>
              </ion-button>
            </div>
          </ion-item>

          <div *ngIf="getPendingRequestsForProject(project).length === 0" class="ion-text-center ion-padding-vertical request-empty">
            <ion-text color="medium">
              <p>No pending requests for this project</p>
            </ion-text>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="projects.length === 0" class="ion-text-center ion-padding">
          <ion-text color="medium">
            <h2>No Projects Found</h2>
            <p>You don't have any projects that you can manage access for.</p>
          </ion-text>
        </div>
      </ion-list>
    </ion-content>
  `,
  styles: [`
    .project-header {
      --background: var(--ion-color-light);
      margin-top: 16px;
      border-radius: 8px 8px 0 0;
    }
    .request-item {
      margin-left: 16px;
      --padding-start: 16px;
      --padding-end: 16px;
      --padding-top: 12px;
      --padding-bottom: 12px;
      --background: var(--ion-color-light-shade);
      margin-bottom: 1px;
    }
    .request-empty {
      margin-left: 16px;
      border-bottom: 1px solid var(--ion-color-light);
      background: var(--ion-color-light-shade);
      padding: 16px;
      margin-bottom: 16px;
    }
    ion-item ion-label h2 {
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--ion-color-dark);
    }
    ion-item ion-label h3 {
      font-weight: 500;
      margin-bottom: 4px;
      color: var(--ion-color-dark);
    }
    ion-item ion-label p {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 4px 0;
      color: var(--ion-color-medium);
    }
    ion-item ion-label p ion-icon {
      font-size: 16px;
      min-width: 16px;
      color: var(--ion-color-medium);
    }
    ion-item ion-icon[slot="start"] {
      color: var(--ion-color-medium);
      font-size: 24px;
      margin-right: 16px;
    }
    .action-buttons {
      display: flex;
      gap: 4px;
    }
    ion-button {
      margin: 0;
    }
    ion-chip {
      margin: 4px 0 0 0;
    }
    ion-spinner {
      width: 20px;
      height: 20px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
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
    IonChip,
    IonRefresher,
    IonRefresherContent,
    IonText
  ]
})
export class AccessLevelsComponent implements OnInit {
  loading = true;
  error: string | null = null;
  projects: Project[] = [];
  pendingRequests: PendingRequest[] = [];
  processingRequest: number | null = null;

  constructor(
    private projectService: ProjectService,
    private authService: AuthService,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    addIcons({
      personOutline,
      mailOutline,
      timeOutline,
      checkmarkOutline,
      closeOutline,
      briefcaseOutline,
      alertCircleOutline
    });
  }

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading = true;
    this.error = null;
    this.pendingRequests = [];
    
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        this.error = 'No user logged in';
        this.loading = false;
        return;
      }

      // Get all projects for the user
      this.projects = await firstValueFrom(this.projectService.getAllProjects());
      console.log('Loaded projects:', this.projects);
      
      // Get pending requests for each project
      for (const project of this.projects) {
        try {
          const requests = await firstValueFrom(
            this.projectService.getPendingRequests(project.projectId, currentUser.userId || currentUser.UserId || 0)
          );
          console.log(`Loaded requests for project ${project.name}:`, requests);
          
          if (requests && requests.length > 0) {
            this.pendingRequests.push(...requests.map(r => ({
              ...r,
              projectName: project.name
            })));
          }
        } catch (error) {
          console.error(`Error loading requests for project ${project.name}:`, error);
          // Continue loading other projects
        }
      }

      console.log('All pending requests:', this.pendingRequests);
      
      this.loading = false;
    } catch (error: any) {
      console.error('Error loading data:', error);
      this.error = error.message || 'Failed to load requests';
      this.loading = false;
    }
  }

  getPendingRequestsForProject(project: Project): PendingRequest[] {
    return this.pendingRequests.filter(request => request.projectId === project.projectId);
  }

  async approveRequest(request: PendingRequest) {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.showToast('No user logged in', 'danger');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirm Approval',
      message: `Are you sure you want to approve access for ${request.username}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Approve',
          role: 'confirm',
          handler: () => this.processApproval(request, currentUser.userId || currentUser.UserId || 0)
        }
      ]
    });

    await alert.present();
  }

  private async processApproval(request: PendingRequest, leadDeveloperId: number) {
    this.processingRequest = request.projectMemberId;

    try {
      await firstValueFrom(this.projectService.approveAccess({
        userId: request.userId,
        projectId: request.projectId,
        leadDeveloperId
      }));

      this.showToast('Access request approved', 'success');
      await this.loadData(); // Refresh the list
    } catch (error: any) {
      console.error('Error approving request:', error);
      this.showToast(error.message || 'Failed to approve request', 'danger');
    } finally {
      this.processingRequest = null;
    }
  }

  async denyRequest(request: PendingRequest) {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.showToast('No user logged in', 'danger');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirm Rejection',
      message: `Are you sure you want to deny access for ${request.username}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Deny',
          role: 'confirm',
          cssClass: 'danger',
          handler: () => this.processDenial(request, currentUser.userId || currentUser.UserId || 0)
        }
      ]
    });

    await alert.present();
  }

  private async processDenial(request: PendingRequest, leadDeveloperId: number) {
    this.processingRequest = request.projectMemberId;

    try {
      await firstValueFrom(this.projectService.denyAccess({
        userId: request.userId,
        projectId: request.projectId,
        leadDeveloperId
      }));

      this.showToast('Access request denied', 'success');
      await this.loadData(); // Refresh the list
    } catch (error: any) {
      console.error('Error denying request:', error);
      this.showToast(error.message || 'Failed to deny request', 'danger');
    } finally {
      this.processingRequest = null;
    }
  }

  async handleRefresh(event: any) {
    await this.loadData();
    event.target.complete();
  }

  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }
} 