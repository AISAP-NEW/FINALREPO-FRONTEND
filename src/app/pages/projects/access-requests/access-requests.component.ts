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
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonChip,
  ToastController
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { 
  checkmarkOutline, 
  closeOutline,
  personOutline,
  mailOutline,
  timeOutline
} from 'ionicons/icons';
import { ProjectService } from '../../../services/project.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-access-requests',
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
    IonRefresher,
    IonRefresherContent,
    IonChip
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Access Requests</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="ion-padding">
        <div *ngIf="loading" class="ion-text-center">
          <ion-spinner></ion-spinner>
        </div>

        <ion-list *ngIf="!loading">
          <div *ngIf="pendingRequests.length === 0" class="ion-text-center ion-padding">
            <p>No pending access requests</p>
          </div>

          <ion-item *ngFor="let request of pendingRequests">
            <ion-label>
              <h2>{{ request.username }}</h2>
              <p>
                <ion-icon name="mail-outline"></ion-icon>
                {{ request.email }}
              </p>
              <div class="request-meta">
                <ion-chip color="primary" size="small">
                  <ion-icon name="time-outline"></ion-icon>
                  <ion-label>{{ request.requestDate | date:'medium' }}</ion-label>
                </ion-chip>
              </div>
            </ion-label>
            
            <div slot="end" class="request-actions">
              <ion-button
                color="success"
                fill="clear"
                (click)="approveRequest(request)">
                <ion-icon slot="icon-only" name="checkmark-outline"></ion-icon>
              </ion-button>
              <ion-button
                color="danger"
                fill="clear"
                (click)="denyRequest(request)">
                <ion-icon slot="icon-only" name="close-outline"></ion-icon>
              </ion-button>
            </div>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>
  `,
  styles: [`
    .request-meta {
      margin-top: 8px;
    }
    .request-actions {
      display: flex;
      gap: 8px;
    }
    ion-item h2 {
      font-weight: bold;
      margin-bottom: 5px;
    }
    ion-item p {
      display: flex;
      align-items: center;
      gap: 4px;
      margin: 4px 0;
    }
    ion-chip {
      margin: 0;
    }
  `]
})
export class AccessRequestsComponent implements OnInit {
  loading = true;
  pendingRequests: any[] = [];

  constructor(
    private projectService: ProjectService,
    private authService: AuthService,
    private toastController: ToastController
  ) {
    addIcons({ checkmarkOutline, closeOutline, personOutline, mailOutline, timeOutline });
  }

  ngOnInit() {
    this.loadPendingRequests();
  }

  async loadPendingRequests() {
    this.loading = true;
    try {
      const userId = this.authService.getCurrentUserId();
      // Get all projects where the current user is a lead developer
      const projects = await this.projectService.getProjects().toPromise();
      if (!projects) {
        throw new Error('Failed to load projects');
      }
      
      const leadProjects = projects.filter(p => 
        p.members.some(m => m.userId === userId && m.role === 'LeadDeveloper')
      );

      // Get pending requests for each project
      this.pendingRequests = [];
      for (const project of leadProjects) {
        const requests = await this.projectService.getPendingRequests(project.projectId, userId).toPromise();
        if (requests) {
          this.pendingRequests.push(...requests.map(r => ({
            ...r,
            projectName: project.name,
            projectId: project.projectId
          })));
        }
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
      this.showToast('Error loading pending requests', 'danger');
    } finally {
      this.loading = false;
    }
  }

  async handleRefresh(event: any) {
    await this.loadPendingRequests();
    event.target.complete();
  }

  async approveRequest(request: any) {
    try {
      const userId = this.authService.getCurrentUserId();
      await this.projectService.approveAccess({
        userId: request.userId,
        projectId: request.projectId,
        leadDeveloperId: userId
      }).toPromise();
      
      this.pendingRequests = this.pendingRequests.filter(r => 
        r.userId !== request.userId || r.projectId !== request.projectId
      );
      
      this.showToast('Access request approved', 'success');
    } catch (error) {
      console.error('Error approving request:', error);
      this.showToast('Error approving request', 'danger');
    }
  }

  async denyRequest(request: any) {
    try {
      const userId = this.authService.getCurrentUserId();
      await this.projectService.denyAccess({
        userId: request.userId,
        projectId: request.projectId,
        leadDeveloperId: userId
      }).toPromise();
      
      this.pendingRequests = this.pendingRequests.filter(r => 
        r.userId !== request.userId || r.projectId !== request.projectId
      );
      
      this.showToast('Access request denied', 'success');
    } catch (error) {
      console.error('Error denying request:', error);
      this.showToast('Error denying request', 'danger');
    }
  }

  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
} 