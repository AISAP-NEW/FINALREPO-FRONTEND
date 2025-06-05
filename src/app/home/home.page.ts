import { Component, OnInit } from '@angular/core';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButtons,
  IonMenuButton,
  IonIcon,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonProgressBar,
  IonAvatar,
  IonChip,
  IonSkeletonText
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  folderOutline, 
  documentsOutline, 
  notificationsOutline,
  addOutline,
  timeOutline,
  peopleOutline,
  analyticsOutline,
  cloudUploadOutline,
  checkmarkCircleOutline,
  alertCircleOutline
} from 'ionicons/icons';
import { ProjectService } from '../services/project.service';
import { DatasetService } from '../services/dataset.service';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-home',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Dashboard</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <!-- Summary Cards -->
      <ion-grid class="ion-padding">
        <ion-row>
          <ion-col size="12" size-md="6" size-lg="3">
            <ion-card class="summary-card">
              <ion-card-content>
                <div class="card-icon" style="background: var(--ion-color-primary-light)">
                  <ion-icon name="folder-outline" color="primary"></ion-icon>
                </div>
                <div class="card-content">
                  <h3>Total Projects</h3>
                  <h2>{{ loading ? '...' : totalProjects }}</h2>
                </div>
              </ion-card-content>
            </ion-card>
          </ion-col>

          <ion-col size="12" size-md="6" size-lg="3">
            <ion-card class="summary-card">
              <ion-card-content>
                <div class="card-icon" style="background: var(--ion-color-success-light)">
                  <ion-icon name="documents-outline" color="success"></ion-icon>
                </div>
                <div class="card-content">
                  <h3>Active Datasets</h3>
                  <h2>{{ loading ? '...' : activeDatasets }}</h2>
                </div>
              </ion-card-content>
            </ion-card>
          </ion-col>

          <ion-col size="12" size-md="6" size-lg="3">
            <ion-card class="summary-card">
              <ion-card-content>
                <div class="card-icon" style="background: var(--ion-color-warning-light)">
                  <ion-icon name="time-outline" color="warning"></ion-icon>
                </div>
                <div class="card-content">
                  <h3>Pending Tasks</h3>
                  <h2>{{ loading ? '...' : pendingTasks }}</h2>
                </div>
              </ion-card-content>
            </ion-card>
          </ion-col>

          <ion-col size="12" size-md="6" size-lg="3">
            <ion-card class="summary-card">
              <ion-card-content>
                <div class="card-icon" style="background: var(--ion-color-danger-light)">
                  <ion-icon name="notifications-outline" color="danger"></ion-icon>
                </div>
                <div class="card-content">
                  <h3>Unread Notifications</h3>
                  <h2>{{ loading ? '...' : unreadNotifications }}</h2>
                </div>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>

        <!-- Main Content Area -->
        <ion-row>
          <!-- Recent Activity Feed -->
          <ion-col size="12" size-lg="4">
            <ion-card>
              <ion-card-header>
                <ion-card-title>Recent Activity</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <ion-list>
                  <ion-item *ngFor="let activity of recentActivities">
                    <ion-avatar slot="start">
                      <img [src]="activity.userAvatar" alt="User avatar">
                    </ion-avatar>
                    <ion-label>
                      <h3>{{ activity.action }}</h3>
                      <p>{{ activity.timestamp | date:'short' }}</p>
                    </ion-label>
                  </ion-item>
                </ion-list>
              </ion-card-content>
            </ion-card>
          </ion-col>

          <!-- Dataset Visualization -->
          <ion-col size="12" size-lg="4">
            <ion-card>
              <ion-card-header>
                <ion-card-title>Recent Datasets</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <ion-list>
                  <ion-item *ngFor="let dataset of recentDatasets">
                    <ion-icon name="documents-outline" slot="start" color="primary"></ion-icon>
                    <ion-label>
                      <h3>{{ dataset.name }}</h3>
                      <p>
                        {{ dataset.records }} records
                        <ion-chip color="primary" class="ion-margin-start">
                          {{ dataset.type }}
                        </ion-chip>
                      </p>
                    </ion-label>
                    <ion-buttons slot="end">
                      <ion-button color="primary">
                        <ion-icon name="eye-outline" slot="icon-only"></ion-icon>
                      </ion-button>
                      <ion-button color="danger">
                        <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
                      </ion-button>
                    </ion-buttons>
                  </ion-item>
                </ion-list>
              </ion-card-content>
            </ion-card>
          </ion-col>

          <!-- Project Status -->
          <ion-col size="12" size-lg="4">
            <ion-card>
              <ion-card-header>
                <ion-card-title>Active Projects</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <ion-list>
                  <ion-item *ngFor="let project of activeProjects">
                    <ion-label>
                      <h3>{{ project.name }}</h3>
                      <p>{{ project.members.length }} members</p>
                      <ion-progress-bar [value]="project.progress" [color]="project.progress < 0.3 ? 'danger' : project.progress < 0.7 ? 'warning' : 'success'"></ion-progress-bar>
                    </ion-label>
                    <ion-chip [color]="project.status === 'On Track' ? 'success' : 'warning'" slot="end">
                      {{ project.status }}
                    </ion-chip>
                  </ion-item>
                </ion-list>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>

        <!-- Quick Access Tools -->
        <ion-row>
          <ion-col size="12">
            <ion-card>
              <ion-card-header>
                <ion-card-title>Quick Actions</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <div class="quick-actions">
                  <ion-button color="primary" routerLink="/datasets/new">
                    <ion-icon name="cloud-upload-outline" slot="start"></ion-icon>
                    Upload Dataset
                  </ion-button>
                  <ion-button color="secondary" routerLink="/projects">
                    <ion-icon name="add-outline" slot="start"></ion-icon>
                    New Project
                  </ion-button>
                  <ion-button color="tertiary" routerLink="/datasets">
                    <ion-icon name="analytics-outline" slot="start"></ion-icon>
                    Preprocess Data
                  </ion-button>
                </div>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>
  `,
  styles: [`
    :host {
      --ion-color-primary-light: rgba(var(--ion-color-primary-rgb), 0.1);
      --ion-color-success-light: rgba(var(--ion-color-success-rgb), 0.1);
      --ion-color-warning-light: rgba(var(--ion-color-warning-rgb), 0.1);
      --ion-color-danger-light: rgba(var(--ion-color-danger-rgb), 0.1);
    }

    .summary-card {
      margin: 0;
      height: 100%;
      
      ion-card-content {
        display: flex;
        align-items: center;
        padding: 16px;
      }

      .card-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;

        ion-icon {
          font-size: 24px;
        }
      }

      .card-content {
        h3 {
          margin: 0;
          font-size: 14px;
          color: var(--ion-color-medium);
        }

        h2 {
          margin: 4px 0 0 0;
          font-size: 24px;
          font-weight: 600;
        }
      }
    }

    ion-card {
      margin: 0 0 16px 0;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }

    ion-card-header {
      padding: 16px;
    }

    ion-card-title {
      font-size: 18px;
      font-weight: 600;
    }

    ion-list {
      padding: 0;
    }

    ion-item {
      --padding-start: 16px;
      --padding-end: 16px;
      --padding-top: 12px;
      --padding-bottom: 12px;
    }

    ion-progress-bar {
      margin-top: 8px;
    }

    .quick-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    ion-avatar {
      width: 32px;
      height: 32px;
    }

    ion-chip {
      font-size: 12px;
      height: 24px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButtons,
    IonMenuButton,
    IonIcon,
    IonBadge,
    IonGrid,
    IonRow,
    IonCol,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonProgressBar,
    IonAvatar,
    IonChip,
    IonSkeletonText
  ]
})
export class HomePage implements OnInit {
  loading = true;
  totalProjects = 0;
  activeDatasets = 0;
  pendingTasks = 0;
  unreadNotifications = 0;

  recentActivities: any[] = [];
  recentDatasets: any[] = [];
  activeProjects: any[] = [];

  constructor(
    private projectService: ProjectService,
    private datasetService: DatasetService,
    private notificationService: NotificationService
  ) {
    addIcons({ 
      folderOutline, 
      documentsOutline, 
      notificationsOutline,
      addOutline,
      timeOutline,
      peopleOutline,
      analyticsOutline,
      cloudUploadOutline,
      checkmarkCircleOutline,
      alertCircleOutline
    });
  }

  ngOnInit() {
    this.loadDashboardData();
  }

  private loadDashboardData() {
    // Load projects
    this.projectService.getProjects().subscribe(projects => {
      this.totalProjects = projects.length;
      this.activeProjects = projects
        .filter(p => p.isActive)
        .slice(0, 5)
        .map(p => ({
          name: p.name,
          members: p.members,
          progress: Math.random(), // Replace with actual progress calculation
          status: Math.random() > 0.3 ? 'On Track' : 'At Risk'
        }));
    });

    // Load datasets
    this.datasetService.getAllDatasets().subscribe(datasets => {
      this.activeDatasets = datasets.length;
      this.recentDatasets = datasets.slice(0, 5).map(d => ({
        name: d.datasetName,
        records: Math.floor(Math.random() * 10000), // Replace with actual record count
        type: d.fileType
      }));
    });

    // Load notifications
    this.notificationService.getUnreadNotifications().subscribe(notifications => {
      this.unreadNotifications = notifications.length;
    });

    // Load recent activities
    this.notificationService.getNotifications().subscribe(notifications => {
      this.recentActivities = notifications.slice(0, 5).map(n => ({
        action: n.message,
        timestamp: n.createdDate,
        userAvatar: 'assets/default-avatar.png' // Replace with actual user avatars
      }));
    });

    // Set pending tasks (placeholder)
    this.pendingTasks = Math.floor(Math.random() * 10); // Replace with actual pending tasks count

    this.loading = false;
  }
}
