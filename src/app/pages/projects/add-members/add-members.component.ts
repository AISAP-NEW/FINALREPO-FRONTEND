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
      <div *ngIf="loading" class="ion-text-center">
        <ion-spinner></ion-spinner>
        <p>Loading users...</p>
      </div>

      <ion-list *ngIf="!loading">
        <ion-item *ngFor="let user of availableUsers">
          <ion-checkbox 
            [(ngModel)]="user.selected" 
            [disabled]="isUserAlreadyMember(user)"
            slot="start">
          </ion-checkbox>
          <ion-label>
            <h2>{{ user.username }}</h2>
            <p>
              <ion-icon name="mail-outline"></ion-icon>
              {{ user.email }}
            </p>
            <p>
              <ion-icon name="person-outline"></ion-icon>
              {{ user.role }}
            </p>
          </ion-label>
          <ion-select
            *ngIf="user.selected"
            [(ngModel)]="user.assignedRole"
            label="Role"
            interface="popover">
            <ion-select-option value="Developer">Developer</ion-select-option>
            <ion-select-option value="LeadDeveloper">Lead Developer</ion-select-option>
          </ion-select>
        </ion-item>
      </ion-list>

      <div class="ion-padding-top">
        <ion-button expand="block" (click)="addSelectedMembers()" [disabled]="!hasSelectedUsers()">
          Add Selected Members
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    ion-item ion-label h2 {
      font-weight: 500;
      margin-bottom: 8px;
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

  private async loadUsers() {
    try {
      const users = await this.userService.getUsers().toPromise();
      if (users) {
        this.availableUsers = users.map(user => ({
          ...user,
          selected: false,
          assignedRole: 'Developer'
        }));
      } else {
        this.availableUsers = [];
      }
      this.loading = false;
    } catch (error) {
      console.error('Error loading users:', error);
      this.showToast('Failed to load users', 'danger');
      this.dismiss();
    }
  }

  isUserAlreadyMember(user: User): boolean {
    return this.project.members.some(member => member.userId === user.userId);
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

    // Show loading indicator
    const loading = await this.loadingController.create({
      message: 'Adding team members...',
      spinner: 'circular'
    });
    await loading.present();

    const selectedUsers = this.availableUsers.filter(user => user.selected);
    let hasErrors = false;
    let successCount = 0;
    
    try {
      // Process users sequentially to better handle errors
      for (const user of selectedUsers) {
        try {
          const response = await firstValueFrom(
            this.userService.directAssignToProject(
              this.project.projectId,
              user.userId,
              currentUser.userId,
              user.assignedRole || 'Developer'
            )
          );

          if (response.error) {
            console.warn(`Warning adding ${user.username}:`, response.error);
            hasErrors = true;
          } else {
            successCount++;
          }
        } catch (error: any) {
          console.error(`Error adding user ${user.username}:`, error);
          hasErrors = true;
        }
      }

      if (successCount === selectedUsers.length) {
        this.showToast('All team members added successfully', 'success');
        this.modalController.dismiss(true);
      } else if (successCount > 0) {
        this.showToast(`Added ${successCount} out of ${selectedUsers.length} members`, 'warning');
        this.modalController.dismiss(true);
      } else {
        this.showToast('Failed to add team members', 'danger');
      }
    } catch (error: any) {
      console.error('Error in add members process:', error);
      this.showToast('Failed to add team members', 'danger');
    } finally {
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
      color
    });
    await toast.present();
  }
} 