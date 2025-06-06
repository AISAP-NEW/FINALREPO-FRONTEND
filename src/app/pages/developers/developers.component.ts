import { Component, OnInit } from '@angular/core';
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
  IonIcon,
  IonSpinner,
  IonChip,
  IonModal,
  IonButtons,
  IonButton,
  ModalController,
  AlertController,
  IonSearchbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline,
  mailOutline,
  briefcaseOutline,
  peopleOutline,
  closeOutline,
  codeOutline,
  addOutline,
  trashOutline,
  searchOutline
} from 'ionicons/icons';
import { UserService, User, UserWithProjects } from '../../services/user.service';
import { Project } from '../../services/project.service';
import { AssignToProjectComponent } from './assign-to-project/assign-to-project.component';
import { AuthService } from '../../services/auth.service';
import type { OverlayEventDetail } from '@ionic/core';

@Component({
  selector: 'app-developers',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Developers</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-searchbar
        [(ngModel)]="searchTerm"
        (ionInput)="handleSearch($event)"
        placeholder="Search developers..."
        [animated]="true"
        showClearButton="focus">
      </ion-searchbar>

      <div *ngIf="loading" class="ion-text-center">
        <ion-spinner></ion-spinner>
        <p>Loading developers...</p>
      </div>

      <ion-list *ngIf="!loading">
        <ion-item *ngFor="let user of filteredUsers" [button]="true" (click)="showUserDetails(user)">
          <ion-icon slot="start" name="person-outline"></ion-icon>
          <ion-label>
            <h2>{{ user.username }}</h2>
            <p>
              <ion-icon name="mail-outline"></ion-icon>
              {{ user.email }}
            </p>
          </ion-label>
          <ion-chip [color]="getRoleColor(user.role)" slot="end">
            {{ user.role }}
          </ion-chip>
          <ion-button 
            slot="end" 
            fill="clear" 
            color="primary"
            (click)="openAssignToProject(user); $event.stopPropagation()">
            <ion-icon name="add-outline"></ion-icon>
          </ion-button>
          <ion-button 
            slot="end" 
            fill="clear" 
            color="danger"
            *ngIf="canDeleteUser(user)"
            (click)="confirmDelete(user); $event.stopPropagation()">
            <ion-icon name="trash-outline"></ion-icon>
          </ion-button>
        </ion-item>
      </ion-list>

      <div *ngIf="!loading && filteredUsers.length === 0" class="ion-text-center ion-padding">
        <p *ngIf="searchTerm">No developers found matching "{{ searchTerm }}"</p>
        <p *ngIf="!searchTerm">No developers found</p>
      </div>

      <!-- User Details Modal -->
      <ion-modal [isOpen]="!!selectedUser">
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>Developer Details</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="closeUserDetails()">
                  <ion-icon name="close-outline"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>

          <ion-content class="ion-padding" *ngIf="selectedUser">
            <div class="user-header">
              <ion-icon name="person-outline" size="large"></ion-icon>
              <h1>{{ selectedUser.username }}</h1>
              <ion-chip [color]="getRoleColor(selectedUser.role)">
                {{ selectedUser.role }}
              </ion-chip>
            </div>

            <ion-list>
              <ion-item>
                <ion-icon name="mail-outline" slot="start"></ion-icon>
                <ion-label>
                  <h2>Email</h2>
                  <p>{{ selectedUser.email }}</p>
                </ion-label>
              </ion-item>

              <ion-item lines="none">
                <ion-icon name="briefcase-outline" slot="start"></ion-icon>
                <ion-label>
                  <h2>Projects</h2>
                </ion-label>
              </ion-item>

              <div *ngIf="selectedUser.projects?.length === 0" class="ion-padding ion-text-center">
                <p>Not assigned to any projects</p>
              </div>

              <ion-item *ngFor="let project of selectedUser.projects" lines="none" class="project-item">
                <ion-label>
                  <h3>{{ project.name }}</h3>
                  <p>
                    <ion-icon name="code-outline"></ion-icon>
                    {{ project.technologies }}
                  </p>
                  <p>
                    <ion-chip color="tertiary" size="small">
                      <ion-icon name="people-outline"></ion-icon>
                      <ion-label>{{ project.members.length }} members</ion-label>
                    </ion-chip>
                  </p>
                </ion-label>
                <div slot="end" class="project-status">
                  <ion-chip [color]="project.isActive ? 'success' : 'medium'" class="role-chip">
                    {{ project.role }}
                  </ion-chip>
                  <ion-chip [color]="project.isActive ? 'success' : 'medium'" class="status-chip">
                    {{ project.isActive ? 'Active' : 'Inactive' }}
                  </ion-chip>
                </div>
              </ion-item>
            </ion-list>
          </ion-content>
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
  styles: [`
    .user-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      margin-bottom: 24px;
      text-align: center;
    }
    .user-header ion-icon {
      font-size: 48px;
      color: var(--ion-color-medium);
    }
    .user-header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: bold;
    }
    ion-item ion-label h2 {
      font-weight: 500;
      margin-bottom: 4px;
    }
    ion-item ion-label p {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .project-item {
      margin-left: 16px;
    }
    .project-item ion-label h3 {
      font-weight: 500;
      margin-bottom: 8px;
    }
    ion-item ion-icon[slot="start"] {
      color: var(--ion-color-medium);
      font-size: 24px;
    }
    .project-status {
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: flex-end;
    }
    .role-chip {
      margin: 0;
    }
    .status-chip {
      margin: 0;
      font-size: 0.8em;
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
    IonIcon,
    IonSpinner,
    IonChip,
    IonModal,
    IonButtons,
    IonButton,
    AssignToProjectComponent,
    IonSearchbar
  ]
})
export class DevelopersComponent implements OnInit {
  loading = true;
  users: User[] = [];
  filteredUsers: User[] = [];
  selectedUser: UserWithProjects | null = null;
  searchTerm: string = '';

  constructor(
    private userService: UserService,
    private modalController: ModalController,
    private alertController: AlertController,
    private authService: AuthService
  ) {
    addIcons({
      personOutline,
      mailOutline,
      briefcaseOutline,
      peopleOutline,
      closeOutline,
      codeOutline,
      addOutline,
      trashOutline,
      searchOutline
    });
  }

  ngOnInit() {
    this.loadUsers();
  }

  private async loadUsers() {
    try {
      this.users = await this.userService.getUsers().toPromise() || [];
      this.filteredUsers = this.users;
      this.loading = false;
    } catch (error) {
      console.error('Error loading users:', error);
      this.loading = false;
    }
  }

  handleSearch(event: any) {
    const searchTerm = event.target.value.toLowerCase();
    this.searchTerm = searchTerm;
    
    if (!searchTerm) {
      this.filteredUsers = this.users;
      return;
    }

    this.filteredUsers = this.users.filter(user => {
      const searchableFields = [
        user.username,
        user.email,
        user.role
      ].map(field => field?.toLowerCase() || '');

      // Split search term into words for multi-term search
      const searchTerms = searchTerm.split(' ').filter((term: string) => term.length > 0);

      // Check if all search terms are found in any of the searchable fields
      return searchTerms.every((term: string) =>
        searchableFields.some(field => field.includes(term))
      );
    });
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

  async showUserDetails(user: User) {
    try {
      const userWithProjects = await this.userService.getUserWithProjects(user.userId).toPromise();
      console.log('API Response:', userWithProjects); // Debug log
      
      if (userWithProjects) {
        // Ensure projects array exists and log it
        console.log('Projects before assignment:', userWithProjects.projects); // Debug log
        this.selectedUser = {
          ...userWithProjects,
          projects: userWithProjects.projects || []
        };
        console.log('Selected user after assignment:', this.selectedUser); // Debug log
      } else {
        console.log('No user data returned from API'); // Debug log
        this.selectedUser = {
          ...user,
          projects: []
        };
      }
    } catch (error) {
      console.error('Error loading user projects:', error);
      this.selectedUser = {
        ...user,
        projects: []
      };
    }
  }

  closeUserDetails() {
    this.selectedUser = null;
  }

  async openAssignToProject(user: User) {
    const modal = await this.modalController.create({
      component: AssignToProjectComponent,
      componentProps: {
        user
      }
    });

    modal.onDidDismiss().then((result: OverlayEventDetail) => {
      if (result.data) {
        // Refresh user data if they were assigned to a project
        this.loadUsers();
        if (this.selectedUser?.userId === user.userId) {
          this.showUserDetails(user);
        }
      }
    });

    await modal.present();
  }

  canDeleteUser(user: User): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    
    // Only Lead Developers can delete users
    if (currentUser.role !== 'LeadDeveloper') return false;
    
    // Cannot delete yourself
    if (currentUser.userId === user.userId) return false;
    
    // Cannot delete other Lead Developers
    if (user.role === 'LeadDeveloper') return false;
    
    return true;
  }

  async confirmDelete(user: User) {
    const alert = await this.alertController.create({
      header: 'Confirm Deletion',
      message: `Are you sure you want to delete ${user.username}? This action cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.deleteUser(user);
          }
        }
      ]
    });

    await alert.present();
  }

  private async deleteUser(user: User) {
    try {
      await this.userService.deleteUser(user.userId).toPromise();
      this.users = this.users.filter(u => u.userId !== user.userId);
      
      // If the deleted user is currently selected, close the details modal
      if (this.selectedUser?.userId === user.userId) {
        this.selectedUser = null;
      }
      
      // Show success message
      const alert = await this.alertController.create({
        header: 'Success',
        message: `${user.username} has been deleted successfully.`,
        buttons: ['OK']
      });
      await alert.present();
    } catch (error) {
      console.error('Error deleting user:', error);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Failed to delete user. Please try again.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }
} 