import { Component, OnInit, OnDestroy, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
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
  IonSpinner,
  ModalController,
  AlertController
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
  cubeOutline,
  cloudUploadOutline,
  helpCircleOutline,
  flaskOutline,
  analyticsOutline,
  documentsOutline,
  speedometerOutline,
  trendingUpOutline,
  checkmarkCircleOutline,
  barChartOutline,
  chevronUp,
  chevronDown,
  listOutline,
  warningOutline
} from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { SessionTimeoutService } from '../../services/session-timeout.service';
import { SessionTimeoutWarningComponent } from '../../components/session-timeout-warning/session-timeout-warning.component';
import { HelpComponent } from '../../pages/help/help.component';
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
              <ion-note>{{ currentUserUserName }}</ion-note>

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
                <ion-item routerLink="/experiments" routerDirection="root" lines="none" detail="false" routerLinkActive="selected">
                  <ion-icon slot="start" name="flask-outline"></ion-icon>
                  <ion-label>Experiments</ion-label>
                </ion-item>
              </ion-menu-toggle>

              <ion-menu-toggle auto-hide="false">
                <ion-item routerLink="/training-dashboard" routerDirection="root" lines="none" detail="false" routerLinkActive="selected">
                  <ion-icon slot="start" name="speedometer-outline"></ion-icon>
                  <ion-label>Training Dashboard</ion-label>
                </ion-item>
              </ion-menu-toggle>

              <ion-menu-toggle auto-hide="false">
                <ion-item routerLink="/training-sessions" routerDirection="root" lines="none" detail="false" routerLinkActive="selected">
                  <ion-icon slot="start" name="list-outline"></ion-icon>
                  <ion-label>Training Sessions</ion-label>
                </ion-item>
              </ion-menu-toggle>

              <ion-menu-toggle auto-hide="false">
                <ion-item routerLink="/developers" routerDirection="root" lines="none" detail="false" routerLinkActive="selected">
                  <ion-icon slot="start" name="people-outline"></ion-icon>
                  <ion-label>Developers</ion-label>
                </ion-item>
              </ion-menu-toggle>

              <!-- Reports Dropdown Section -->
              <ion-item button (click)="toggleReportsDropdown()" lines="none" detail="false" [class.selected]="isReportsDropdownOpen">
                <ion-icon slot="start" name="document-text-outline"></ion-icon>
                <ion-label>Reports</ion-label>
                <ion-icon slot="end" [name]="isReportsDropdownOpen ? 'chevron-up' : 'chevron-down'"></ion-icon>
              </ion-item>
              
              <!-- Reports Dropdown Items -->
              <div class="reports-dropdown" [class.open]="isReportsDropdownOpen">
                <ion-item (click)="navigateToReport('users')" lines="none" detail="false" class="dropdown-item">
                  <ion-icon slot="start" name="people-outline"></ion-icon>
                  <ion-label>Registered Users Report</ion-label>
                </ion-item>
                
                <ion-item (click)="navigateToReport('clients-projects')" lines="none" detail="false" class="dropdown-item">
                  <ion-icon slot="start" name="business-outline"></ion-icon>
                  <ion-label>Clients and Projects Report</ion-label>
                </ion-item>
                
                <ion-item (click)="navigateToReport('training-sessions')" lines="none" detail="false" class="dropdown-item">
                  <ion-icon slot="start" name="trending-up-outline"></ion-icon>
                  <ion-label>Model Training Sessions Report</ion-label>
                </ion-item>
                
                <ion-item (click)="navigateToReport('model-deployments')" lines="none" detail="false" class="dropdown-item">
                  <ion-icon slot="start" name="cloud-upload-outline"></ion-icon>
                  <ion-label>Model Deployment Status Report</ion-label>
                </ion-item>
                
                <ion-item (click)="navigateToReport('dataset-transactions')" lines="none" detail="false" class="dropdown-item">
                  <ion-icon slot="start" name="analytics-outline"></ion-icon>
                  <ion-label>Dataset Transaction Summary Report</ion-label>
                </ion-item>
                
                <ion-item (click)="navigateToReport('dataset-status')" lines="none" detail="false" class="dropdown-item">
                  <ion-icon slot="start" name="checkmark-circle-outline"></ion-icon>
                  <ion-label>Dataset Status Report</ion-label>
                </ion-item>
                
                <ion-item (click)="navigateToReport('dataset-trends')" lines="none" detail="false" class="dropdown-item">
                  <ion-icon slot="start" name="bar-chart-outline"></ion-icon>
                  <ion-label>Management Dataset Trends Report</ion-label>
                </ion-item>
              </div>

              <ion-menu-toggle auto-hide="false">
                <ion-item routerLink="/deployments" routerDirection="root" lines="none" detail="false" routerLinkActive="selected">
                  <ion-icon slot="start" name="cloud-upload-outline"></ion-icon>
                  <ion-label>Deployments</ion-label>
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
                <ion-item (click)="openHelp()" lines="none" detail="false" button>
                  <ion-icon slot="start" name="help-circle-outline"></ion-icon>
                  <ion-label>Help</ion-label>
                </ion-item>
              </ion-menu-toggle>

              <ion-menu-toggle auto-hide="false">
                <ion-item (click)="confirmLogout()" lines="none" detail="false">
                  <ion-icon slot="start" name="log-out-outline"></ion-icon>
                  <ion-label>Logout</ion-label>
                </ion-item>
              </ion-menu-toggle>
            </ion-list>
          </ion-content>
        </ion-menu>
        <ion-router-outlet id="main-content"></ion-router-outlet>
      </ion-split-pane>
      
      <!-- Session Timeout Warning Component -->
      <app-session-timeout-warning></app-session-timeout-warning>
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

    /* Reports Dropdown Styles */
    .reports-dropdown {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease-in-out;
      background: var(--ion-color-light);
      margin-left: 16px;
      border-radius: 4px;
    }

    .reports-dropdown.open {
      max-height: 400px;
    }

    .dropdown-item {
      --padding-start: 20px;
      --padding-end: 10px;
      --min-height: 40px;
      font-size: 14px;
      margin: 2px 8px;
      border-radius: 4px;
    }

    .dropdown-item:hover {
      --background: rgba(var(--ion-color-primary-rgb), 0.1);
    }

    .dropdown-item.selected {
      --background: rgba(var(--ion-color-primary-rgb), 0.14);
      --color: var(--ion-color-primary);
    }

    ion-item.selected {
      --color: var(--ion-color-primary);
    }

    /* Chevron animation */
    ion-item ion-icon[name="chevron-up"],
    ion-item ion-icon[name="chevron-down"] {
      transition: transform 0.3s ease;
    }

    /* Logout Confirmation Alert Styles */
    .logout-confirmation-alert {
      --background: #ffffff;
      --border-radius: 12px;
      --box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    }

    .logout-confirmation-alert .alert-wrapper {
      border-radius: 12px;
      overflow: hidden;
    }

    .logout-confirmation-alert .alert-head {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px 16px 16px;
      text-align: center;
    }

    .logout-confirmation-alert .alert-head .alert-title {
      font-size: 18px;
      font-weight: 600;
      margin: 0;
    }

    .logout-confirmation-alert .alert-message {
      padding: 20px 16px;
      font-size: 15px;
      line-height: 1.5;
      color: #374151;
      text-align: center;
      margin: 0;
    }

    .logout-confirmation-alert .alert-button-group {
      padding: 0;
      border-top: 1px solid #e5e7eb;
    }

    .logout-confirmation-alert .cancel-button {
      --color: #6b7280;
      --background: transparent;
      font-weight: 500;
      border-right: 1px solid #e5e7eb;
    }

    .logout-confirmation-alert .logout-button {
      --color: #dc2626;
      --background: transparent;
      font-weight: 600;
    }

    .logout-confirmation-alert .alert-button {
      margin: 0;
      padding: 16px;
      font-size: 16px;
      border-radius: 0;
      min-height: 56px;
    }

    .logout-confirmation-alert .alert-button:first-child {
      border-bottom-left-radius: 12px;
    }

    .logout-confirmation-alert .alert-button:last-child {
      border-bottom-right-radius: 12px;
    }

    /* New styles for logout dialog */
    .logout-dialog-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
    }

    .logout-icon {
      font-size: 60px;
      color: var(--ion-color-danger);
      margin-bottom: 15px;
    }

    .logout-title {
      font-size: 24px;
      font-weight: 700;
      color: var(--ion-color-dark);
      margin-bottom: 10px;
    }

    .logout-message {
      font-size: 16px;
      color: var(--ion-color-medium);
      text-align: center;
      margin-bottom: 20px;
      line-height: 1.6;
    }

    .logout-warning {
      display: flex;
      align-items: center;
      color: var(--ion-color-warning);
      font-size: 14px;
      margin-top: 10px;
    }

    .logout-warning ion-icon {
      font-size: 18px;
      margin-right: 8px;
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
    IonSpinner,
    SessionTimeoutWarningComponent
  ]
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  currentUserEmail = '';
  currentUserUserName = '';
  unreadCount = 0;
  isLoadingNotifications = false;
  hasNewNotifications = false;
  isReportsDropdownOpen = false;
  private destroy$ = new Subject<void>();
  private notificationUpdate$ = new BehaviorSubject<void>(undefined);
  private readonly POLLING_INTERVAL = 10000; // Poll every 10 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private sessionTimeoutService: SessionTimeoutService,
    private modalController: ModalController,
    private alertController: AlertController,
    private router: Router
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
      cubeOutline,
      cloudUploadOutline,
      helpCircleOutline,
      flaskOutline,
      analyticsOutline,
      documentsOutline,
      speedometerOutline,
      trendingUpOutline,
      checkmarkCircleOutline,
      barChartOutline,
      chevronUp,
      chevronDown,
      listOutline,
      warningOutline
    });
  }

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    this.currentUserEmail = currentUser?.email || currentUser?.Email || '';
    this.currentUserUserName = currentUser?.username || currentUser?.Username || '';
    this.startPolling();

    // Subscribe to notification updates
    this.notificationUpdate$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshUnreadCount());

    // Start session timeout monitoring if user is authenticated
    if (this.authService.isAuthenticated()) {
      console.log('Starting session timeout monitoring for authenticated user');
      this.sessionTimeoutService.startMonitoring();
    }

    // Subscribe to authentication state changes
    this.authService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuthenticated => {
        if (isAuthenticated) {
          console.log('User authenticated - starting session monitoring');
          this.sessionTimeoutService.startMonitoring();
        } else {
          console.log('User not authenticated - stopping session monitoring');
          this.sessionTimeoutService.stopMonitoring();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Stop session monitoring when component is destroyed
    this.sessionTimeoutService.stopMonitoring();
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

  /**
   * Open the help modal with comprehensive documentation
   */
  async openHelp() {
    const modal = await this.modalController.create({
      component: HelpComponent,
      cssClass: 'help-modal'
    });
    
    await modal.present();
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Sign Out',
      message: `
        <div class="logout-dialog-content">
          <div class="logout-icon">
            <ion-icon name="log-out-outline"></ion-icon>
          </div>
          <div class="logout-title">Sign Out</div>
          <div class="logout-message">
            You are about to sign out of your account. All unsaved changes will be lost.
          </div>
          <div class="logout-warning">
            <ion-icon name="warning-outline"></ion-icon>
            <span>This action cannot be undone</span>
          </div>
        </div>
      `,
      cssClass: 'logout-confirmation-alert',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'cancel-button'
        },
        {
          text: 'Sign Out',
          role: 'destructive',
          cssClass: 'logout-button',
          handler: () => {
            console.log('Logout confirmed from main layout');
            // Stop session monitoring before logout
            this.sessionTimeoutService.stopMonitoring();
            this.authService.logout();
          }
        }
      ]
    });

    await alert.present();
  }

  async confirmLogout() {
    // This method is called from the HTML template
    await this.logout();
  }

  toggleReportsDropdown() {
    this.isReportsDropdownOpen = !this.isReportsDropdownOpen;
  }

  navigateToReport(reportType: string) {
    this.isReportsDropdownOpen = false;
    this.router.navigate(['/reports'], { queryParams: { type: reportType } });
  }
} 