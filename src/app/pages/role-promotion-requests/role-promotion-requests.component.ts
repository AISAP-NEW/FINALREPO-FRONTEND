import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonLabel,
  IonItem,
  IonInput,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  trendingUpOutline,
  checkmarkOutline,
  closeOutline,
  alertCircleOutline,
  timeOutline,
  checkmarkCircleOutline,
  personOutline,
  sendOutline,
  documentTextOutline,
  starOutline,
  arrowForwardOutline,
  calendarOutline,
  chatbubbleEllipsesOutline
} from 'ionicons/icons';
import { RolePromotionService, RolePromotionRequestSummaryDTO, UserPromotionRequestDTO } from '../../services/role-promotion.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-role-promotion-requests',
  template: `
    <ion-header class="header-modern">
      <ion-toolbar>
        <ion-title class="page-title">
          <ion-icon name="trending-up-outline"></ion-icon>
          {{ isAdmin ? 'Role Promotion Requests' : 'Request Role Promotion' }}
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
          <div class="stat-item" *ngIf="isAdmin">
            <div class="stat-number">{{ pendingRequests.length }}</div>
            <div class="stat-label">Pending Promotions</div>
          </div>
          <div class="stat-item" *ngIf="!isAdmin">
            <div class="stat-number">{{ userRequests.length }}</div>
            <div class="stat-label">My Requests</div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="loading-state">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p>{{ isAdmin ? 'Loading role promotion requests...' : 'Loading your requests...' }}</p>
        </div>

        <!-- Error State -->
        <div *ngIf="error" class="error-state">
          <ion-icon name="alert-circle-outline"></ion-icon>
          <h3>Error Loading {{ isAdmin ? 'Requests' : 'Your Requests' }}</h3>
          <p>{{ error }}</p>
          <button class="btn btn-primary" (click)="loadData()">
            <ion-icon name="checkmark-outline"></ion-icon>
            Retry
          </button>
        </div>

        <!-- Admin View - Manage Role Promotion Requests -->
        <div *ngIf="!loading && !error && isAdmin" class="requests-container">
          <!-- Request Table -->
          <div class="table-container" *ngIf="pendingRequests.length > 0">
            <div class="table-header">
              <h2>Pending Role Promotion Requests</h2>
              <p>Review and manage role promotion requests from team members</p>
            </div>
            <table class="requests-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Current Role</th>
                  <th>Requested Role</th>
                  <th>Requested</th>
                  <th>Justification</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let request of pendingRequests" class="request-row">
                  <td class="user-cell">
                    <div class="user-info">
                                             <div class="user-avatar" [style.background]="getUserAvatarColor(request.Username)">
                         <!-- Show profile picture if available, otherwise show initials -->
                         <img 
                           [src]="getUserProfilePictureUrl(request)" 
                           [alt]="request.Username + ' profile picture'"
                           class="profile-picture"
                           (error)="onProfilePictureError($event, request)"
                         />
                       </div>
                       <div class="user-details">
                         <div class="username">{{ request.Username || 'Unknown User' }}</div>
                       </div>
                    </div>
                  </td>
                                     <td class="role-cell">
                     <span class="role-badge current">{{ request.CurrentRole || 'Unknown' }}</span>
                   </td>
                   <td class="role-cell">
                     <span class="role-badge requested">{{ request.RequestedRole || 'Unknown' }}</span>
                   </td>
                   <td class="date-cell">{{ request.RequestDate ? (request.RequestDate | date:'MMM d, y') : 'Unknown' }}</td>
                   <td class="justification-cell">
                     <div class="justification" [title]="request.Justification">
                       {{ request.Justification || 'No justification provided' }}
                     </div>
                   </td>
                   <td class="actions-cell">
                     <div class="action-buttons">
                       <button 
                         class="btn btn-success"
                         [disabled]="processingRequest === request.RequestId"
                         (click)="approveRequest(request)">
                         <ion-spinner *ngIf="processingRequest === request.RequestId" name="lines-small"></ion-spinner>
                         <ion-icon *ngIf="processingRequest !== request.RequestId" name="checkmark-outline"></ion-icon>
                         <span *ngIf="processingRequest !== request.RequestId">Approve</span>
                       </button>
                       <button 
                         class="btn btn-danger"
                         [disabled]="processingRequest === request.RequestId"
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

          <!-- Empty State for Admin -->
          <div *ngIf="pendingRequests.length === 0" class="empty-state">
            <ion-icon name="checkmark-circle-outline"></ion-icon>
            <h3>All Caught Up!</h3>
            <p>No pending role promotion requests at the moment.</p>
          </div>
        </div>

        <!-- Developer View - Request Role Promotion -->
        <div *ngIf="!loading && !error && !isAdmin" class="request-form-container">
          <!-- Role Promotion Request Form -->
          <div class="form-container">
            <div class="form-header">
              <h2>Request Role Promotion</h2>
              <p>Submit a request to be promoted to a higher role</p>
            </div>

            <!-- Current Role Display -->
            <div class="current-role-display">
              <div class="role-info">
                <ion-icon name="star-outline"></ion-icon>
                <div class="role-details">
                  <h3>Current Role</h3>
                  <span class="role-badge current">{{ currentUserRole }}</span>
                </div>
              </div>
            </div>

            <!-- Promotion Request Form -->
            <form (ngSubmit)="submitPromotionRequest()" #promotionForm="ngForm">
              <div class="form-group">
                <ion-label for="requestedRole">Requested Role</ion-label>
                <ion-select 
                  id="requestedRole"
                  name="requestedRole"
                  [(ngModel)]="promotionRequest.requestedRole"
                  required
                  interface="popover"
                  placeholder="Select the role you want to be promoted to">
                  <ion-select-option value="LeadDeveloper">Lead Developer</ion-select-option>
                </ion-select>
              </div>

              <div class="form-group">
                <ion-label for="justification">Justification</ion-label>
                <ion-textarea
                  id="justification"
                  name="justification"
                  [(ngModel)]="promotionRequest.justification"
                  placeholder="Explain why you deserve this promotion..."
                  rows="4"
                  maxlength="1000"
                  required>
                </ion-textarea>
                <div class="char-count">{{ promotionRequest.justification?.length || 0 }}/1000</div>
              </div>

              <div class="form-actions">
                <button 
                  type="submit" 
                  class="btn btn-primary"
                  [disabled]="!promotionForm.valid || submitting">
                  <ion-spinner *ngIf="submitting" name="lines-small"></ion-spinner>
                  <ion-icon *ngIf="!submitting" name="send-outline"></ion-icon>
                  <span *ngIf="!submitting">Submit Request</span>
                  <span *ngIf="submitting">Submitting...</span>
                </button>
              </div>
            </form>
          </div>

          <!-- User's Previous Requests -->
          <div class="user-requests-container" *ngIf="userRequests.length > 0">
            <div class="requests-header">
              <h3>Your Previous Requests</h3>
              <p>Track the status of your role promotion requests</p>
            </div>
            
            <div class="user-requests-list">
              <div *ngFor="let request of userRequests" class="request-item">
                                 <div class="request-header">
                   <div class="request-role">
                     <span class="role-badge current">{{ request.CurrentRole }}</span>
                     <ion-icon name="arrow-forward-outline"></ion-icon>
                     <span class="role-badge requested">{{ request.RequestedRole }}</span>
                   </div>
                   <div class="request-status" [class]="'status-' + request.Status.toString().toLowerCase()">
                     {{ getStatusText(request.Status) }}
                   </div>
                 </div>
                 
                 <div class="request-details">
                   <div class="request-date">
                     <ion-icon name="calendar-outline"></ion-icon>
                     <span>Requested: {{ request.RequestDate | date:'MMM d, y' }}</span>
                   </div>
                   
                   <div class="request-justification" *ngIf="request.Justification">
                     <ion-icon name="document-text-outline"></ion-icon>
                     <span>{{ request.Justification }}</span>
                   </div>
                   
                   <div class="request-review" *ngIf="request.ReviewedDate">
                     <ion-icon name="time-outline"></ion-icon>
                     <span>Reviewed: {{ request.ReviewedDate | date:'MMM d, y' }}</span>
                   </div>
                   
                   <div class="admin-comments" *ngIf="request.AdminComments">
                     <ion-icon name="chatbubble-ellipses-outline"></ion-icon>
                     <span><strong>Admin Comments:</strong> {{ request.AdminComments }}</span>
                   </div>
                   
                   <div class="rejection-reason" *ngIf="request.RejectionReason">
                     <ion-icon name="alert-circle-outline"></ion-icon>
                     <span><strong>Reason:</strong> {{ request.RejectionReason }}</span>
                   </div>
                 </div>
                 
                 <div class="request-actions" *ngIf="request.Status === 0">
                   <button 
                     class="btn btn-danger btn-small"
                     (click)="cancelRequest(request.RequestId)">
                     Cancel Request
                   </button>
                 </div>
              </div>
            </div>
          </div>

          <!-- Empty State for User Requests -->
          <div *ngIf="userRequests.length === 0" class="empty-state">
            <ion-icon name="document-text-outline"></ion-icon>
            <h3>No Previous Requests</h3>
            <p>You haven't submitted any role promotion requests yet.</p>
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
      max-width: 1400px;
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

    /* Admin View Styles */
    .table-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
      border: 1px solid #e2e8f0;
      overflow: hidden;
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

    .role-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .role-badge.current {
      background: #e0f2fe;
      color: #0369a1;
    }

    .role-badge.requested {
      background: #f0fdf4;
      color: #166534;
    }

    .justification-cell {
      max-width: 200px;
    }

    .justification {
      color: #64748b;
      font-size: 0.9rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 200px;
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

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
      transform: translateY(-1px);
    }

    .btn-small {
      padding: 6px 12px;
      font-size: 0.8rem;
      min-width: 60px;
    }

    .btn ion-spinner {
      width: 16px;
      height: 16px;
    }

    /* Developer View Styles */
    .request-form-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .form-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }

    .form-header {
      padding: 24px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      text-align: center;
    }

    .form-header h2 {
      margin: 0 0 8px 0;
      color: #1e293b;
      font-weight: 600;
    }

    .form-header p {
      margin: 0;
      color: #64748b;
    }

    .current-role-display {
      padding: 24px;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border-bottom: 1px solid #e2e8f0;
    }

    .role-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .role-info ion-icon {
      font-size: 32px;
      color: #0369a1;
    }

    .role-details h3 {
      margin: 0 0 8px 0;
      color: #1e293b;
      font-weight: 600;
      font-size: 1.1rem;
    }

    .form-group {
      padding: 24px;
      border-bottom: 1px solid #f1f5f9;
    }

    .form-group:last-child {
      border-bottom: none;
    }

    .form-group ion-label {
      display: block;
      margin-bottom: 8px;
      color: #374151;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .form-group ion-select,
    .form-group ion-textarea {
      width: 100%;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      padding: 12px;
      font-size: 0.9rem;
      background: white;
    }

    .form-group ion-textarea {
      resize: vertical;
      min-height: 100px;
    }

    .char-count {
      text-align: right;
      font-size: 0.8rem;
      color: #6b7280;
      margin-top: 4px;
    }

    .form-actions {
      padding: 24px;
      text-align: center;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
    }

    .form-actions .btn {
      min-width: 160px;
      padding: 12px 24px;
      font-size: 1rem;
    }

    /* User Requests Styles */
    .user-requests-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }

    .requests-header {
      padding: 24px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      text-align: center;
    }

    .requests-header h3 {
      margin: 0 0 8px 0;
      color: #1e293b;
      font-weight: 600;
    }

    .requests-header p {
      margin: 0;
      color: #64748b;
    }

    .user-requests-list {
      padding: 24px;
    }

    .request-item {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 16px;
      background: #fafafa;
    }

    .request-item:last-child {
      margin-bottom: 0;
    }

    .request-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .request-role {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .request-role ion-icon {
      color: #6b7280;
    }

    .request-status {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
    }

         .status-0 {
       background: #fef3c7;
       color: #92400e;
     }
 
     .status-1 {
       background: #dcfce7;
       color: #166534;
     }
 
     .status-2 {
       background: #fee2e2;
       color: #991b1b;
     }
 
     .status-3 {
       background: #f3f4f6;
       color: #374151;
     }

    .request-details {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }

    .request-details > div {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 0.9rem;
      color: #4b5563;
    }

    .request-details ion-icon {
      margin-top: 2px;
      color: #6b7280;
      flex-shrink: 0;
    }

    .request-actions {
      text-align: right;
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

    @media (max-width: 768px) {
      .table-container {
        overflow-x: auto;
      }
      
      .requests-table {
        min-width: 900px;
      }
      
      .action-buttons {
        flex-direction: column;
        gap: 4px;
      }
      
      .btn {
        padding: 6px 12px;
        font-size: 0.8rem;
      }

      .justification {
        max-width: 150px;
      }

      .request-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .form-actions .btn {
        min-width: 100%;
      }
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonLabel,
    IonItem,
    IonInput
  ]
})
export class RolePromotionRequestsComponent implements OnInit {
  loading = true;
  error: string | null = null;
     pendingRequests: RolePromotionRequestSummaryDTO[] = [];
   userRequests: UserPromotionRequestDTO[] = [];
  processingRequest: number | null = null;
  submitting = false;
  isAdmin = false;
  currentUserRole = '';
  currentUser: any;

  promotionRequest = {
    requestedRole: '',
    justification: ''
  };

  constructor(
    private rolePromotionService: RolePromotionService,
    private authService: AuthService,
    private userService: UserService,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    addIcons({
      trendingUpOutline,
      checkmarkOutline,
      closeOutline,
      alertCircleOutline,
      timeOutline,
      checkmarkCircleOutline,
      personOutline,
      sendOutline,
      documentTextOutline,
      starOutline,
      arrowForwardOutline,
      calendarOutline,
      chatbubbleEllipsesOutline
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
      if (!this.currentUser) {
        this.error = 'No user logged in';
        this.loading = false;
        return;
      }

      const userRole = this.currentUser.role || this.currentUser.Role || '';
      this.currentUserRole = userRole;
      this.isAdmin = userRole === 'Admin';

      if (this.isAdmin) {
        // Load pending requests for admins
        console.log('Loading role promotion requests for admin...');
        const rawRequests = await firstValueFrom(
          this.rolePromotionService.getPendingRequests()
        );
        console.log('Raw role promotion requests from backend:', rawRequests);
        
        // Check if we received data
        if (!rawRequests || !Array.isArray(rawRequests)) {
          console.error('Backend returned invalid data:', rawRequests);
          this.error = 'Invalid data received from backend';
          this.loading = false;
          return;
        }
        
                 // Transform the data to ensure proper types and handle missing fields
         this.pendingRequests = rawRequests.map(request => {
           console.log('Processing request:', request);
           return {
             ...request,
             RequestId: request.RequestId || 0,
             UserId: request.UserId || 0,
             Username: request.Username || 'Unknown User',
             CurrentRole: request.CurrentRole || 'Unknown',
             RequestedRole: request.RequestedRole || 'Unknown',
             Status: request.Status || 0,
             RequestDate: request.RequestDate ? new Date(request.RequestDate) : new Date(),
             Justification: request.Justification || 'No justification provided'
           };
         });
        
        console.log('Transformed role promotion requests:', this.pendingRequests);
        
                 // Debug: Check each request's data structure
         this.pendingRequests.forEach((request, index) => {
           console.log(`Request ${index}:`, {
             RequestId: request.RequestId,
             UserId: request.UserId,
             Username: request.Username,
             CurrentRole: request.CurrentRole,
             RequestedRole: request.RequestedRole,
             Status: request.Status,
             RequestDate: request.RequestDate,
             Justification: request.Justification
           });
         });
      } else {
                 // Load user's own requests for developers
         console.log('Loading user requests for developer...');
         const userId = this.currentUser.userId || this.currentUser.UserId || 0;
         const rawUserRequests = await firstValueFrom(
           this.rolePromotionService.getUserRequests(userId)
         );
         console.log('Raw user requests from backend:', rawUserRequests);
         
         // Transform user requests to match PascalCase DTOs
         if (rawUserRequests && Array.isArray(rawUserRequests)) {
           this.userRequests = rawUserRequests.map(request => ({
             ...request,
             RequestId: request.RequestId || 0,
             UserId: request.UserId || 0,
             CurrentRole: request.CurrentRole || 'Unknown',
             RequestedRole: request.RequestedRole || 'Unknown',
             Status: request.Status || 0,
             RequestDate: request.RequestDate ? new Date(request.RequestDate) : new Date(),
             Justification: request.Justification || 'No justification provided',
             ReviewedDate: request.ReviewedDate ? new Date(request.ReviewedDate) : undefined,
             ReviewedByUsername: request.ReviewedByUsername,
             AdminComments: request.AdminComments,
             RejectionReason: request.RejectionReason
           }));
         } else {
           this.userRequests = [];
         }
         
         console.log('Transformed user requests:', this.userRequests);
      }
      
      this.loading = false;
    } catch (error: any) {
      console.error('Error loading data:', error);
      this.error = error.message || 'Failed to load data';
      this.loading = false;
    }
  }

  async submitPromotionRequest() {
    if (!this.promotionRequest.requestedRole || !this.promotionRequest.justification) {
      this.showToast('Please fill in all required fields', 'danger');
      return;
    }

    this.submitting = true;

    try {
      const userId = this.currentUser.userId || this.currentUser.UserId || 0;
      
      await firstValueFrom(this.rolePromotionService.requestRolePromotion({
        userId: userId,
        requestedRole: this.promotionRequest.requestedRole,
        justification: this.promotionRequest.justification
      }));

      this.showToast('Role promotion request submitted successfully', 'success');
      
      // Reset form
      this.promotionRequest = {
        requestedRole: '',
        justification: ''
      };
      
      // Refresh data
      await this.loadData();
    } catch (error: any) {
      console.error('Error submitting promotion request:', error);
      this.showToast(error.message || 'Failed to submit promotion request', 'danger');
    } finally {
      this.submitting = false;
    }
  }

  async approveRequest(request: RolePromotionRequestSummaryDTO) {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.showToast('No user logged in', 'danger');
      return;
    }

         const alert = await this.alertController.create({
       header: 'Confirm Role Promotion',
       message: `Are you sure you want to promote ${request.Username} from ${request.CurrentRole} to ${request.RequestedRole}?`,
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

     private async processApproval(request: RolePromotionRequestSummaryDTO, adminId: number) {
     this.processingRequest = request.RequestId;
 
     try {
       await firstValueFrom(this.rolePromotionService.reviewPromotionRequest({
         requestId: request.RequestId,
         reviewedBy: adminId,
         isApproved: true,
         adminComments: 'Promotion approved by admin.'
       }));
 
       this.showToast('Role promotion approved', 'success');
       await this.loadData(); // Refresh the list
     } catch (error: any) {
       console.error('Error approving role promotion:', error);
       this.showToast(error.message || 'Failed to approve role promotion', 'danger');
     } finally {
       this.processingRequest = null;
     }
   }

  async denyRequest(request: RolePromotionRequestSummaryDTO) {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.showToast('No user logged in', 'danger');
      return;
    }

         const alert = await this.alertController.create({
       header: 'Deny Role Promotion',
       message: `Are you sure you want to deny the promotion request for ${request.Username}?`,
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
           handler: (data) => this.processDenial(request, currentUser.userId || currentUser.UserId || 0, data.reason)
         }
       ]
     });

    await alert.present();
  }

     private async processDenial(request: RolePromotionRequestSummaryDTO, adminId: number, reason: string) {
     this.processingRequest = request.RequestId;
 
     try {
       await firstValueFrom(this.rolePromotionService.reviewPromotionRequest({
         requestId: request.RequestId,
         reviewedBy: adminId,
         isApproved: false,
         rejectionReason: reason || 'Request denied by admin.',
         adminComments: 'Promotion denied by admin.'
       }));
 
       this.showToast('Role promotion denied', 'success');
       await this.loadData(); // Refresh the list
     } catch (error: any) {
       console.error('Error denying role promotion:', error);
       this.showToast(error.message || 'Failed to deny role promotion', 'danger');
     } finally {
       this.processingRequest = null;
     }
   }

  async cancelRequest(requestId: number) {
    const alert = await this.alertController.create({
      header: 'Cancel Request',
      message: 'Are you sure you want to cancel this promotion request?',
      buttons: [
        {
          text: 'No',
          role: 'cancel'
        },
        {
          text: 'Yes, Cancel',
          role: 'confirm',
          cssClass: 'danger',
          handler: () => this.processCancellation(requestId)
        }
      ]
    });

    await alert.present();
  }

  private async processCancellation(requestId: number) {
    try {
      const userId = this.currentUser.userId || this.currentUser.UserId || 0;
      await firstValueFrom(this.rolePromotionService.cancelPromotionRequest(requestId, userId));
      
      this.showToast('Promotion request cancelled successfully', 'success');
      await this.loadData(); // Refresh the list
    } catch (error: any) {
      console.error('Error cancelling promotion request:', error);
      this.showToast(error.message || 'Failed to cancel promotion request', 'danger');
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
   getUserProfilePictureUrl(request: RolePromotionRequestSummaryDTO): string {
     // Use the UserService to get profile picture URL
     const profileUrl = this.userService.processProfilePictureUrl(
       null, // No profile picture URL from backend
       request.UserId
     );
     
     console.log('🔍 Profile Picture Debug:', {
       userId: request.UserId,
       username: request.Username,
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
         initialsSpan.textContent = this.getUserInitials(request.Username);
         avatarDiv.appendChild(initialsSpan);
       }
     }
   }

   // Convert numeric status to readable text
   getStatusText(status: number): string {
     switch (status) {
       case 0: return 'Pending';
       case 1: return 'Approved';
       case 2: return 'Denied';
       case 3: return 'Cancelled';
       default: return 'Unknown';
     }
   }
}