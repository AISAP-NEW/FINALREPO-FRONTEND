import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonChip,
  ModalController,
  ToastController,
  IonSpinner
} from '@ionic/angular/standalone';
import { Project } from '../../../services/project.service';
import { addIcons } from 'ionicons';
import {
  peopleOutline,
  codeOutline,
  calendarOutline,
  timeOutline,
  documentTextOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  closeOutline,
  personOutline,
  mailOutline,
  alertCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-project-details',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ project.name || 'Project Details' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Loading State -->
      <div *ngIf="loading" class="ion-text-center ion-padding">
        <ion-spinner></ion-spinner>
        <p>Loading project details...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="ion-text-center ion-padding error-container">
        <ion-icon name="alert-circle-outline" color="danger" size="large"></ion-icon>
        <h2>Error Loading Project</h2>
        <p>{{ error }}</p>
        <ion-button (click)="dismiss()">Close</ion-button>
      </div>

      <!-- Project Details -->
      <div *ngIf="project && !loading && !error" class="project-details">
        <div class="project-header">
          <h1>{{ project.name }}</h1>
          <ion-chip [color]="project.isActive ? 'success' : 'medium'">
            <ion-icon [name]="project.isActive ? 'checkmark-circle-outline' : 'close-circle-outline'"></ion-icon>
            <ion-label>{{ project.isActive ? 'Active' : 'Inactive' }}</ion-label>
          </ion-chip>
        </div>

        <ion-list>
          <ion-item>
            <ion-icon name="document-text-outline" slot="start"></ion-icon>
            <ion-label>
              <h2>Objectives</h2>
              <p>{{ project.objectives || 'No objectives specified' }}</p>
            </ion-label>
          </ion-item>

          <ion-item>
            <ion-icon name="document-text-outline" slot="start"></ion-icon>
            <ion-label>
              <h2>Scope</h2>
              <p>{{ project.scope || 'No scope specified' }}</p>
            </ion-label>
          </ion-item>

          <ion-item>
            <ion-icon name="code-outline" slot="start"></ion-icon>
            <ion-label>
              <h2>Technologies</h2>
              <p>{{ project.technologies || 'No technologies specified' }}</p>
            </ion-label>
          </ion-item>

          <ion-item>
            <ion-icon name="time-outline" slot="start"></ion-icon>
            <ion-label>
              <h2>Timeline</h2>
              <p>{{ project.estimatedTimeline | date:'mediumDate' }}</p>
            </ion-label>
          </ion-item>

          <ion-item>
            <ion-icon name="calendar-outline" slot="start"></ion-icon>
            <ion-label>
              <h2>Created Date</h2>
              <p>{{ project.createdDate | date:'medium' }}</p>
            </ion-label>
          </ion-item>

          <ion-item>
            <ion-icon name="person-outline" slot="start"></ion-icon>
            <ion-label>
              <h2>Created By</h2>
              <p>{{ project.createdByUsername }}</p>
            </ion-label>
          </ion-item>

          <ion-item lines="none">
            <ion-icon name="people-outline" slot="start"></ion-icon>
            <ion-label>
              <h2>Team Members ({{ project.members.length || 0 }})</h2>
            </ion-label>
          </ion-item>

          <ion-item *ngFor="let member of project.members" lines="none" class="member-item">
            <ion-label>
              <h3>{{ member.username }}</h3>
              <p>
                <ion-icon name="mail-outline"></ion-icon>
                {{ member.email }}
              </p>
            </ion-label>
            <ion-chip [color]="member.hasAccess ? 'success' : 'medium'" slot="end">
              {{ member.role }}
            </ion-chip>
          </ion-item>

          <div *ngIf="!project.members?.length" class="ion-text-center ion-padding">
            <p class="no-members">No team members yet</p>
          </div>
        </ion-list>
      </div>
    </ion-content>
  `,
  styles: [`
    .project-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }
    .project-header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: bold;
      color: var(--ion-color-dark);
    }
    ion-item ion-label h2 {
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--ion-color-dark);
    }
    ion-item ion-label p {
      white-space: pre-wrap;
      margin-left: 8px;
      color: var(--ion-color-medium);
    }
    .member-item {
      margin-left: 16px;
      --background: var(--ion-color-light);
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .member-item ion-label h3 {
      font-weight: 500;
      color: var(--ion-color-dark);
    }
    .member-item ion-label p {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--ion-color-medium);
    }
    ion-item ion-icon[slot="start"] {
      color: var(--ion-color-primary);
      font-size: 24px;
    }
    .project-details {
      max-width: 800px;
      margin: 0 auto;
    }
    .error-container {
      text-align: center;
      padding: 2rem;
    }
    .error-container ion-icon {
      font-size: 48px;
      margin-bottom: 1rem;
    }
    .error-container h2 {
      color: var(--ion-color-danger);
      margin-bottom: 0.5rem;
    }
    .error-container p {
      color: var(--ion-color-medium);
      margin-bottom: 1.5rem;
    }
    .no-members {
      color: var(--ion-color-medium);
      font-style: italic;
    }
    ion-list {
      background: transparent;
    }
    ion-item {
      --background: var(--ion-color-light);
      margin-bottom: 8px;
      border-radius: 8px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonChip,
    IonSpinner
  ]
})
export class ProjectDetailsComponent implements OnInit {
  @Input() project!: Project;
  loading = true;
  error: string | null = null;

  constructor(
    private modalController: ModalController,
    private toastController: ToastController
  ) {
    addIcons({
      peopleOutline,
      codeOutline,
      calendarOutline,
      timeOutline,
      documentTextOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      closeOutline,
      personOutline,
      mailOutline,
      alertCircleOutline
    });
  }

  ngOnInit() {
    this.validateProject();
  }

  private validateProject() {
    try {
      this.loading = true;
      
      if (!this.project) {
        throw new Error('Project data not provided');
      }

      // Ensure all required fields exist
      if (!this.project.name) {
        throw new Error('Project name is missing');
      }

      // Initialize optional fields with defaults if missing
      this.project = {
        ...this.project,
        objectives: this.project.objectives || 'No objectives specified',
        scope: this.project.scope || 'No scope specified',
        technologies: this.project.technologies || 'No technologies specified',
        members: this.project.members || [],
        isActive: typeof this.project.isActive === 'boolean' ? this.project.isActive : true
      };

      this.error = null;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load project details';
      this.error = errorMessage;
      this.showToast(errorMessage, 'danger');
    } finally {
      this.loading = false;
    }
  }

  async showToast(message: string, color: 'success' | 'danger') {
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

  dismiss() {
    this.modalController.dismiss();
  }
} 