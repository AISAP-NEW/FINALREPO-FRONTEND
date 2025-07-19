import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  IonCheckbox,
  IonButtons,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  ModalController,
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, personOutline, mailOutline } from 'ionicons/icons';
import { UserService, User, DirectAssignResponse } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { Project } from '../../../services/project.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-add-members',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Add Team Members</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div *ngIf="loading" class="ion-text-center ion-padding">
        <ion-spinner></ion-spinner>
        <p>Loading users...</p>
      </div>

      <div *ngIf="error" class="ion-text-center ion-padding error-container">
        <p class="error-message">{{ error }}</p>
        <ion-button (click)="loadUsers()">Retry</ion-button>
      </div>

      <ion-list *ngIf="!loading && !error">
        <ion-item *ngFor="let user of availableUsers" class="user-item">
          <ion-checkbox 
            [(ngModel)]="user.selected" 
            [disabled]="isUserAlreadyMember(user)"
            slot="start">
          </ion-checkbox>
          <ion-label>
            <h2>{{ user.username || user.Username }}</h2>
            <p>
              <ion-icon name="mail-outline"></ion-icon>
              {{ user.email || user.Email }}
            </p>
            <p>
              <ion-icon name="person-outline"></ion-icon>
              {{ user.role || user.Role }}
            </p>
          </ion-label>
          <ion-select
            *ngIf="user.selected"
            [(ngModel)]="user.assignedRole"
            label="Role"
            interface="popover"
            class="role-select">
            <ion-select-option value="Developer">Developer</ion-select-option>
            <ion-select-option value="LeadDeveloper">Lead Developer</ion-select-option>
          </ion-select>
        </ion-item>

        <div *ngIf="availableUsers.length === 0" class="ion-text-center ion-padding">
          <p>No users available to add</p>
        </div>
      </ion-list>

      <div class="ion-padding-top">
        <ion-button 
          expand="block" 
          (click)="addSelectedMembers()" 
          [disabled]="!hasSelectedUsers() || loading"
          class="add-button">
          <ion-spinner *ngIf="submitting"></ion-spinner>
          <span *ngIf="!submitting">Add Selected Members</span>
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .user-item {
      --padding-start: 16px;
      --padding-end: 16px;
      --padding-top: 12px;
      --padding-bottom: 12px;
      margin-bottom: 8px;
      border-radius: 8px;
      --background: var(--ion-color-light);
    }
    ion-item ion-label h2 {
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--ion-color-dark);
    }
    ion-item ion-label p {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 4px 0;
      color: var(--ion-color-medium);
    }
    ion-item ion-label p ion-icon {
      color: var(--ion-color-medium);
      font-size: 16px;
    }
    .role-select {
      max-width: 150px;
    }
    .error-container {
      padding: 20px;
    }
    .error-message {
      color: var(--ion-color-danger);
      margin-bottom: 16px;
    }
    .add-button {
      margin-top: 20px;
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
    IonCheckbox,
    IonButtons,
    IonSelect,
    IonSelectOption,
    IonSpinner
  ]
})
export class AddMembersComponent implements OnInit {
  @Input() project!: Project;
  loading = true;
  submitting = false;
  error: string | null = null;
  availableUsers: (User & { selected?: boolean; assignedRole?: string })[] = [];

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private modalController: ModalController,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    addIcons({
      closeOutline,
      personOutline,
      mailOutline
    });
  }

  ngOnInit() {
    this.loadUsers();
  }

  async loadUsers() {
    this.loading = true;
    this.error = null;
    
    try {
      const users = await firstValueFrom(this.userService.getUsers());
      this.availableUsers = users.map(user => ({
        ...user,
        selected: false,
        assignedRole: 'Developer'
      }));
      this.loading = false;
    } catch (error: any) {
      console.error('Error loading users:', error);
      this.error = error.message || 'Failed to load users';
      this.loading = false;
    }
  }

  isUserAlreadyMember(user: User): boolean {
    return this.project.members.some(member => 
      member.userId === (user.userId || user.UserId)
    );
  }

  hasSelectedUsers(): boolean {
    return this.availableUsers.some(user => user.selected);
  }

  async addSelectedMembers() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.showToast('No user logged in', 'danger');
      return;
    }

    this.submitting = true;

    // Show loading indicator
    const loading = await this.loadingController.create({
      message: 'Adding team members...',
      spinner: 'circular'
    });
    await loading.present();

    const selectedUsers = this.availableUsers.filter(user => user.selected);
    let successCount = 0;
    let errorMessages: string[] = [];
    
    try {
      // Process users sequentially to better handle errors
      for (const user of selectedUsers) {
        try {
          const result = await firstValueFrom(
            this.userService.directAssignToProject(
              this.project.projectId,
              user.userId || user.UserId || 0,
              currentUser.userId || currentUser.UserId || 0,
              user.assignedRole || 'Developer'
            )
          );
          
          // If we got here, it was successful
          successCount++;
          console.log(`Successfully added user ${user.username || user.Username}:`, result);
        } catch (error: any) {
          console.error(`Error adding user ${user.username || user.Username}:`, error);
          errorMessages.push(`Failed to add ${user.username || user.Username}: ${error.message}`);
        }
      }

      // Handle results
      if (successCount === selectedUsers.length) {
        this.showToast('All team members added successfully', 'success');
        this.modalController.dismiss(true);
      } else if (successCount > 0) {
        // Some succeeded, some failed
        const message = `Added ${successCount} out of ${selectedUsers.length} members. ${errorMessages.length ? '\n' + errorMessages.join('\n') : ''}`;
        this.showToast(message, 'warning');
        this.modalController.dismiss(true);
      } else {
        // All failed
        const message = `Failed to add team members: ${errorMessages.join('\n')}`;
        this.showToast(message, 'danger');
      }
    } catch (error: any) {
      console.error('Error in add members process:', error);
      this.showToast(error.message || 'Failed to add team members', 'danger');
    } finally {
      this.submitting = false;
      await loading.dismiss();
    }
  }

  dismiss() {
    this.modalController.dismiss();
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
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
} 