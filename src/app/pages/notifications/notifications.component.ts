import { Component, OnInit, OnDestroy } from '@angular/core';
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
  IonRefresher,
  IonRefresherContent,
  IonButtons,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  timeOutline,
  checkmarkOutline,
  checkmarkDoneOutline,
  alertCircleOutline,
  briefcaseOutline,
  personOutline,
  mailOutline,
  notificationsOutline
} from 'ionicons/icons';
import { NotificationService, Notification } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { interval, Subscription, firstValueFrom } from 'rxjs';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';

@Component({
  selector: 'app-notifications',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Notifications</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="markAllAsRead()" [disabled]="loading || !hasUnreadNotifications()">
            <ion-icon name="checkmark-done-outline" slot="start"></ion-icon>
            Mark All as Read
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Loading State -->
      <div *ngIf="loading" class="ion-text-center ion-padding">
        <ion-spinner></ion-spinner>
        <p>Loading notifications...</p>
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
        <ion-item *ngFor="let notification of notifications" class="notification-item" [class.unread]="!notification.isRead">
          <ion-icon 
            [name]="getNotificationIcon(notification.type)" 
            slot="start" 
            [color]="getNotificationColor(notification.type)">
          </ion-icon>
          <ion-label class="ion-text-wrap">
            <h2>{{ notification.message }}</h2>
            <p *ngIf="notification.projectName">
              <ion-icon name="briefcase-outline"></ion-icon>
              {{ notification.projectName }}
            </p>
            <p *ngIf="notification.senderName">
              <ion-icon name="person-outline"></ion-icon>
              {{ notification.senderName }}
            </p>
            <p>
              <ion-icon name="time-outline"></ion-icon>
              {{ notification.createdDate | date:'medium' }}
            </p>
          </ion-label>
          <div slot="end" class="notification-actions">
            <ion-label *ngIf="notification.isRead" class="read-label">
              <ion-icon name="checkmark-done-outline" color="success"></ion-icon>
              Read
            </ion-label>
            <ion-button 
              fill="clear" 
              color="primary" 
              [disabled]="notification.isRead"
              (click)="markAsRead(notification)">
              <ion-spinner *ngIf="processingNotificationId === notification.notificationId"></ion-spinner>
              <ion-icon 
                *ngIf="processingNotificationId !== notification.notificationId"
                [name]="notification.isRead ? 'checkmark-done-outline' : 'checkmark-outline'">
              </ion-icon>
            </ion-button>
          </div>
        </ion-item>

        <!-- Empty State -->
        <div *ngIf="notifications.length === 0" class="ion-text-center ion-padding">
          <ion-icon name="notifications-outline" class="empty-icon"></ion-icon>
          <h2>No Notifications</h2>
          <p>You don't have any notifications yet.</p>
        </div>
      </ion-list>
    </ion-content>
  `,
  styles: [`
    .notification-item {
      --padding-start: 16px;
      --padding-end: 16px;
      --padding-top: 12px;
      --padding-bottom: 12px;
      margin-bottom: 8px;
      border-radius: 8px;
      --background: var(--ion-color-light);
    }
    .notification-item.unread {
      --background: var(--ion-color-light-tint);
      border-left: 4px solid var(--ion-color-primary);
    }
    ion-item ion-label h2 {
      font-weight: 500;
      margin-bottom: 8px;
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
      font-size: 24px;
      margin-right: 16px;
    }
    .empty-icon {
      font-size: 48px;
      color: var(--ion-color-medium);
      margin-bottom: 16px;
    }
    ion-spinner {
      width: 20px;
      height: 20px;
    }
    .notification-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .read-label {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--ion-color-success);
      font-size: 0.8rem;
      font-weight: 500;
      padding: 4px 8px;
      border-radius: 12px;
      background: rgba(var(--ion-color-success-rgb), 0.1);
    }
    .read-label ion-icon {
      font-size: 14px;
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
    IonRefresher,
    IonRefresherContent,
    IonButtons
  ]
})
export class NotificationsComponent implements OnInit, OnDestroy {
  loading = true;
  error: string | null = null;
  notifications: Notification[] = [];
  processingNotificationId: number | null = null;
  private pollingSubscription: Subscription | null = null;
  private readonly POLLING_INTERVAL = 30000; // Poll every 30 seconds

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private toastController: ToastController,
    private router: Router,
    private mainLayout: MainLayoutComponent
  ) {
    addIcons({
      timeOutline,
      checkmarkOutline,
      checkmarkDoneOutline,
      alertCircleOutline,
      briefcaseOutline,
      personOutline,
      mailOutline,
      notificationsOutline
    });
  }

  ngOnInit() {
    this.loadNotifications();
    this.startPolling();
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  private startPolling() {
    // Stop any existing polling
    this.stopPolling();

    // Start new polling
    this.pollingSubscription = interval(this.POLLING_INTERVAL)
      .subscribe(() => this.loadNotifications());
  }

  private stopPolling() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  async loadNotifications() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      // Instead of showing error, redirect to login
      this.router.navigate(['/login']);
      return;
    }

    try {
      this.loading = true;
      this.error = null;
      const userId = currentUser.userId || currentUser.UserId || 0;
      this.notifications = await firstValueFrom(this.notificationService.getNotifications(userId)) || [];
      this.mainLayout.updateNotifications(); // Update the notification count in the layout
      this.loading = false;
    } catch (error: any) {
      console.error('Error loading notifications:', error);
      if (error.message?.includes('Unauthorized')) {
        // If unauthorized, redirect to login
        this.router.navigate(['/login']);
      } else {
        this.error = error.message || 'Failed to load notifications';
        this.loading = false;
      }
    }
  }

  getNotificationIcon(type: string): string {
    switch (type?.toLowerCase()) {
      case 'projectcreated':
      case 'projectupdated':
      case 'projectdeleted':
        return 'briefcase-outline';
      case 'accessrequested':
      case 'accessgranted':
      case 'accessdenied':
        return 'person-outline';
      case 'datasetadded':
        return 'mail-outline';
      default:
        return 'notifications-outline';
    }
  }

  getNotificationColor(type: string): string {
    switch (type?.toLowerCase()) {
      case 'projectcreated':
        return 'success';
      case 'projectupdated':
        return 'warning';
      case 'projectdeleted':
        return 'danger';
      case 'accessrequested':
        return 'warning';
      case 'accessgranted':
        return 'success';
      case 'accessdenied':
        return 'danger';
      case 'datasetadded':
        return 'primary';
      default:
        return 'medium';
    }
  }

  hasUnreadNotifications(): boolean {
    const hasUnread = this.notifications.some(notification => !notification.isRead);
    console.debug('hasUnreadNotifications check:', hasUnread, 'Total notifications:', this.notifications.length, 'Unread count:', this.notifications.filter(n => !n.isRead).length);
    return hasUnread;
  }

  async markAsRead(notification: Notification) {
    if (notification.isRead) return;

    this.processingNotificationId = notification.notificationId;

    try {
      const response = await firstValueFrom(this.notificationService.markAsRead(notification.notificationId));
      notification.isRead = true;
      this.mainLayout.updateNotifications(); // Update the notification count in the layout
      
      // Show the success message from the backend or a default message
      const successMessage = response?.message || 'Notification marked as read';
      this.showToast(successMessage, 'success');
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      this.showToast(error.message || 'Failed to mark notification as read', 'danger');
    } finally {
      this.processingNotificationId = null;
    }
  }

  async markAllAsRead() {
    console.debug('markAllAsRead called');
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      console.debug('No current user found');
      this.showToast('No user logged in', 'danger');
      return;
    }

    console.debug('Current user:', currentUser);
    console.debug('Notifications before marking as read:', this.notifications);

    try {
      this.loading = true;
      const userId = currentUser.userId || currentUser.UserId || 0;
      console.debug('Calling markAllAsRead with userId:', userId);
      const response = await firstValueFrom(this.notificationService.markAllAsRead(userId));
      console.debug('markAllAsRead response:', response);
      
      this.notifications.forEach(notification => notification.isRead = true);
      this.mainLayout.updateNotifications(); // Update the notification count in the layout
      
      // Show the success message from the backend or a default message
      const successMessage = response?.message || 'All notifications marked as read';
      this.showToast(successMessage, 'success');
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      this.showToast(error.message || 'Failed to mark all notifications as read', 'danger');
    } finally {
      this.loading = false;
    }
  }

  async handleRefresh(event: any) {
    await this.loadNotifications();
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