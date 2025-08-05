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
import { addIcons } from 'ionicons';
import {
  businessOutline,
  mailOutline,
  callOutline,
  locationOutline,
  peopleOutline,
  closeOutline,
  folderOutline,
  calendarOutline
} from 'ionicons/icons';
import { Client } from '../../../services/client.service';

@Component({
  selector: 'app-client-details',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Client Details</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="client-header">
        <h1>{{ client.name }}</h1>
      </div>

      <ion-list>
        <ion-item>
          <ion-icon name="mail-outline" slot="start"></ion-icon>
          <ion-label>
            <h2>Email</h2>
            <p>{{ client.email }}</p>
          </ion-label>
        </ion-item>

        <ion-item>
          <ion-icon name="call-outline" slot="start"></ion-icon>
          <ion-label>
            <h2>Telephone</h2>
            <p>{{ client.telephoneNumber }}</p>
          </ion-label>
        </ion-item>

        <ion-item>
          <ion-icon name="location-outline" slot="start"></ion-icon>
          <ion-label>
            <h2>Address</h2>
            <p>{{ client.address }}</p>
          </ion-label>
        </ion-item>

        <ion-item lines="none">
          <ion-icon name="people-outline" slot="start"></ion-icon>
          <ion-label>
            <h2>Projects ({{ client.projects.length }})</h2>
          </ion-label>
        </ion-item>

        <ion-item *ngFor="let project of client.projects" lines="none" class="project-item">
          <ion-icon name="folder-outline" slot="start" color="primary"></ion-icon>
          <ion-label>
            <h3>{{ project.name }}</h3>
            <p>
              <ion-icon name="calendar-outline"></ion-icon>
              Created: {{ project.createdDate | date }}
            </p>
          </ion-label>
          <ion-chip [color]="project.isActive ? 'success' : 'medium'" slot="end">
            {{ project.isActive ? 'Active' : 'Inactive' }}
          </ion-chip>
        </ion-item>

        <div *ngIf="client.projects.length === 0" class="ion-padding ion-text-center">
          <p>No projects assigned to this client.</p>
        </div>
      </ion-list>
    </ion-content>
  `,
  styles: [`
    .client-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }

    .client-header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: bold;
    }

    ion-item {
      --padding-start: 16px;
      --padding-end: 16px;
      --inner-padding-end: 0;
    }

    ion-item ion-label h2 {
      font-weight: 600;
      margin-bottom: 4px;
      font-size: 14px;
      color: var(--ion-color-medium);
    }

    ion-item ion-label p {
      font-size: 16px;
      color: var(--ion-color-dark);
    }

    .project-item {
      margin-left: 16px;
    }

    .project-item ion-label h3 {
      font-weight: 500;
      margin-bottom: 4px;
    }

    .project-item ion-label p {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
      color: var(--ion-color-medium);
    }

    ion-item ion-icon[slot="start"] {
      color: var(--ion-color-medium);
      font-size: 20px;
      margin-right: 16px;
    }

    ion-chip {
      font-size: 12px;
      height: 24px;
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
export class ClientDetailsComponent {
  @Input() client!: Client;

  constructor(private modalController: ModalController) {
    addIcons({
      businessOutline,
      mailOutline,
      callOutline,
      locationOutline,
      peopleOutline,
      closeOutline,
      folderOutline,
      calendarOutline
    });
  }

  ngOnInit() {
    // Debug logging to track project status
    console.log('Client Details Component - Client data:', this.client);
    console.log('Client projects:', this.client.projects);
    this.client.projects.forEach((project, index) => {
      console.log(`Project ${index + 1}:`, {
        name: project.name,
        isActive: project.isActive,
        projectId: project.projectId,
        createdDate: project.createdDate
      });
    });
  }

  dismiss() {
    this.modalController.dismiss();
  }
} 