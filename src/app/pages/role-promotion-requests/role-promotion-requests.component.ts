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
  trendingUpOutline,
  checkmarkOutline,
  closeOutline,
  alertCircleOutline,
  timeOutline,
  checkmarkCircleOutline,
  personOutline
} from 'ionicons/icons';
import { RolePromotionService, RolePromotionRequestSummaryDTO } from '../../services/role-promotion.service';
import { AuthService } from '../../services/auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-role-promotion-requests',
  template: `
    <ion-header class="header-modern">
      <ion-toolbar>
        <ion-title class="page-title">
          <ion-icon name="trending-up-outline"></ion-icon>
          Role Promotion Requests
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
          <div class="stat-item">
            <div class="stat-number">{{ pendingRequests.length }}</div>
            <div class="stat-label">Pending Promotions</div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="loading-state">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p>Loading role promotion requests...</p>
        </div>

        <!-- Error State -->
        <div *ngIf="error" class="error-state">
          <ion-icon name="alert-circle-outline"></ion-icon>
          <h3>Error Loading Requests</h3>
          <p>{{ error }}</p>
        </div>

        <!-- Data State -->
        <div *ngIf="!loading && !error" class="requests-container">
          <!-- Request Table -->
          <div class="table-container" *ngIf="pendingRequests.length > 0">
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
                      <div class="user-avatar">
                        <ion-icon name="person-outline"></ion-icon>
                      </div>
                      <div class="user-details">
                        <div class="username">{{ request.username }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="role-cell">
                    <span class="role-badge current">{{ request.currentRole }}</span>
                  </td>
                  <td class="role-cell">
                    <span class="role-badge requested">{{ request.requestedRole }}</span>
                  </td>
                  <td class="date-cell">{{ request.requestDate | date:'MMM d, y' }}</td>
                  <td class="justification-cell">
                    <div class="justification" [title]="request.justification">
                      {{ request.justification || 'No justification provided' }}
                    </div>
                  </td>
                  <td class="actions-cell">
                    <div class="action-buttons">
                      <button 
                        class="btn btn-success"
                        [disabled]="processingRequest === request.requestId"
                        (click)="approveRequest(request)">
                        <ion-spinner *ngIf="processingRequest === request.requestId" name="lines-small"></ion-spinner>
                        <ion-icon *ngIf="processingRequest !== request.requestId" name="checkmark-outline"></ion-icon>
                        <span *ngIf="processingRequest !== request.requestId">Approve</span>
                      </button>
                      <button 
                        class="btn btn-danger"
                        [disabled]="processingRequest === request.requestId"
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

          <!-- Empty State -->
          <div *ngIf="pendingRequests.length === 0" class="empty-state">
            <ion-icon name="checkmark-circle-outline"></ion-icon>
            <h3>All Caught Up!</h3>
            <p>No pending role promotion requests at the moment.</p>
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 18px;
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
export class RolePromotionRequestsComponent implements OnInit {
  loading = true;
  error: string | null = null;
  pendingRequests: RolePromotionRequestSummaryDTO[] = [];
  processingRequest: number | null = null;

  constructor(
    private rolePromotionService: RolePromotionService,
    private authService: AuthService,
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
      personOutline
    });
  }

  ngOnInit() {
    this.loadData();
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

      const userRole = currentUser.role || currentUser.Role || '';

      // Only Admins can see role promotion requests
      if (userRole !== 'Admin') {
        this.error = 'Only administrators can view role promotion requests';
        this.loading = false;
        return;
      }

      console.log('Loading role promotion requests...');
      this.pendingRequests = await firstValueFrom(
        this.rolePromotionService.getPendingRequests()
      );
      console.log('Loaded role promotion requests:', this.pendingRequests);
      
      this.loading = false;
    } catch (error: any) {
      console.error('Error loading role promotion requests:', error);
      this.error = error.message || 'Failed to load role promotion requests';
      this.loading = false;
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
      message: `Are you sure you want to promote ${request.username} from ${request.currentRole} to ${request.requestedRole}?`,
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
    this.processingRequest = request.requestId;

    try {
      await firstValueFrom(this.rolePromotionService.reviewPromotionRequest({
        requestId: request.requestId,
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
          handler: (data) => this.processDenial(request, currentUser.userId || currentUser.UserId || 0, data.reason)
        }
      ]
    });

    await alert.present();
  }

  private async processDenial(request: RolePromotionRequestSummaryDTO, adminId: number, reason: string) {
    this.processingRequest = request.requestId;

    try {
      await firstValueFrom(this.rolePromotionService.reviewPromotionRequest({
        requestId: request.requestId,
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