import { Component, OnInit, OnDestroy, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonApp,
  IonSplitPane,
  IonMenu,
  IonContent,
  IonList,
  IonListHeader,
  IonNote,
  IonMenuToggle,
  IonItem,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonBadge,
  IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  folderOutline,
  peopleOutline,
  documentTextOutline,
  personOutline,
  notificationsOutline,
  keyOutline,
  logOutOutline,
  businessOutline,
  layersOutline,
  cubeOutline
} from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { interval, Subscription, Subject, BehaviorSubject, timer } from 'rxjs';
import { takeUntil, retryWhen, delay, take, catchError } from 'rxjs/operators';

@Injectable()
@Component({
  selector: 'app-main-layout',
  template: `
    <ion-app>
      <ion-split-pane contentId="main-content">
        <ion-menu contentId="main-content" type="overlay">
          <ion-content>
            <ion-list id="inbox-list">
              <ion-list-header>AISAP</ion-list-header>
              <ion-note>{{ currentUserEmail }}</ion-note>

              <ion-menu-toggle auto-hide="false">
                <ion-item routerLink="/home" routerDirection="root" lines="none" detail="false" routerLinkActive="selected">
                  <ion-icon slot="start" name="home-outline"></ion-icon>
                  <ion-label>Home</ion-label>
                </ion-item>
              </ion-menu-toggle>

              <ion-menu-toggle auto-hide="false">
                <ion-item routerLink="/projects" routerDirection="root" lines="none" detail="false" routerLinkActive="selected">
                  <ion-icon slot="start" name="folder-outline"></ion-icon>
                  <ion-label>Projects</ion-label>
                </ion-item>
              </ion-menu-toggle>

              <ion-menu-toggle auto-hide="false">
                <ion-item routerLink="/clients" routerDirection="root" lines="none" detail="false" routerLinkActive="selected">
                  <ion-icon slot="start" name="business-outline"></ion-icon>
                  <ion-label>Clients</ion-label>
                </ion-item>
              </ion-menu-toggle>

              <ion-menu-toggle auto-hide="false">
                <ion-item routerLink="/datasets" routerDirection="root" lines="none" detail="false" routerLinkActive="selected">
                  <ion-icon slot="start" name="layers-outline"></ion-icon>
                  <ion-label>Datasets</ion-label>
                </ion-item>
              </ion-menu-toggle>

              <ion-menu-toggle auto-hide="false">
                <ion-item routerLink="/models" routerDirection="root" lines="none" detail="false" routerLinkActive="selected">
                  <ion-icon slot="start" name="cube-outline"></ion-icon>
                  <ion-label>Models</ion-label>
                </ion-item>
              </ion-menu-toggle>

              <ion-menu-toggle auto-hide="false">
                <ion-item routerLink="/developers" routerDirection="root" lines="none" detail="false" routerLinkActive="selected">
                  <ion-icon slot="start" name="people-outline"></ion-icon>
                  <ion-label>Developers</ion-label>
                </ion-item>
              </ion-menu-toggle>

              <ion-menu-toggle auto-hide="false">
                <ion-item routerLink="/reports" routerDirection="root" lines="none" detail="false" routerLinkActive="selected">
                  <ion-icon slot="start" name="document-text-outline"></ion-icon>
                  <ion-label>Reports</ion-label>
                </ion-item>
              </ion-menu-toggle>

              <ion-menu-toggle auto-hide="false">
                <ion-item routerLink="/access-levels" routerDirection="root" lines="none" detail="false" routerLinkActive="selected">
                  <ion-icon slot="start" name="key-outline"></ion-icon>
                  <ion-label>Access Levels</ion-label>
                </ion-item>
              </ion-menu-toggle>

              <ion-menu-toggle auto-hide="false">
                <ion-item routerLink="/notifications" routerDirection="root" lines="none" detail="false" routerLinkActive="selected">
                  <ion-icon slot="start" [name]="isLoadingNotifications ? 'notifications' : 'notifications-outline'" [class.pulse]="hasNewNotifications"></ion-icon>
                  <ion-label>Notifications</ion-label>
                  <ion-spinner *ngIf="isLoadingNotifications" name="dots" slot="end"></ion-spinner>
                  <ion-badge *ngIf="!isLoadingNotifications && unreadCount > 0" color="danger" slot="end">{{ unreadCount }}</ion-badge>
                </ion-item>
              </ion-menu-toggle>

              <ion-menu-toggle auto-hide="false">
                <ion-item (click)="logout()" lines="none" detail="false">
                  <ion-icon slot="start" name="log-out-outline"></ion-icon>
                  <ion-label>Logout</ion-label>
                </ion-item>
              </ion-menu-toggle>
            </ion-list>
          </ion-content>
        </ion-menu>
        <ion-router-outlet id="main-content"></ion-router-outlet>
      </ion-split-pane>
    </ion-app>
  `,
  styles: [`
    ion-menu ion-content {
      --background: var(--ion-item-background, var(--ion-background-color, #fff));
    }

    ion-menu.md ion-content {
      --padding-start: 8px;
      --padding-end: 8px;
      --padding-top: 20px;
      --padding-bottom: 20px;
    }

    ion-menu.md ion-list {
      padding: 20px 0;
    }

    ion-menu.md ion-note {
      margin-bottom: 30px;
    }

    ion-menu.md ion-list-header,
    ion-menu.md ion-note {
      padding-left: 10px;
    }

    ion-menu.md ion-list#inbox-list {
      border-bottom: 1px solid var(--ion-color-step-150, #d7d8da);
    }

    ion-menu.md ion-list#inbox-list ion-list-header {
      font-size: 22px;
      font-weight: 600;
      min-height: 20px;
    }

    ion-menu.md ion-item {
      --padding-start: 10px;
      --padding-end: 10px;
      border-radius: 4px;
    }

    ion-menu.md ion-item.selected {
      --background: rgba(var(--ion-color-primary-rgb), 0.14);
    }

    ion-menu.md ion-item.selected ion-icon {
      color: var(--ion-color-primary);
    }

    ion-menu.md ion-item ion-icon {
      color: var(--ion-color-medium);
    }

    ion-menu.md ion-item ion-label {
      font-weight: 500;
    }

    ion-menu.ios ion-content {
      --padding-bottom: 20px;
    }

    ion-menu.ios ion-list {
      padding: 20px 0 0 0;
    }

    ion-menu.ios ion-note {
      line-height: 24px;
      margin-bottom: 20px;
    }

    ion-menu.ios ion-item {
      --padding-start: 16px;
      --padding-end: 16px;
      --min-height: 50px;
    }

    ion-menu.ios ion-item ion-icon {
      font-size: 24px;
      color: var(--ion-color-medium);
    }

    ion-menu.ios ion-item.selected ion-icon {
      color: var(--ion-color-primary);
    }

    ion-menu.ios ion-list#labels-list ion-list-header {
      margin-bottom: 8px;
    }

    ion-menu.ios ion-list-header,
    ion-menu.ios ion-note {
      padding-left: 16px;
      padding-right: 16px;
    }

    ion-menu.ios ion-note {
      margin-bottom: 8px;
    }

    ion-note {
      display: inline-block;
      font-size: 16px;
      color: var(--ion-color-medium-shade);
    }

    ion-item.selected {
      --color: var(--ion-color-primary);
    }

    @keyframes pulse {
      0% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.2);
        opacity: 0.8;
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    .pulse {
      animation: pulse 1s infinite;
      color: var(--ion-color-danger) !important;
    }

    ion-spinner {
      width: 20px;
      height: 20px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonApp,
    IonSplitPane,
    IonMenu,
    IonContent,
    IonList,
    IonListHeader,
    IonNote,
    IonMenuToggle,
    IonItem,
    IonIcon,
    IonLabel,
    IonRouterOutlet,
    IonBadge,
    IonSpinner
  ]
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  currentUserEmail = '';
  unreadCount = 0;
  isLoadingNotifications = false;
  hasNewNotifications = false;
  private destroy$ = new Subject<void>();
  private notificationUpdate$ = new BehaviorSubject<void>(undefined);
  private readonly POLLING_INTERVAL = 10000; // Poll every 10 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    addIcons({
      homeOutline,
      folderOutline,
      peopleOutline,
      documentTextOutline,
      personOutline,
      notificationsOutline,
      keyOutline,
      logOutOutline,
      businessOutline,
      layersOutline,
      cubeOutline
    });
  }

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    this.currentUserEmail = currentUser?.email || currentUser?.Email || '';
    this.startPolling();

    // Subscribe to notification updates
    this.notificationUpdate$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshUnreadCount());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private startPolling() {
    // Initial check
    this.refreshUnreadCount();

    // Start polling
    interval(this.POLLING_INTERVAL)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.refreshUnreadCount());
  }

  private refreshUnreadCount() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    const userId = currentUser.userId || currentUser.UserId || 0;
    this.isLoadingNotifications = true;

    this.notificationService.getUnreadNotifications(userId)
      .pipe(
        retryWhen(errors =>
          errors.pipe(
            delay(this.RETRY_DELAY),
            take(this.MAX_RETRIES)
          )
        ),
        catchError(error => {
          console.error('Error fetching unread notifications:', error);
          return [];
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (notifications) => {
          const previousCount = this.unreadCount;
          this.unreadCount = notifications.length;
          
          // Check if we have new notifications
          if (this.unreadCount > previousCount) {
            this.hasNewNotifications = true;
            // Reset the animation after 5 seconds
            timer(5000).pipe(takeUntil(this.destroy$)).subscribe(() => {
              this.hasNewNotifications = false;
            });
          }
        },
        error: (error) => {
          console.error('Error fetching unread notifications:', error);
        },
        complete: () => {
          this.isLoadingNotifications = false;
        }
      });
  }

  // Method to be called when notifications are marked as read
  updateNotifications() {
    this.notificationUpdate$.next();
  }

  logout() {
    this.authService.logout();
  }
} 