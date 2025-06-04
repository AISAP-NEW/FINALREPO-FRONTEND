import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { 
  IonMenu, 
  IonHeader, 
  IonToolbar, 
  IonTitle,
  IonContent, 
  IonList, 
  IonItem, 
  IonIcon,
  IonLabel,
  IonMenuToggle,
  IonButtons,
  IonMenuButton,
  IonSplitPane,
  IonBadge,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  homeOutline, 
  folderOutline, 
  barChartOutline, 
  peopleOutline, 
  notificationsOutline,
  logOutOutline,
  keyOutline
} from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  template: `
    <ion-split-pane contentId="main-content">
      <ion-menu contentId="main-content">
        <ion-header>
          <ion-toolbar>
            <ion-title>Menu</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-list>
            <ion-menu-toggle auto-hide="false">
              <ion-item routerLink="/home" routerLinkActive="selected" detail="false">
                <ion-icon slot="start" name="home-outline"></ion-icon>
                <ion-label>Home</ion-label>
              </ion-item>
              <ion-item routerLink="/projects" routerLinkActive="selected" detail="false">
                <ion-icon slot="start" name="folder-outline"></ion-icon>
                <ion-label>Projects</ion-label>
              </ion-item>
              <ion-item routerLink="/datasets" routerLinkActive="selected" detail="false">
                <ion-icon slot="start" name="bar-chart-outline"></ion-icon>
                <ion-label>Datasets</ion-label>
              </ion-item>
              <ion-item routerLink="/developers" routerLinkActive="selected" detail="false">
                <ion-icon slot="start" name="people-outline"></ion-icon>
                <ion-label>Developers</ion-label>
              </ion-item>
              <ion-item routerLink="/access-levels" routerLinkActive="selected" detail="false">
                <ion-icon slot="start" name="key-outline"></ion-icon>
                <ion-label>Access Levels</ion-label>
              </ion-item>
              <ion-item routerLink="/notifications" routerLinkActive="selected" detail="false">
                <ion-icon slot="start" name="notifications-outline"></ion-icon>
                <ion-label>Notifications</ion-label>
                <ion-badge color="danger" *ngIf="unreadCount > 0">{{ unreadCount }}</ion-badge>
              </ion-item>
            </ion-menu-toggle>
          </ion-list>

          <ion-list class="logout-section">
            <ion-menu-toggle auto-hide="false">
              <ion-item button (click)="confirmLogout()" detail="false">
                <ion-icon slot="start" name="log-out-outline" color="danger"></ion-icon>
                <ion-label color="danger">Logout</ion-label>
              </ion-item>
            </ion-menu-toggle>
          </ion-list>
        </ion-content>
      </ion-menu>

      <div class="ion-page" id="main-content">
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-menu-button></ion-menu-button>
            </ion-buttons>
            <ion-title>AISAP</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <router-outlet></router-outlet>
        </ion-content>
      </div>
    </ion-split-pane>
  `,
  styles: [`
    ion-menu {
      --width: 250px;
    }

    ion-menu ion-content {
      --background: var(--ion-item-background, var(--ion-background-color, #fff));
    }

    ion-menu ion-list {
      padding: 20px 0;
    }

    ion-menu ion-item {
      --padding-start: 20px;
      --padding-end: 20px;
      --min-height: 50px;
    }

    ion-menu ion-item.selected {
      --background: var(--ion-color-light);
      --color: var(--ion-color-primary);
    }

    ion-menu ion-item.selected ion-icon {
      color: var(--ion-color-primary);
    }

    ion-menu ion-icon {
      font-size: 24px;
      margin-right: 12px;
    }

    ion-badge {
      margin-left: 8px;
    }

    .logout-section {
      position: absolute;
      bottom: 0;
      width: 100%;
      border-top: 1px solid var(--ion-color-light);
    }

    ion-menu-button {
      display: block;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
    IonMenuToggle,
    IonButtons,
    IonMenuButton,
    IonSplitPane,
    IonBadge
  ],
})
export class MainLayoutComponent {
  unreadCount = 0;

  constructor(
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService,
    private alertController: AlertController
  ) {
    addIcons({ 
      homeOutline, 
      folderOutline, 
      barChartOutline, 
      peopleOutline, 
      notificationsOutline,
      logOutOutline,
      keyOutline
    });

    // Subscribe to unread notifications count
    this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
  }

  async confirmLogout() {
    const alert = await this.alertController.create({
      header: 'Confirm Logout',
      message: 'Are you sure you want to logout?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Logout',
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      ]
    });

    await alert.present();
  }
} 