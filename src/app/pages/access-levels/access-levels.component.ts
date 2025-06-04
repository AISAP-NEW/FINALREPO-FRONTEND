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
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline,
  mailOutline,
  timeOutline,
  checkmarkOutline,
  closeOutline,
  briefcaseOutline
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
  requestDate: string;
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

      <div *ngIf="loading" class="ion-text-center">
        <ion-spinner></ion-spinner>
        <p>Loading requests...</p>
      </div>

      <ion-list *ngIf="!loading">
        <div *ngFor="let project of projects">
          <ion-item lines="none" class="project-header">
            <ion-icon name="briefcase-outline" slot="start"></ion-icon>
            <ion-label>
              <h2>{{ project.name }}</h2>
              <p>
                <ion-chip color="primary" size="small">
                  {{ getPendingRequestsForProject(project).length }} Pending Requests
                </ion-chip>
              </p>
            </ion-label>
          </ion-item>

          <ion-item *ngFor="let request of getPendingRequestsForProject(project)" class="request-item">
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
            <ion-button
              slot="end"
              fill="solid"
              color="success"
              (click)="approveRequest(request)">
              <ion-icon slot="start" name="checkmark-outline"></ion-icon>
              Approve
            </ion-button>
            <ion-button
              slot="end"
              fill="solid"
              color="danger"
              (click)="denyRequest(request)">
              <ion-icon slot="start" name="close-outline"></ion-icon>
              Reject
            </ion-button>
          </ion-item>

          <div *ngIf="getPendingRequestsForProject(project).length === 0" class="ion-text-center ion-padding-vertical request-empty">
            <ion-text color="medium">
              <p>No pending requests for this project</p>
            </ion-text>
          </div>
        </div>

        <div *ngIf="projects.length === 0" class="ion-text-center ion-padding">
          <ion-text color="medium">
            <p>No projects found</p>
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
      --padding-top: 12px;
      --padding-bottom: 12px;
    }
    .request-empty {
      margin-left: 16px;
      border-bottom: 1px solid var(--ion-color-light);
    }
    ion-item ion-label h2 {
      font-weight: 600;
      margin-bottom: 8px;
    }
    ion-item ion-label h3 {
      font-weight: 500;
      margin-bottom: 4px;
    }
    ion-item ion-label p {
      display: flex;
      align-items: center;
      gap: 4px;
      margin: 4px 0;
    }
    ion-item ion-icon[slot="start"] {
      color: var(--ion-color-medium);
      font-size: 24px;
    }
    ion-button {
      margin: 0 4px;
    }
    ion-chip {
      margin: 4px 0 0 0;
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
  projects: Project[] = [];
  pendingRequests: PendingRequest[] = [];

  constructor(
    private projectService: ProjectService,
    private authService: AuthService,
    private toastController: ToastController
  ) {
    addIcons({
      personOutline,
      mailOutline,
      timeOutline,
      checkmarkOutline,
      closeOutline,
      briefcaseOutline
    });
  }

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    try {
      this.loading = true;
      this.pendingRequests = [];
      
      // Only lead developers can see pending requests
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser || currentUser.role !== 'LeadDeveloper') {
        this.loading = false;
        return;
      }

      // Get all projects for the lead developer
      this.projects = await firstValueFrom(this.projectService.getAllProjects());
      
      // Get pending requests for each project
      for (const project of this.projects) {
        const requests = await firstValueFrom(this.projectService.getPendingRequests(project.projectId));
        if (requests && requests.length > 0) {
          this.pendingRequests.push(...requests);
        }
      }

      // Filter out projects with no pending requests
      this.projects = this.projects.filter(project => 
        this.getPendingRequestsForProject(project).length > 0
      );
      
      this.loading = false;
    } catch (error) {
      console.error('Error loading data:', error);
      this.showToast('Failed to load requests', 'danger');
      this.loading = false;
    }
  }

  getPendingRequestsForProject(project: Project): PendingRequest[] {
    return this.pendingRequests.filter(request => request.projectId === project.projectId);
  }

  async approveRequest(request: PendingRequest) {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) return;

      await firstValueFrom(this.projectService.approveAccess(request.projectId, request.userId, currentUser.userId));
      
      // Remove the request from the list
      this.pendingRequests = this.pendingRequests.filter(r => r.projectMemberId !== request.projectMemberId);
      
      // If no more requests for this project, remove the project
      if (!this.getPendingRequestsForProject({ projectId: request.projectId } as Project).length) {
        this.projects = this.projects.filter(p => p.projectId !== request.projectId);
      }
      
      this.showToast('Access request approved', 'success');
    } catch (error) {
      console.error('Error approving request:', error);
      this.showToast('Failed to approve request', 'danger');
    }
  }

  async denyRequest(request: PendingRequest) {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) return;

      await firstValueFrom(this.projectService.denyAccess(request.projectId, request.userId, currentUser.userId));
      
      // Remove the request from the list
      this.pendingRequests = this.pendingRequests.filter(r => r.projectMemberId !== request.projectMemberId);
      
      // If no more requests for this project, remove the project
      if (!this.getPendingRequestsForProject({ projectId: request.projectId } as Project).length) {
        this.projects = this.projects.filter(p => p.projectId !== request.projectId);
      }
      
      this.showToast('Access request denied', 'success');
    } catch (error) {
      console.error('Error denying request:', error);
      this.showToast('Failed to deny request', 'danger');
    }
  }

  handleRefresh(event: any) {
    this.loadData();
    event.target.complete();
  }

  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color
    });
    await toast.present();
  }
} 