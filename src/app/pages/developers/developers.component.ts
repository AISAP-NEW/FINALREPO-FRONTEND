import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
  IonSpinner,
  IonButtons,
  IonSearchbar,
  IonModal,
  AlertController,
  ModalController,
  ToastController,
  IonChip
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline,
  peopleOutline,
  addOutline,
  closeOutline,
  searchOutline,
  trashOutline,
  checkmarkOutline,
  alertCircleOutline,
  mailOutline,
  briefcaseOutline,
  codeSlashOutline
} from 'ionicons/icons';
import { UserService, User, UserWithProjects } from '../../services/user.service';
import { Project } from '../../services/project.service';
import { AssignToProjectComponent } from './assign-to-project/assign-to-project.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-developers',
  templateUrl: './developers.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonSpinner,
    IonButtons,
    IonSearchbar,
    IonModal,
    IonChip
  ]
})
export class DevelopersComponent implements OnInit {
  loading = true;
  error: string | null = null;
  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm = '';
  selectedUser: UserWithProjects | null = null;

  constructor(
    private userService: UserService,
    private modalController: ModalController,
    private alertController: AlertController,
    private authService: AuthService,
    private toastController: ToastController
  ) {
    addIcons({
      personOutline,
      mailOutline,
      briefcaseOutline,
      peopleOutline,
      closeOutline,
      codeSlashOutline,
      addOutline,
      trashOutline,
      searchOutline,
      alertCircleOutline
    });
  }

  ngOnInit() {
    this.loadUsers();
  }

  private async loadUsers() {
    this.loading = true;
    this.error = null;

    try {
      const users = await this.userService.getUsers().toPromise();
      console.log('Loaded users:', users);
      this.users = users || [];
      this.filterUsers();
    } catch (error: any) {
      console.error('Error loading users:', error);
      this.error = error.message || 'Failed to load users. Please try again later.';
    } finally {
      this.loading = false;
    }
  }

  handleSearch(event: any) {
    this.filterUsers();
  }

  private filterUsers() {
    if (!this.searchTerm?.trim()) {
      this.filteredUsers = [...this.users];
      return;
    }

    const searchTermLower = this.searchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(user =>
      user.username.toLowerCase().includes(searchTermLower) ||
      user.email.toLowerCase().includes(searchTermLower) ||
      user.role.toLowerCase().includes(searchTermLower)
    );
  }

  getRoleColor(role: string): string {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'danger';
      case 'leaddeveloper':
      case 'lead developer':
        return 'warning';
      case 'developer':
        return 'primary';
      default:
        return 'medium';
    }
  }

  async showUserDetails(user: User) {
    this.loading = true;
    try {
      const userWithProjects = await this.userService.getUserWithProjects(user.userId).toPromise();
      console.log('User details:', userWithProjects);
      this.selectedUser = userWithProjects || {
        ...user,
        projects: []
      };
    } catch (error: any) {
      console.error('Error loading user details:', error);
      this.showToast(error.message || 'Failed to load user details', 'danger');
    } finally {
      this.loading = false;
    }
  }

  closeUserDetails() {
    this.selectedUser = null;
  }

  async openAssignToProject(user: User) {
    const modal = await this.modalController.create({
      component: AssignToProjectComponent,
      componentProps: {
        user: user
      },
      cssClass: 'modal-full-height'
    });

    modal.onDidDismiss().then((result) => {
      if (result.role === 'confirm') {
        this.loadUsers(); // Refresh the list
      }
    });

    await modal.present();
  }

  canDeleteUser(user: User): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.role?.toLowerCase() === 'admin' && 
           user.userId !== currentUser.userId;
  }

  async confirmDelete(user: User) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete ${user.username}? This action cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
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
      this.showToast('User deleted successfully', 'success');
      this.loadUsers(); // Refresh the list
    } catch (error: any) {
      console.error('Error deleting user:', error);
      this.showToast(error.message || 'Failed to delete user', 'danger');
    }
  }

  private async showToast(message: string, color: 'success' | 'danger') {
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