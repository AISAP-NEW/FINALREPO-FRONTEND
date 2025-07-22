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
  IonMenuButton,
  IonSearchbar,
  IonBadge,
  AlertController,
  ModalController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  businessOutline,
  mailOutline,
  callOutline,
  peopleOutline,
  createOutline,
  trashOutline,
  linkOutline,
  eyeOutline,
  locationOutline,
  searchOutline,
  alertCircleOutline
} from 'ionicons/icons';
import { ClientService, Client } from '../../services/client.service';
import { ClientFormComponent } from './client-form/client-form.component';
import { ClientDetailsComponent } from './client-details/client-details.component';
import { ClientProjectFormComponent } from './client-project-form/client-project-form.component';

@Component({
  selector: 'app-clients',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Clients</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="openNewClientModal()">
            <ion-icon name="add-outline" slot="start"></ion-icon>
            New Client
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          [(ngModel)]="searchTerm"
          (ionInput)="filterClients()"
          placeholder="Search clients..."
          [debounce]="300"
          animated="true"
          show-clear-button="always">
        </ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Loading State -->
      <div *ngIf="loading" class="ion-padding ion-text-center">
        <ion-spinner></ion-spinner>
        <p>Loading clients...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="ion-padding">
        <ion-item color="danger">
          <ion-icon name="alert-circle-outline" slot="start"></ion-icon>
          <ion-label>{{ error }}</ion-label>
        </ion-item>
      </div>

      <!-- Data State -->
      <div *ngIf="!loading && !error" class="ion-padding">
        <ion-list *ngIf="filteredClients.length > 0">
          <ion-item *ngFor="let client of filteredClients" class="client-item">
            <ion-icon name="business-outline" slot="start" color="primary"></ion-icon>
            <ion-label class="ion-text-wrap">
              <h2>{{ client.name }}</h2>
              <p>
                <ion-icon name="mail-outline"></ion-icon>
                {{ client.email }}
              </p>
              <p>
                <ion-icon name="call-outline"></ion-icon>
                {{ client.telephoneNumber }}
              </p>
              <p>
                <ion-icon name="location-outline"></ion-icon>
                {{ client.address }}
              </p>
              <div class="project-count">
                <ion-icon name="people-outline"></ion-icon>
                <ion-badge color="primary">{{ client.projects.length || 0 }} Projects</ion-badge>
              </div>
            </ion-label>
            <div class="action-buttons" slot="end">
              <ion-button fill="clear" color="primary" (click)="viewClient(client)">
                <ion-icon name="eye-outline" slot="icon-only"></ion-icon>
              </ion-button>
              <ion-button fill="clear" color="primary" (click)="editClient(client)">
                <ion-icon name="create-outline" slot="icon-only"></ion-icon>
              </ion-button>
              <ion-button fill="clear" color="primary" (click)="addToProject(client)">
                <ion-icon name="link-outline" slot="icon-only"></ion-icon>
              </ion-button>
              <ion-button fill="clear" color="danger" (click)="confirmDelete(client)">
                <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
              </ion-button>
            </div>
          </ion-item>
        </ion-list>

        <!-- Empty State -->
        <div *ngIf="filteredClients.length === 0" class="ion-text-center ion-padding">
          <p>No clients found. Click the "New Client" button to create one.</p>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .client-item {
      --padding-start: 16px;
      --padding-end: 16px;
      --padding-top: 12px;
      --padding-bottom: 12px;
      margin-bottom: 8px;
      border-radius: 8px;
      --background: var(--ion-color-light);
    }

    ion-label h2 {
      font-weight: bold;
      margin-bottom: 8px;
      font-size: 18px;
      color: var(--ion-color-dark);
    }

    ion-label p {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 4px 0;
      color: var(--ion-color-medium);
    }

    ion-label p ion-icon {
      font-size: 16px;
      min-width: 16px;
      color: var(--ion-color-medium);
    }

    .project-count {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
    }

    .action-buttons {
      display: flex;
      gap: 4px;
    }

    ion-searchbar {
      --background: var(--ion-background-color);
      padding: 0 16px;
      --box-shadow: none;
      --border-radius: 8px;
    }

    ion-searchbar::part(container) {
      border: 1px solid var(--ion-color-medium-shade);
    }

    ion-badge {
      --padding-start: 8px;
      --padding-end: 8px;
    }

    :host ::ng-deep .modal-full-height {
      --height: 90%;
      --width: 90%;
      --max-width: 600px;
      --border-radius: 16px;
    }
  `],
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
    IonMenuButton,
    IonSearchbar,
    IonBadge
  ]
})
export class ClientsComponent implements OnInit {
  clients: Client[] = [];
  filteredClients: Client[] = [];
  loading = true;
  error: string | null = null;
  searchTerm = '';

  constructor(
    private clientService: ClientService,
    private alertController: AlertController,
    private modalController: ModalController,
    private toastController: ToastController
  ) {
    addIcons({
      addOutline,
      businessOutline,
      mailOutline,
      callOutline,
      peopleOutline,
      createOutline,
      trashOutline,
      linkOutline,
      eyeOutline,
      locationOutline,
      searchOutline,
      alertCircleOutline
    });
  }

  ngOnInit() {
    this.loadClients();
  }

  loadClients() {
    this.loading = true;
    this.error = null;

    this.clientService.getClients().subscribe({
      next: (clients) => {
        console.log('Loaded clients:', clients);
        this.clients = clients;
        this.filterClients();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading clients:', error);
        this.error = error.message || 'Failed to load clients. Please try again later.';
        this.loading = false;
      }
    });
  }

  filterClients() {
    if (!this.searchTerm?.trim()) {
      this.filteredClients = [...this.clients];
      return;
    }

    const searchTermLower = this.searchTerm.toLowerCase();
    this.filteredClients = this.clients.filter(client =>
      client.name.toLowerCase().includes(searchTermLower) ||
      client.email.toLowerCase().includes(searchTermLower) ||
      client.telephoneNumber.toLowerCase().includes(searchTermLower) ||
      client.address.toLowerCase().includes(searchTermLower)
    );
  }

  async openNewClientModal() {
    const modal = await this.modalController.create({
      component: ClientFormComponent,
      componentProps: {
        mode: 'create'
      },
      cssClass: 'modal-full-height'
    });

    modal.onDidDismiss().then((result) => {
      if (result.role === 'confirm' && result.data) {
        this.clientService.createClient(result.data).subscribe({
          next: (createdClient) => {
            console.log('Created client:', createdClient);
            this.showToast('Client created successfully', 'success');
            this.loadClients();
          },
          error: (error) => {
            console.error('Error creating client:', error);
            this.showToast(error.message || 'Failed to create client', 'danger');
          }
        });
      }
    });

    await modal.present();
  }

  async viewClient(client: Client) {
    const modal = await this.modalController.create({
      component: ClientDetailsComponent,
      componentProps: {
        client: client
      },
      cssClass: 'modal-full-height'
    });
    await modal.present();
  }

  async editClient(client: Client) {
    const modal = await this.modalController.create({
      component: ClientFormComponent,
      componentProps: {
        client: client,
        mode: 'edit'
      },
      cssClass: 'modal-full-height'
    });

    modal.onDidDismiss().then((result) => {
      if (result.data) {
        this.clientService.updateClient(client.clientId, result.data).subscribe({
          next: () => {
            this.showToast('Client updated successfully', 'success');
            this.loadClients();
          },
          error: (error) => {
            console.error('Error updating client:', error);
            this.showToast(error.message || 'Failed to update client', 'danger');
          }
        });
      }
    });

    await modal.present();
  }

  async addToProject(client: Client) {
    const modal = await this.modalController.create({
      component: ClientProjectFormComponent,
      componentProps: {
        client: client
      },
      cssClass: 'modal-full-height'
    });

    modal.onDidDismiss().then((result) => {
      if (result.data) {
        this.clientService.assignProjectToClient(client.clientId, result.data.projectId).subscribe({
          next: () => {
            this.showToast('Project assigned successfully', 'success');
            this.loadClients();
          },
          error: (error) => {
            console.error('Error assigning project:', error);
            this.showToast(error.message || 'Failed to assign project', 'danger');
          }
        });
      }
    });

    await modal.present();
  }

  async confirmDelete(client: Client) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete ${client.name}? This action cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.deleteClient(client);
          }
        }
      ]
    });

    await alert.present();
  }

  private async deleteClient(client: Client) {
    try {
      await this.clientService.deleteClient(client.clientId).toPromise();
      this.showToast('Client deleted successfully', 'success');
      this.loadClients();
    } catch (error: any) {
      console.error('Error deleting client:', error);
      this.showToast(error.message || 'Failed to delete client', 'danger');
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