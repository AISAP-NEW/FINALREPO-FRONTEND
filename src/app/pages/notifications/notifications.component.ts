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
  IonChip,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonButtons,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  notificationsOutline,
  timeOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  warningOutline,
  peopleOutline,
  checkmarkOutline,
  codeOutline,
  personOutline
} from 'ionicons/icons';
import { NotificationService, Notification } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { interval } from 'rxjs';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-notifications',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Notifications</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="markAllAsRead()" [disabled]="loading || !hasUnreadNotifications">
            Mark All as Read
          </ion-button>
        </ion-buttons>
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
          <ion-item *ngFor="let notification of notifications" [class.unread]="!notification.isRead">
            <ion-icon 
              [name]="getNotificationIcon(notification.type)" 
              slot="start"
              [color]="getNotificationColor(notification.type)">
            </ion-icon>
            <ion-label class="ion-text-wrap">
              <h2>{{ notification.message }}</h2>
              <p class="notification-meta">
                <ion-chip [color]="getNotificationColor(notification.type)" outline>
                  {{ notification.type }}
                </ion-chip>
                <ion-chip [color]="notification.isRead ? 'medium' : 'primary'" outline>
                  {{ notification.isRead ? 'Read' : 'Unread' }}
                </ion-chip>
                <span class="time">
                  <ion-icon name="time-outline"></ion-icon>
                  {{ notification.createdDate | date:'medium' }}
                </span>
                <span *ngIf="notification.projectName" class="project">
                  <ion-icon name="folder-outline"></ion-icon>
                  {{ notification.projectName }}
                </span>
                <span *ngIf="notification.senderName" class="sender">
                  <ion-icon name="person-outline"></ion-icon>
                  {{ notification.senderName }}
                </span>
              </p>
            </ion-label>
            <ion-button 
              slot="end" 
              fill="clear"
              (click)="markAsRead(notification)"
              *ngIf="!notification.isRead">
              <ion-icon name="checkmark-outline" slot="icon-only"></ion-icon>
            </ion-button>
          </ion-item>

          <ion-item *ngIf="notifications.length === 0" lines="none">
            <ion-label class="ion-text-center">
              No notifications to display
            </ion-label>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>
  `,
  styles: [`
    .unread {
      --background: var(--ion-color-light);
      font-weight: 500;
    }
    .notification-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
      flex-wrap: wrap;
    }
    .time, .project, .sender {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--ion-color-medium);
      font-size: 0.9em;
    }
    ion-chip {
      margin: 0;
      font-size: 0.85em;
    }
    h2 {
      margin: 0 0 8px 0;
      font-size: 1em;
      line-height: 1.4;
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
    IonChip,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    IonButtons
  ]
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  loading = true;
  hasUnreadNotifications = false;
  private refreshSubscription: Subscription | null = null;

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private toastController: ToastController
  ) {
    addIcons({
      notificationsOutline,
      timeOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      warningOutline,
      peopleOutline,
      checkmarkOutline,
      codeOutline,
      personOutline
    });
  }

  ngOnInit() {
    this.loadNotifications();
    // Refresh notifications every minute
    this.refreshSubscription = interval(60000).subscribe(() => {
      this.loadNotifications();
    });
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadNotifications() {
    this.loading = true;
    const currentUser = this.authService.getCurrentUser();
    console.log('Current user:', currentUser);

    this.notificationService.getNotifications().subscribe(
      (notifications) => {
        console.log('Received notifications:', notifications);
        this.notifications = notifications;
        this.hasUnreadNotifications = notifications.some(n => !n.isRead);
        this.loading = false;
      },
      async (error) => {
        console.error('Error loading notifications:', error);
        this.loading = false;
        await this.showToast('Error loading notifications. Please try again.', 'danger');
      }
    );
  }

  handleRefresh(event: any) {
    this.loadNotifications();
    event.target.complete();
  }

  async markAsRead(notification: Notification) {
    if (!notification.isRead) {
      try {
        const loading = await this.toastController.create({
          message: 'Marking as read...',
          duration: 0,
          position: 'bottom',
          color: 'medium'
        });
        await loading.present();

        await firstValueFrom(this.notificationService.markAsRead(notification.notificationId));
        
        // Update the local notification state
        notification.isRead = true;
        this.hasUnreadNotifications = this.notifications.some(n => !n.isRead);
        
        await loading.dismiss();
        await this.showToast('Notification marked as read', 'success');
        
        // Refresh the notifications list to ensure we have the latest state
        this.loadNotifications();
      } catch (error) {
        console.error('Error marking notification as read:', error);
        await this.showToast('Error marking notification as read', 'danger');
      }
    }
  }

  async markAllAsRead() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      try {
        const loading = await this.toastController.create({
          message: 'Marking all as read...',
          duration: 0,
          position: 'bottom',
          color: 'medium'
        });
        await loading.present();

        await firstValueFrom(this.notificationService.markAllAsRead(currentUser.userId));
        
        // Update all local notification states
        this.notifications.forEach(n => n.isRead = true);
        this.hasUnreadNotifications = false;
        
        await loading.dismiss();
        await this.showToast('All notifications marked as read', 'success');
        
        // Refresh the notifications list to ensure we have the latest state
        this.loadNotifications();
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
        await this.showToast('Error marking all notifications as read', 'danger');
      }
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'ProjectAssigned':
        return 'people-outline';
      case 'ProjectRemoved':
        return 'close-circle-outline';
      case 'AccessRequested':
        return 'notifications-outline';
      case 'AccessGranted':
        return 'checkmark-circle-outline';
      case 'AccessDenied':
        return 'close-circle-outline';
      case 'RoleChanged':
        return 'warning-outline';
      default:
        return 'notifications-outline';
    }
  }

  getNotificationColor(type: string): string {
    switch (type) {
      case 'ProjectAssigned':
      case 'AccessGranted':
        return 'success';
      case 'ProjectRemoved':
      case 'AccessDenied':
        return 'danger';
      case 'AccessRequested':
        return 'primary';
      case 'RoleChanged':
        return 'warning';
      default:
        return 'medium';
    }
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
} 