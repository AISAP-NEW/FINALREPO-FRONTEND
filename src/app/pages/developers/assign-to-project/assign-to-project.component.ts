import { Component, Input, OnInit } from '@angular/core';
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
  IonButtons,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  ModalController,
  ToastController,
  LoadingController,
  IonChip
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, briefcaseOutline, peopleOutline, codeOutline } from 'ionicons/icons';
import { ProjectService, Project } from '../../../services/project.service';
import { UserService, User } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-assign-to-project',
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
      <div class="user-info">
        <h2>{{ user.username }}</h2>
        <ion-chip [color]="getRoleColor(user.role)">
          {{ user.role }}
        </ion-chip>
      </div>

      <div *ngIf="loading" class="ion-text-center">
        <ion-spinner></ion-spinner>
        <p>Loading projects...</p>
      </div>

      <ion-list *ngIf="!loading">
        <ion-item *ngFor="let project of availableProjects">
          <ion-label>
            <h2>{{ project.name }}</h2>
            <p>
              <ion-icon name="code-outline"></ion-icon>
              {{ project.technologies }}
            </p>
            <p>
              <ion-icon name="people-outline"></ion-icon>
              {{ project.members.length }} members
            </p>
          </ion-label>
          <ion-select
            [(ngModel)]="project.selectedRole"
            label="Role"
            interface="popover"
            (ionChange)="roleSelected(project)">
            <ion-select-option value="">Select Role</ion-select-option>
            <ion-select-option value="Developer">Developer</ion-select-option>
            <ion-select-option value="LeadDeveloper">Lead Developer</ion-select-option>
          </ion-select>
          <ion-button
            slot="end"
            fill="clear"
            color="primary"
            [disabled]="!project.selectedRole"
            (click)="assignToProject(project)">
            Assign
          </ion-button>
        </ion-item>

        <div *ngIf="availableProjects.length === 0" class="ion-text-center ion-padding">
          <p>No available projects found</p>
        </div>
      </ion-list>
    </ion-content>
  `,
  styles: [`
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }
    .user-info h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    }
    ion-item ion-label h2 {
      font-weight: 500;
      margin-bottom: 4px;
    }
    ion-item ion-label p {
      display: flex;
      align-items: center;
      gap: 4px;
      margin: 4px 0;
    }
    ion-item ion-label p ion-icon {
      color: var(--ion-color-medium);
      font-size: 16px;
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
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonButtons,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonChip
  ]
})
export class AssignToProjectComponent implements OnInit {
  @Input() user!: User;
  loading = true;
  availableProjects: (Project & { selectedRole?: string })[] = [];

  constructor(
    private projectService: ProjectService,
    private userService: UserService,
    private modalController: ModalController,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private authService: AuthService
  ) {
    addIcons({
      closeOutline,
      briefcaseOutline,
      peopleOutline,
      codeOutline
    });
  }

  ngOnInit() {
    this.loadProjects();
  }

  private async loadProjects() {
    try {
      const projects = await this.projectService.getProjects().toPromise() || [];
      // Filter out projects where user is already a member
      this.availableProjects = projects
        .filter(project => !project.members.some(member => member.userId === this.user.userId))
        .map(project => ({
          ...project,
          selectedRole: ''
        }));
      this.loading = false;
    } catch (error) {
      console.error('Error loading projects:', error);
      this.showToast('Failed to load projects', 'danger');
      this.dismiss();
    }
  }

  roleSelected(project: Project & { selectedRole?: string }) {
    // This method can be used to add additional logic when a role is selected
    console.log('Selected role for project:', project.name, project.selectedRole);
  }

  async assignToProject(project: Project & { selectedRole?: string }) {
    if (!project.selectedRole) {
      this.showToast('Please select a role', 'warning');
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.showToast('No user logged in', 'danger');
      return;
    }

    if (currentUser.role !== 'LeadDeveloper') {
      this.showToast('Only Lead Developers can assign users to projects', 'danger');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Assigning to project...',
      spinner: 'circular'
    });
    await loading.present();

    try {
      const response = await this.userService.directAssignToProject(
        project.projectId,
        this.user.userId,
        currentUser.userId,
        project.selectedRole
      ).toPromise();

      if (response?.error) {
        this.showToast(response.error, 'danger');
      } else {
        this.showToast('Successfully assigned to project', 'success');
        this.modalController.dismiss(true);
      }
    } catch (error) {
      console.error('Error assigning to project:', error);
      this.showToast('Failed to assign to project', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  getRoleColor(role: string): string {
    switch (role.toLowerCase()) {
      case 'leaddeveloper':
        return 'primary';
      case 'developer':
        return 'success';
      case 'client':
        return 'warning';
      case 'projectmanager':
        return 'tertiary';
      default:
        return 'medium';
    }
  }

  dismiss() {
    this.modalController.dismiss();
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color
    });
    await toast.present();
  }
} 