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
  IonSplitPane,
  IonMenu,
  IonMenuButton,
  IonButtons,
  IonBadge,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
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
  alertCircleOutline,
  menuOutline,
  peopleOutline,
  trendingUpOutline,
  listOutline
} from 'ionicons/icons';
import { ProjectService, Project, PendingAccessRequestWithProject } from '../../services/project.service';
import { RolePromotionService, RolePromotionRequestSummaryDTO, PromotionRequestStatus } from '../../services/role-promotion.service';
import { AuthService } from '../../services/auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-access-levels',
  template: `
    <ion-split-pane contentId="main-content">
      <!-- Sidebar Menu -->
      <ion-menu contentId="main-content" type="overlay">
        <ion-header>
          <ion-toolbar>
            <ion-title>Request Management</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-list>
            <ion-item 
              button 
              [class.selected]="selectedView === 'project-access'"
              (click)="selectView('project-access')">
              <ion-icon name="people-outline" slot="start"></ion-icon>
              <ion-label>Project Access Requests</ion-label>
              <ion-badge 
                *ngIf="pendingProjectRequests.length > 0" 
                color="warning" 
                slot="end">
                {{ pendingProjectRequests.length }}
              </ion-badge>
            </ion-item>
            
            <ion-item 
              button 
              [class.selected]="selectedView === 'role-promotion'"
              (click)="selectView('role-promotion')"
              *ngIf="currentUserRole === 'Admin'">
              <ion-icon name="trending-up-outline" slot="start"></ion-icon>
              <ion-label>Role Promotion Requests</ion-label>
              <ion-badge 
                *ngIf="pendingRolePromotions.length > 0" 
                color="primary" 
                slot="end">
                {{ pendingRolePromotions.length }}
              </ion-badge>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-menu>

      <!-- Main Content -->
      <div class="ion-page" id="main-content">
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-menu-button></ion-menu-button>
            </ion-buttons>
            <ion-title>{{ getPageTitle() }}</ion-title>
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

          <!-- Project Access Requests -->
          <div *ngIf="!loading && !error && selectedView === 'project-access'">
            <ion-card *ngFor="let request of pendingProjectRequests" class="request-card">
              <ion-card-header>
                <ion-card-title>
                  <ion-icon name="person-outline"></ion-icon>
                  {{ request.username }}
                </ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <div class="request-details">
                  <p><strong>Project:</strong> {{ request.projectName }}</p>
                  <p><strong>Email:</strong> {{ request.email }}</p>
                  <p><strong>Requested:</strong> {{ request.requestDate | date:'medium' }}</p>
                </div>
                <div class="action-buttons">
                  <ion-button 
                    fill="solid" 
                    color="success"
                    [disabled]="processingRequest === request.projectMemberId"
                    (click)="approveProjectRequest(request)">
                    <ion-spinner *ngIf="processingRequest === request.projectMemberId"></ion-spinner>
                    <ion-icon *ngIf="processingRequest !== request.projectMemberId" name="checkmark-outline" slot="start"></ion-icon>
                    Approve
                  </ion-button>
                  <ion-button 
                    fill="outline" 
                    color="danger"
                    [disabled]="processingRequest === request.projectMemberId"
                    (click)="denyProjectRequest(request)">
                    <ion-icon name="close-outline" slot="start"></ion-icon>
                    Deny
                  </ion-button>
                </div>
              </ion-card-content>
            </ion-card>

            <!-- Empty State for Project Requests -->
            <div *ngIf="pendingProjectRequests.length === 0" class="ion-text-center ion-padding">
              <ion-text color="medium">
                <h2>No Pending Project Access Requests</h2>
                <p>All project access requests have been processed.</p>
              </ion-text>
            </div>
          </div>

          <!-- Role Promotion Requests -->
          <div *ngIf="!loading && !error && selectedView === 'role-promotion' && currentUserRole === 'Admin'">
            <ion-card *ngFor="let request of pendingRolePromotions" class="request-card">
              <ion-card-header>
                <ion-card-title>
                  <ion-icon name="trending-up-outline"></ion-icon>
                  {{ request.username }}
                </ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <div class="request-details">
                  <p><strong>Current Role:</strong> {{ request.currentRole }}</p>
                  <p><strong>Requested Role:</strong> {{ request.requestedRole }}</p>
                  <p><strong>Requested:</strong> {{ request.requestDate | date:'medium' }}</p>
                  <p *ngIf="request.justification"><strong>Justification:</strong> {{ request.justification }}</p>
                </div>
                <div class="action-buttons">
                  <ion-button 
                    fill="solid" 
                    color="success"
                    [disabled]="processingPromotion === request.requestId"
                    (click)="approveRolePromotion(request)">
                    <ion-spinner *ngIf="processingPromotion === request.requestId"></ion-spinner>
                    <ion-icon *ngIf="processingPromotion !== request.requestId" name="checkmark-outline" slot="start"></ion-icon>
                    Approve
                  </ion-button>
                  <ion-button 
                    fill="outline" 
                    color="danger"
                    [disabled]="processingPromotion === request.requestId"
                    (click)="denyRolePromotion(request)">
                    <ion-icon name="close-outline" slot="start"></ion-icon>
                    Deny
                  </ion-button>
                </div>
              </ion-card-content>
            </ion-card>

            <!-- Empty State for Role Promotion Requests -->
            <div *ngIf="pendingRolePromotions.length === 0" class="ion-text-center ion-padding">
              <ion-text color="medium">
                <h2>No Pending Role Promotion Requests</h2>
                <p>All role promotion requests have been processed.</p>
              </ion-text>
            </div>
          </div>

          <!-- Unauthorized for Role Promotions -->
          <div *ngIf="!loading && !error && selectedView === 'role-promotion' && currentUserRole !== 'Admin'" class="ion-text-center ion-padding">
            <ion-text color="medium">
              <h2>Access Denied</h2>
              <p>Only administrators can view role promotion requests.</p>
            </ion-text>
          </div>
        </ion-content>
      </div>
    </ion-split-pane>
  `,
  styles: [`
    .selected {
      --background: var(--ion-color-primary);
      --color: white;
    }
    
    .request-card {
      margin-bottom: 16px;
    }
    
    .request-details {
      margin-bottom: 16px;
    }
    
    .request-details p {
      margin: 8px 0;
      color: var(--ion-color-medium);
    }
    
    .action-buttons {
      display: flex;
      gap: 12px;
      margin-top: 16px;
    }
    
    ion-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.2em;
    }
    
    ion-card-title ion-icon {
      color: var(--ion-color-primary);
    }
    
    ion-menu ion-item {
      --padding-start: 16px;
    }
    
    ion-menu ion-item.selected {
      --background: var(--ion-color-primary-tint);
      --color: var(--ion-color-primary-contrast);
    }
    
    ion-menu ion-item.selected ion-icon {
      color: var(--ion-color-primary-contrast);
    }
    
    ion-badge {
      font-size: 0.8em;
    }
    
    @media (max-width: 768px) {
      .action-buttons {
        flex-direction: column;
      }
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
    IonText,
    IonSplitPane,
    IonMenu,
    IonMenuButton,
    IonButtons,
    IonBadge,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent
  ]
})
export class AccessLevelsComponent implements OnInit {
  loading = true;
  error: string | null = null;
  selectedView: 'project-access' | 'role-promotion' = 'project-access';
  currentUserRole: string = '';
  
  // Project access requests
  pendingProjectRequests: PendingAccessRequestWithProject[] = [];
  processingRequest: number | null = null;
  
  // Role promotion requests  
  pendingRolePromotions: RolePromotionRequestSummaryDTO[] = [];
  processingPromotion: number | null = null;

  constructor(
    private projectService: ProjectService,
    private rolePromotionService: RolePromotionService,
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
      alertCircleOutline,
      menuOutline,
      peopleOutline,
      trendingUpOutline,
      listOutline
    });
  }

  ngOnInit() {
    this.getCurrentUserRole();
    this.loadData();
  }

  getCurrentUserRole() {
    const currentUser = this.authService.getCurrentUser();
    this.currentUserRole = currentUser?.role || currentUser?.Role || '';
  }

  selectView(view: 'project-access' | 'role-promotion') {
    this.selectedView = view;
  }

  getPageTitle(): string {
    return this.selectedView === 'project-access' 
      ? 'Project Access Requests' 
      : 'Role Promotion Requests';
  }

  async loadData() {
    this.loading = true;
    this.error = null;
    
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        this.error = 'No user logged in';
        this.loading = false;
        return;
      }

      const userId = currentUser.userId || currentUser.UserId || 0;

      // Load project access requests (for Lead Developers)
      if (this.currentUserRole === 'LeadDeveloper') {
        try {
          this.pendingProjectRequests = await firstValueFrom(
            this.projectService.getAllPendingRequestsForUser(userId)
          );
          console.log('Loaded project access requests:', this.pendingProjectRequests);
        } catch (error) {
          console.error('Error loading project requests:', error);
        }
      }

      // Load role promotion requests (for Admins)
      if (this.currentUserRole === 'Admin') {
        try {
          this.pendingRolePromotions = await firstValueFrom(
            this.rolePromotionService.getPendingRequests()
          );
          console.log('Loaded role promotion requests:', this.pendingRolePromotions);
        } catch (error) {
          console.error('Error loading role promotion requests:', error);
        }
      }
      
      this.loading = false;
    } catch (error: any) {
      console.error('Error loading data:', error);
      this.error = error.message || 'Failed to load requests';
      this.loading = false;
    }
  }

  // Project Access Request Methods
  async approveProjectRequest(request: PendingAccessRequestWithProject) {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.showToast('No user logged in', 'danger');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirm Approval',
      message: `Are you sure you want to approve access for ${request.username} to project "${request.projectName}"?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Approve',
          role: 'confirm',
          handler: () => this.processProjectApproval(request, currentUser.userId || currentUser.UserId || 0)
        }
      ]
    });

    await alert.present();
  }

  private async processProjectApproval(request: PendingAccessRequestWithProject, leadDeveloperId: number) {
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

  async denyProjectRequest(request: PendingAccessRequestWithProject) {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.showToast('No user logged in', 'danger');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirm Rejection',
      message: `Are you sure you want to deny access for ${request.username} to project "${request.projectName}"?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Deny',
          role: 'confirm',
          cssClass: 'danger',
          handler: () => this.processProjectDenial(request, currentUser.userId || currentUser.UserId || 0)
        }
      ]
    });

    await alert.present();
  }

  private async processProjectDenial(request: PendingAccessRequestWithProject, leadDeveloperId: number) {
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

  // Role Promotion Request Methods
  async approveRolePromotion(request: RolePromotionRequestSummaryDTO) {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.showToast('No user logged in', 'danger');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirm Role Promotion',
      message: `Are you sure you want to promote ${request.username} from ${request.currentRole} to ${request.requestedRole}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Approve',
          role: 'confirm',
          handler: () => this.processRolePromotionApproval(request, currentUser.userId || currentUser.UserId || 0)
        }
      ]
    });

    await alert.present();
  }

  private async processRolePromotionApproval(request: RolePromotionRequestSummaryDTO, adminId: number) {
    this.processingPromotion = request.requestId;

    try {
      await firstValueFrom(this.rolePromotionService.reviewPromotionRequest({
        requestId: request.requestId,
        reviewedBy: adminId,
        isApproved: true,
        adminComments: `Promotion approved by admin.`
      }));

      this.showToast('Role promotion approved', 'success');
      await this.loadData(); // Refresh the list
    } catch (error: any) {
      console.error('Error approving role promotion:', error);
      this.showToast(error.message || 'Failed to approve role promotion', 'danger');
    } finally {
      this.processingPromotion = null;
    }
  }

  async denyRolePromotion(request: RolePromotionRequestSummaryDTO) {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.showToast('No user logged in', 'danger');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Deny Role Promotion',
      message: `Are you sure you want to deny the promotion request for ${request.username}?`,
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Reason for denial (optional)',
          attributes: {
            maxlength: 500
          }
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Deny',
          role: 'confirm',
          cssClass: 'danger',
          handler: (data) => this.processRolePromotionDenial(request, currentUser.userId || currentUser.UserId || 0, data.reason)
        }
      ]
    });

    await alert.present();
  }

  private async processRolePromotionDenial(request: RolePromotionRequestSummaryDTO, adminId: number, reason: string) {
    this.processingPromotion = request.requestId;

    try {
      await firstValueFrom(this.rolePromotionService.reviewPromotionRequest({
        requestId: request.requestId,
        reviewedBy: adminId,
        isApproved: false,
        rejectionReason: reason || 'Request denied by admin.',
        adminComments: `Promotion denied by admin.`
      }));

      this.showToast('Role promotion denied', 'success');
      await this.loadData(); // Refresh the list
    } catch (error: any) {
      console.error('Error denying role promotion:', error);
      this.showToast(error.message || 'Failed to deny role promotion', 'danger');
    } finally {
      this.processingPromotion = null;
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