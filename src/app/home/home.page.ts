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
  IonBadge
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
  alertCircleOutline,
  eyeOutline,
  trashOutline
} from 'ionicons/icons';
import { ProjectService } from '../services/project.service';
import { DatasetService } from '../services/dataset.service';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
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
    IonBadge
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
    private notificationService: NotificationService,
    private authService: AuthService
  ) {
    addIcons({ 
      'folder-outline': folderOutline, 
      'documents-outline': documentsOutline, 
      'notifications-outline': notificationsOutline,
      'add-outline': addOutline,
      'time-outline': timeOutline,
      'people-outline': peopleOutline,
      'analytics-outline': analyticsOutline,
      'cloud-upload-outline': cloudUploadOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'alert-circle-outline': alertCircleOutline,
      'eye-outline': eyeOutline,
      'trash-outline': trashOutline
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
    this.refreshNotifications();

    // Set pending tasks (placeholder)
    this.pendingTasks = Math.floor(Math.random() * 10); // Replace with actual pending tasks count

    this.loading = false;
  }

  private refreshNotifications() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    const userId = currentUser.userId || currentUser.UserId || 0;
    
    // Get unread notifications
    this.notificationService.getUnreadNotifications(userId).subscribe(notifications => {
      console.log('Unread notifications:', notifications);
      this.unreadNotifications = notifications.length;
    });

    // Get all notifications
    this.notificationService.getNotifications(userId).subscribe(notifications => {
      console.log('All notifications:', notifications);
      this.recentActivities = notifications.slice(0, 5).map(n => ({
        action: n.message,
        timestamp: n.createdDate,
        userAvatar: 'assets/default-avatar.png' // Replace with actual user avatars
      }));
    });
  }
}
