import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonSpinner,
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
  alertCircleOutline,
  peopleOutline,
  folderOutline,
  checkmarkCircleOutline,
  addOutline,
  calendarOutline,
  codeOutline,
  eyeOutline,
  handRightOutline
} from 'ionicons/icons';
import { ProjectService, PendingAccessRequestWithProject, Project } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-project-access-requests',
  template: `
    <ion-header class="header-modern">
      <ion-toolbar>
        <ion-title class="page-title">
          <ion-icon name="people-outline"></ion-icon>
          {{ isLeadDeveloper ? 'Manage Access Requests' : 'Request Project Access' }}
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="modern-content">
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="content-container">
        <!-- Header Stats -->
        <div class="stats-header" *ngIf="!loading">
          <div class="stat-item" *ngIf="isLeadDeveloper">
            <div class="stat-number">{{ pendingRequests.length }}</div>
            <div class="stat-label">Pending Requests</div>
          </div>
          <div class="stat-item" *ngIf="!isLeadDeveloper">
            <div class="stat-number">{{ availableProjects.length }}</div>
            <div class="stat-label">Available Projects</div>
          </div>
        </div>

        

        <!-- Loading State -->
        <div *ngIf="loading" class="loading-state">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p>{{ isLeadDeveloper ? 'Loading access requests...' : 'Loading available projects...' }}</p>
        </div>

        <!-- Error State -->
        <div *ngIf="error" class="error-state">
          <ion-icon name="alert-circle-outline"></ion-icon>
          <h3>Error Loading {{ isLeadDeveloper ? 'Requests' : 'Projects' }}</h3>
          <p>{{ error }}</p>
          <button class="btn btn-primary" (click)="loadData()">
            <ion-icon name="checkmark-outline"></ion-icon>
            Retry
          </button>
        </div>

        <!-- Lead Developer View - Manage Access Requests -->
        <div *ngIf="!loading && !error && isLeadDeveloper" class="requests-container">
          <!-- Request Table -->
          <div class="table-container" *ngIf="pendingRequests.length > 0">
            <div class="table-header">
              <h2>Pending Access Requests</h2>
              <p>Review and manage access requests from team members</p>
            </div>
            <table class="requests-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Project</th>
                  <th>Email</th>
                  <th>Requested</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let request of pendingRequests" class="request-row">
                  <td class="user-cell">
                    <div class="user-info">
                      <div class="user-avatar" [style.background]="getUserAvatarColor(request.username)">
                        <!-- Show profile picture if available, otherwise show initials -->
                        <img 
                          [src]="getUserProfilePictureUrl(request)" 
                          [alt]="request.username + ' profile picture'"
                          class="profile-picture"
                          (error)="onProfilePictureError($event, request)"
                        />
                      </div>
                      <div class="user-details">
                        <div class="username">{{ request.username }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="project-cell">
                    <div class="project-info">
                      <ion-icon name="folder-outline"></ion-icon>
                      <span>{{ request.projectName }}</span>
                    </div>
                  </td>
                  <td class="email-cell">{{ request.email }}</td>
                  <td class="date-cell">{{ request.requestDate | date:'MMM d, y' }}</td>
                  <td class="actions-cell">
                    <div class="action-buttons">
                      <button 
                        class="btn btn-success"
                        [disabled]="processingRequest === request.projectMemberId"
                        (click)="approveRequest(request)">
                        <ion-spinner *ngIf="processingRequest === request.projectMemberId" name="lines-small"></ion-spinner>
                        <ion-icon *ngIf="processingRequest !== request.projectMemberId" name="checkmark-outline"></ion-icon>
                        <span *ngIf="processingRequest !== request.projectMemberId">Approve</span>
                      </button>
                      <button 
                        class="btn btn-danger"
                        [disabled]="processingRequest === request.projectMemberId"
                        (click)="denyRequest(request)">
                        <ion-icon name="close-outline"></ion-icon>
                        Deny
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Empty State for Lead Developer -->
          <div *ngIf="pendingRequests.length === 0" class="empty-state">
            <ion-icon name="checkmark-circle-outline"></ion-icon>
            <h3>All Caught Up!</h3>
            <p>No pending project access requests at the moment.</p>
          </div>
        </div>

        <!-- Developer View - Request Access to Projects -->
        <div *ngIf="!loading && !error && !isLeadDeveloper" class="projects-container">
          <!-- Projects Grid -->
          <div class="projects-grid" *ngIf="availableProjects.length > 0">
            <div class="grid-header">
              <h2>Available Projects</h2>
              <p>Request access to projects you'd like to join</p>
            </div>
            
            <div class="project-cards">
              <div *ngFor="let project of availableProjects" class="project-card">
                <div class="project-header">
                  <div class="project-icon">
                    <ion-icon name="folder-outline"></ion-icon>
                  </div>
                  <div class="project-title">
                    <h3>{{ project.name }}</h3>
                    <div class="project-meta">
                      <span class="project-status" [class.active]="project.isActive" [class.inactive]="!project.isActive">
                        {{ project.isActive ? 'Active' : 'Inactive' }}
                      </span>
                      <span class="project-members">{{ project.members.length }} members</span>
                    </div>
                  </div>
                </div>

                <div class="project-content">
                  <div class="project-description">
                    <p><strong>Objectives:</strong> {{ project.objectives }}</p>
                    <p><strong>Technologies:</strong> {{ project.technologies }}</p>
                    <p><strong>Scope:</strong> {{ project.scope }}</p>
                  </div>

                  <div class="project-details">
                    <div class="detail-item">
                      <ion-icon name="person-outline"></ion-icon>
                      <span>Created by {{ project.createdByUsername }}</span>
                    </div>
                    <div class="detail-item">
                      <ion-icon name="calendar-outline"></ion-icon>
                      <span>{{ project.createdDate | date:'MMM d, y' }}</span>
                    </div>
                    <div class="detail-item">
                      <ion-icon name="time-outline"></ion-icon>
                      <span>Due: {{ project.estimatedTimeline | date:'MMM d, y' }}</span>
                    </div>
                  </div>
                </div>

                <div class="project-actions">
                  <button 
                    class="btn btn-primary"
                    [disabled]="!canRequestAccess(project) || processingRequest === project.projectId"
                    (click)="requestProjectAccess(project)">
                    <ion-spinner *ngIf="processingRequest === project.projectId" name="lines-small"></ion-spinner>
                    <ion-icon *ngIf="processingRequest !== project.projectId" name="hand-right-outline"></ion-icon>
                    <span *ngIf="processingRequest !== project.projectId">
                      {{ getRequestButtonText(project) }}
                    </span>
                    <span *ngIf="processingRequest === project.projectId">Requesting...</span>
                  </button>
                  <button class="btn btn-outline" (click)="viewProjectDetails(project)">
                    <ion-icon name="eye-outline"></ion-icon>
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State for Developer -->
          <div *ngIf="availableProjects.length === 0" class="empty-state">
            <ion-icon name="folder-outline"></ion-icon>
            <h3>No Projects Available</h3>
            <p>There are no projects available for you to request access to at the moment.</p>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .header-modern {
      --background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      --color: white;
    }

    .page-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 1.3rem;
    }

    .modern-content {
      --background: #f8fafc;
    }

    .content-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .stats-header {
      display: flex;
      gap: 24px;
      margin-bottom: 32px;
    }

    .stat-item {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
      border: 1px solid #e2e8f0;
      min-width: 140px;
      text-align: center;
    }

    .stat-number {
      font-size: 2.5rem;
      font-weight: 700;
      color: #3b82f6;
      line-height: 1;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #64748b;
      margin-top: 8px;
      font-weight: 500;
    }

    .loading-state, .error-state, .empty-state {
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
      border: 1px solid #e2e8f0;
    }

    .loading-state ion-spinner {
      width: 32px;
      height: 32px;
      margin-bottom: 16px;
    }

    .error-state ion-icon, .empty-state ion-icon {
      font-size: 48px;
      color: #ef4444;
      margin-bottom: 16px;
    }

    .empty-state ion-icon {
      color: #10b981;
    }

    .error-state h3, .empty-state h3 {
      margin: 0 0 8px 0;
      color: #1e293b;
      font-weight: 600;
    }

    .error-state p, .empty-state p {
      margin: 0;
      color: #64748b;
    }

    .table-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }

    .requests-table {
      width: 100%;
      border-collapse: collapse;
    }

    .requests-table thead {
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }

    .requests-table th {
      padding: 16px 20px;
      text-align: left;
      font-weight: 600;
      font-size: 0.875rem;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .requests-table td {
      padding: 20px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }

    .request-row:hover {
      background: #f8fafc;
    }

    .request-row:last-child td {
      border-bottom: none;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 18px;
      position: relative;
      overflow: hidden;
      border: 2px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .user-avatar:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .profile-picture {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
      transition: transform 0.2s ease;
    }

    .user-avatar:hover .profile-picture {
      transform: scale(1.1);
    }

    .user-initials {
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      line-height: 1;
      user-select: none;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .username {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.95rem;
    }

    .project-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #4f46e5;
      font-weight: 500;
    }

    .email-cell {
      color: #64748b;
      font-size: 0.9rem;
    }

    .date-cell {
      color: #64748b;
      font-size: 0.9rem;
      white-space: nowrap;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
    }

    .btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 8px;
      border: none;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 80px;
      justify-content: center;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-success {
      background: #10b981;
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background: #059669;
      transform: translateY(-1px);
    }

    .btn-danger {
      background: #ef4444;
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background: #dc2626;
      transform: translateY(-1px);
    }

    .btn ion-spinner {
      width: 16px;
      height: 16px;
    }

    @media (max-width: 1024px) {
      .content-container {
        padding: 16px;
      }
      
      .stats-header {
        flex-wrap: wrap;
        gap: 16px;
      }
      
      .stat-item {
        flex: 1;
        min-width: 120px;
      }
    }

         /* Project Cards for Developer View */
     .projects-grid {
       background: white;
       border-radius: 12px;
       box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
       border: 1px solid #e2e8f0;
       overflow: hidden;
     }

     .grid-header {
       padding: 24px;
       background: #f8fafc;
       border-bottom: 1px solid #e2e8f0;
       text-align: center;
     }

     .grid-header h2 {
       margin: 0 0 8px 0;
       color: #1e293b;
       font-weight: 600;
     }

     .grid-header p {
       margin: 0;
       color: #64748b;
     }

     .project-cards {
       display: grid;
       grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
       gap: 24px;
       padding: 24px;
     }

     .project-card {
       background: white;
       border: 1px solid #e2e8f0;
       border-radius: 12px;
       padding: 20px;
       transition: all 0.2s ease;
       box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
     }

     .project-card:hover {
       transform: translateY(-2px);
       box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
       border-color: #3b82f6;
     }

     .project-header {
       display: flex;
       align-items: flex-start;
       gap: 12px;
       margin-bottom: 16px;
     }

     .project-icon {
       width: 48px;
       height: 48px;
       background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
       border-radius: 12px;
       display: flex;
       align-items: center;
       justify-content: center;
       color: white;
       font-size: 24px;
       flex-shrink: 0;
     }

     .project-title {
       flex: 1;
     }

     .project-title h3 {
       margin: 0 0 8px 0;
       color: #1e293b;
       font-weight: 600;
       font-size: 1.1rem;
     }

     .project-meta {
       display: flex;
       gap: 12px;
       align-items: center;
     }

     .project-status {
       padding: 4px 8px;
       border-radius: 12px;
       font-size: 0.75rem;
       font-weight: 500;
       text-transform: uppercase;
       letter-spacing: 0.05em;
     }

     .project-status.active {
       background: #dcfce7;
       color: #166534;
     }

     .project-status.inactive {
       background: #fef2f2;
       color: #991b1b;
     }

     .project-members {
       font-size: 0.875rem;
       color: #64748b;
     }

     .project-content {
       margin-bottom: 20px;
     }

     .project-description {
       margin-bottom: 16px;
     }

     .project-description p {
       margin: 8px 0;
       font-size: 0.875rem;
       line-height: 1.5;
       color: #475569;
     }

     .project-details {
       display: flex;
       flex-direction: column;
       gap: 8px;
     }

     .detail-item {
       display: flex;
       align-items: center;
       gap: 8px;
       font-size: 0.875rem;
       color: #64748b;
     }

     .detail-item ion-icon {
       font-size: 16px;
       color: #94a3b8;
     }

     .project-actions {
       display: flex;
       gap: 12px;
       padding-top: 16px;
       border-top: 1px solid #f1f5f9;
     }

     .project-actions .btn {
       flex: 1;
     }

     .btn-outline {
       background: transparent;
       border: 1px solid #e2e8f0;
       color: #64748b;
     }

     .btn-outline:hover:not(:disabled) {
       background: #f8fafc;
       border-color: #94a3b8;
       transform: translateY(-1px);
     }

     .btn-primary {
       background: #3b82f6;
       color: white;
     }

     .btn-primary:hover:not(:disabled) {
       background: #2563eb;
       transform: translateY(-1px);
     }

     .btn-primary:disabled {
       background: #94a3b8;
       cursor: not-allowed;
     }

     .table-header {
       padding: 24px;
       background: #f8fafc;
       border-bottom: 1px solid #e2e8f0;
       text-align: center;
     }

     .table-header h2 {
       margin: 0 0 8px 0;
       color: #1e293b;
       font-weight: 600;
     }

     .table-header p {
       margin: 0;
       color: #64748b;
     }

     @media (max-width: 768px) {
       .table-container {
         overflow-x: auto;
       }
       
       .requests-table {
         min-width: 700px;
       }
       
       .action-buttons {
         flex-direction: column;
         gap: 4px;
       }
       
       .btn {
         padding: 6px 12px;
         font-size: 0.8rem;
       }

       .project-cards {
         grid-template-columns: 1fr;
         padding: 16px;
         gap: 16px;
       }

       .project-actions {
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
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    IonText
  ]
})
export class ProjectAccessRequestsComponent implements OnInit {
  loading = true;
  error: string | null = null;
  pendingRequests: PendingAccessRequestWithProject[] = [];
  availableProjects: Project[] = [];
  processingRequest: number | null = null;
  isLeadDeveloper = false;
  currentUser: any;

  constructor(
    private projectService: ProjectService,
    private authService: AuthService,
    private userService: UserService,
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
      peopleOutline,
      folderOutline,
      checkmarkCircleOutline,
      addOutline,
      calendarOutline,
      codeOutline,
      eyeOutline,
      handRightOutline
    });
  }

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading = true;
    this.error = null;
    
    try {
      this.currentUser = this.authService.getCurrentUser();
      console.log('🔍 DEBUG: Current user data:', this.currentUser);
       
      if (!this.currentUser) {
        this.error = 'No user logged in';
        this.loading = false;
        return;
      }

      const userId = this.currentUser.userId || this.currentUser.UserId || 0;
      const userRole = this.currentUser.role || this.currentUser.Role || '';
      
      console.log('🔍 DEBUG: User ID:', userId);
      console.log('🔍 DEBUG: User Role:', userRole);
      
      this.isLeadDeveloper = userRole === 'LeadDeveloper' || userRole === 'Lead Developer';
      console.log('🔍 DEBUG: Is Lead Developer:', this.isLeadDeveloper);

      if (this.isLeadDeveloper) {
        console.log('🔍 DEBUG: Loading requests for Lead Developer...');
        // Load pending access requests for Lead Developers
        this.pendingRequests = await firstValueFrom(
          this.projectService.getAllPendingRequestsForUser(userId)
        );
        console.log('🔍 DEBUG: Pending requests loaded:', this.pendingRequests);
      } else {
        console.log('🔍 DEBUG: Loading available projects for Developer...');
         // Load available projects for Developers to request access
         this.availableProjects = await firstValueFrom(
           this.projectService.getAvailableProjects()
         );
         
         console.log('🔍 DEBUG: Available projects before filtering:', this.availableProjects);
         
         // Filter out projects the user already has access to or has pending requests for
         this.availableProjects = this.availableProjects.filter(project => {
           const userMember = project.members.find(member => member.userId === userId);
           return !userMember; // Show only projects user is not a member of
         });
         
         console.log('🔍 DEBUG: Available projects after filtering:', this.availableProjects);
       }
      
      this.loading = false;
    } catch (error: any) {
      console.error('❌ ERROR loading data:', error);
      this.error = error.message || 'Failed to load data';
      this.loading = false;
    }
  }

  async approveRequest(request: PendingAccessRequestWithProject) {
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
          handler: () => this.processApproval(request, currentUser.userId || currentUser.UserId || 0)
        }
      ]
    });

    await alert.present();
  }

  private async processApproval(request: PendingAccessRequestWithProject, leadDeveloperId: number) {
    this.processingRequest = request.projectMemberId;

    try {
      // Use the new review access request API
      const reviewDto = {
        RequestId: request.projectMemberId, // This is actually the requestId from the new API
        ReviewedBy: leadDeveloperId,
        IsApproved: true,
        AssignedRole: 'Developer',
        ReviewerComments: 'Approved via access request management'
      };
      
      console.log('🔍 COMPONENT DEBUG: Approval DTO:', reviewDto);
      console.log('🔍 COMPONENT DEBUG: Request data:', request);

      await firstValueFrom(
        this.projectService.reviewAccessRequest(reviewDto)
      );

      this.showToast('Access request approved', 'success');
      await this.loadData(); // Refresh the list
    } catch (error: any) {
      console.error('Error approving request:', error);
      this.showToast(error.message || 'Failed to approve request', 'danger');
    } finally {
      this.processingRequest = null;
    }
  }

  async denyRequest(request: PendingAccessRequestWithProject) {
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
          handler: () => this.processDenial(request, currentUser.userId || currentUser.UserId || 0)
        }
      ]
    });

    await alert.present();
  }

  private async processDenial(request: PendingAccessRequestWithProject, leadDeveloperId: number) {
    this.processingRequest = request.projectMemberId;

    try {
      // Use the new review access request API
      const reviewDto = {
        RequestId: request.projectMemberId, // This is actually the requestId from the new API
        ReviewedBy: leadDeveloperId,
        IsApproved: false,
        RejectionReason: 'Denied via access request management',
        ReviewerComments: 'Denied via access request management'
      };
      
      console.log('🔍 COMPONENT DEBUG: Denial DTO:', reviewDto);
      console.log('🔍 COMPONENT DEBUG: Request data:', request);

      await firstValueFrom(
        this.projectService.reviewAccessRequest(reviewDto)
      );

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

  // Methods for Developer view
  canRequestAccess(project: Project): boolean {
    if (!this.currentUser || !project.isActive) {
      return false;
    }
    
    const userId = this.currentUser.userId || this.currentUser.UserId || 0;
    
    // Check if user is already a member
    const isMember = project.members.some(member => member.userId === userId);
    
    return !isMember;
  }

  getRequestButtonText(project: Project): string {
    if (!project.isActive) {
      return 'Inactive Project';
    }
    
    if (!this.currentUser) {
      return 'Login Required';
    }
    
    const userId = this.currentUser.userId || this.currentUser.UserId || 0;
    const userMember = project.members.find(member => member.userId === userId);
    
    if (userMember) {
      if (userMember.hasAccess) {
        return 'Already Member';
      } else {
        return 'Request Pending';
      }
    }
    
    return 'Request Access';
  }

  async requestProjectAccess(project: Project) {
    if (!this.canRequestAccess(project)) {
      return;
    }

    const alert = await this.alertController.create({
      header: 'Request Access',
      message: `Are you sure you want to request access to "${project.name}"?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Request Access',
          role: 'confirm',
          handler: () => this.processAccessRequest(project)
        }
      ]
    });

    await alert.present();
  }

  private async processAccessRequest(project: Project) {
    this.processingRequest = project.projectId;

    try {
      await firstValueFrom(this.projectService.requestAccess(project.projectId));
      this.showToast('Access request submitted successfully', 'success');
      await this.loadData(); // Refresh the list
    } catch (error: any) {
      console.error('Error requesting access:', error);
      this.showToast(error.message || 'Failed to request access', 'danger');
    } finally {
      this.processingRequest = null;
    }
  }

  async viewProjectDetails(project: Project) {
    const alert = await this.alertController.create({
      header: project.name,
      message: `
        <div style="text-align: left;">
          <p><strong>Objectives:</strong><br>${project.objectives}</p>
          <p><strong>Scope:</strong><br>${project.scope}</p>
          <p><strong>Technologies:</strong><br>${project.technologies}</p>
          <p><strong>Created by:</strong> ${project.createdByUsername}</p>
          <p><strong>Timeline:</strong> ${new Date(project.estimatedTimeline).toLocaleDateString()}</p>
          <p><strong>Members:</strong> ${project.members.length}</p>
          <p><strong>Status:</strong> ${project.isActive ? 'Active' : 'Inactive'}</p>
        </div>
      `,
      buttons: [
        {
          text: 'Close',
          role: 'cancel'
        },
        ...(this.canRequestAccess(project) ? [{
          text: 'Request Access',
          handler: () => this.requestProjectAccess(project)
        }] : [])
      ]
    });

    await alert.present();
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

  // Get user initials from username
  getUserInitials(username: string): string {
    if (!username) return '?';
    return username
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  // Generate consistent avatar color based on username
  getUserAvatarColor(username: string): string {
    if (!username) return '#6b7280';
    
    // Generate a hash from the username to get consistent colors
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate a color from the hash
    const hue = Math.abs(hash) % 360;
    const saturation = 70 + (Math.abs(hash) % 20); // 70-90%
    const lightness = 45 + (Math.abs(hash) % 15); // 45-60%
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  // Get user profile picture URL using UserService
  getUserProfilePictureUrl(request: PendingAccessRequestWithProject): string {
    // Now that the backend includes UserId, we can use the proper profile picture endpoint
    const profileUrl = this.userService.processProfilePictureUrl(
      null, // No profile picture URL from backend
      request.userId
    );
    
    console.log('🔍 Profile Picture Debug:', {
      userId: request.userId,
      username: request.username,
      generatedUrl: profileUrl,
      note: 'Using backend UserId field for profile picture support'
    });
    
    return profileUrl;
  }

  // Handle profile picture loading errors
  onProfilePictureError(event: any, request: any) {
    // When profile picture fails to load, show initials instead
    const img = event.target as HTMLImageElement;
    const avatarDiv = img.parentElement;
    
    if (avatarDiv) {
      // Hide the broken image
      img.style.display = 'none';
      
      // Check if initials already exist
      let initialsSpan = avatarDiv.querySelector('.user-initials');
      if (!initialsSpan) {
        // Create and show initials
        initialsSpan = document.createElement('span');
        initialsSpan.className = 'user-initials';
        initialsSpan.textContent = this.getUserInitials(request.username);
        avatarDiv.appendChild(initialsSpan);
      }
    }
  }
}