import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  IonSelect,
  IonSelectOption,
  IonSpinner,
  ModalController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import { Client } from '../../../services/client.service';
import { ProjectService, Project } from '../../../services/project.service';

@Component({
  selector: 'app-client-project-form',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Assign to Project</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Loading State -->
      <div *ngIf="loading" class="ion-text-center">
        <ion-spinner></ion-spinner>
        <p>Loading projects...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="ion-padding">
        <ion-item color="danger">
          <ion-icon name="alert-circle" slot="start"></ion-icon>
          <ion-label>{{ error }}</ion-label>
        </ion-item>
      </div>

      <!-- Form -->
      <div *ngIf="!loading && !error">
        <h2>{{ client.name }}</h2>
        <p class="subtitle">Select a project to assign this client to:</p>

        <ion-list *ngIf="availableProjects.length > 0">
          <ion-item>
            <ion-select
              [(ngModel)]="selectedProjectId"
              label="Project"
              labelPlacement="stacked"
              placeholder="Select a project">
              <ion-select-option
                *ngFor="let project of availableProjects"
                [value]="project.projectId">
                {{ project.name }}
              </ion-select-option>
            </ion-select>
          </ion-item>
        </ion-list>

        <!-- Empty State -->
        <div *ngIf="availableProjects.length === 0" class="ion-text-center">
          <p>No available projects found.</p>
        </div>

        <div class="ion-padding">
          <ion-button
            expand="block"
            (click)="assignToProject()"
            [disabled]="!selectedProjectId || loading">
            Assign to Project
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    h2 {
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 600;
    }

    .subtitle {
      color: var(--ion-color-medium);
      margin: 0 0 20px 0;
    }

    ion-select {
      width: 100%;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
    IonSelect,
    IonSelectOption,
    IonSpinner
  ]
})
export class ClientProjectFormComponent implements OnInit {
  @Input() client!: Client;
  availableProjects: Project[] = [];
  selectedProjectId?: number;
  loading = true;
  error: string | null = null;

  constructor(
    private projectService: ProjectService,
    private modalController: ModalController,
    private toastController: ToastController
  ) {
    addIcons({ closeOutline });
  }

  ngOnInit() {
    this.loadProjects();
  }

  private loadProjects() {
    this.loading = true;
    this.error = null;

    this.projectService.getProjects().subscribe({
      next: (projects) => {
        // Filter out projects that are already assigned to this client
        const clientProjectIds = new Set(this.client.projects.map(p => p.projectId));
        this.availableProjects = projects.filter(p => !clientProjectIds.has(p.projectId));
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.error = 'Failed to load projects. Please try again later.';
        this.loading = false;
      }
    });
  }

  async assignToProject() {
    if (!this.selectedProjectId) return;

    try {
      await this.modalController.dismiss({
        projectId: this.selectedProjectId
      }, 'confirm');
    } catch (error) {
      console.error('Error assigning client to project:', error);
      this.showToast('Failed to assign client to project', 'danger');
    }
  }

  dismiss() {
    this.modalController.dismiss(null, 'cancel');
  }

  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
} 