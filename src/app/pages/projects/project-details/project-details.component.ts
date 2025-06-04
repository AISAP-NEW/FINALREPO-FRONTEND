import { Component, Input } from '@angular/core';
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
  ModalController
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
  mailOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-project-details',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Project Details</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
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
            <p>{{ project.objectives }}</p>
          </ion-label>
        </ion-item>

        <ion-item>
          <ion-icon name="document-text-outline" slot="start"></ion-icon>
          <ion-label>
            <h2>Scope</h2>
            <p>{{ project.scope }}</p>
          </ion-label>
        </ion-item>

        <ion-item>
          <ion-icon name="code-outline" slot="start"></ion-icon>
          <ion-label>
            <h2>Technologies</h2>
            <p>{{ project.technologies }}</p>
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
            <h2>Team Members ({{ project.members.length }})</h2>
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
      </ion-list>
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
    }
    ion-item ion-label h2 {
      font-weight: 600;
      margin-bottom: 8px;
    }
    ion-item ion-label p {
      white-space: pre-wrap;
      margin-left: 8px;
    }
    .member-item {
      margin-left: 16px;
    }
    .member-item ion-label h3 {
      font-weight: 500;
    }
    .member-item ion-label p {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    ion-item ion-icon[slot="start"] {
      color: var(--ion-color-medium);
      font-size: 24px;
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
    IonChip
  ]
})
export class ProjectDetailsComponent {
  @Input() project!: Project;

  constructor(private modalController: ModalController) {
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
      mailOutline
    });
  }

  dismiss() {
    this.modalController.dismiss();
  }
} 