import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { RouterModule, Router } from '@angular/router';
import { Dataset } from '../../services/dataset.service';
import { IonIcon, IonSpinner, IonButton } from '@ionic/angular/standalone';
import { environment } from '../../../environments/environment';
import { DatasetActionsModalComponent } from '../dataset-actions-modal/dataset-actions-modal.component';
import { ModalController, AlertController, ToastController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-dataset-card',
  templateUrl: './dataset-card.component.html',
  styleUrls: ['./dataset-card.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    NgClass,
    RouterModule,
    IonIcon,
    IonSpinner,
    IonButton
  ]
})
export class DatasetCardComponent implements OnChanges {
  @Input() dataset!: Dataset;
  @Input() isSelected = false;
  @Output() datasetDeleted = new EventEmitter<string>();
  
  hasImageError = false;
  isLoading = true;
  defaultThumbnail = 'assets/images/default-dataset.png';

  constructor(
    private sanitizer: DomSanitizer,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private http: HttpClient,
    private toastService: ToastService,
    public router: Router
  ) {}

  getFullThumbnailUrl(thumbnailUrl?: string): string {
    // First check if we have base64 data (fastest option)
    if (this.dataset?.thumbnailBase64) {
      return `data:image/jpeg;base64,${this.dataset.thumbnailBase64}`;
    }
    
    // Fallback to HTTP endpoint if dataset has thumbnail
    if (this.dataset?.datasetId && this.dataset.hasThumbnail) {
      return `http://localhost:5183/api/Dataset/${this.dataset.datasetId}/thumbnail`;
    }
    
    // Default fallback
    return this.defaultThumbnail;
  }

  // Opens the DatasetOperationsModal for this dataset
  async openOperationsModal() {
    const modal = await this.modalCtrl.create({
      component: (await import('../dataset-operations-modal/dataset-operations-modal.component')).DatasetOperationsModal,
      componentProps: {
        datasetId: this.dataset.datasetId
      }
    });
    return modal.present();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['dataset']) {
      // Reset loading state when dataset changes
      this.isLoading = true;
      this.hasImageError = false;
    }
  }

  onImageError() {
    this.hasImageError = true;
    this.isLoading = false;
  }

  onImageLoad() {
    this.isLoading = false;
  }

  async onClick() {
    const modal = await this.modalCtrl.create({
      component: DatasetActionsModalComponent,
      componentProps: {
        dataset: this.dataset
      }
    });

    modal.onDidDismiss().then((data) => {
      if (data.data) {
        // Navigate to the selected action page
        this.router.navigate([data.data]);
      }
    });

    return modal.present();
  }

  getStatusClass() {
    return {
      'status-valid': this.dataset.isValidated,
      'status-invalid': !this.dataset.isValidated && this.dataset.validationStatus === 'error',
      'status-pending': !this.dataset.isValidated
    };
  }

  async editDataset() {
    console.log('Edit dataset clicked:', this.dataset.datasetName);
    // Navigate to edit page or open edit modal
    this.router.navigate(['/datasets', this.dataset.datasetId, 'edit']);
  }

  async deleteDataset() {
    console.log('Delete dataset clicked:', this.dataset.datasetName);
    const alert = await this.alertCtrl.create({
      header: 'Delete Dataset',
      message: `Are you sure you want to delete "${this.dataset.datasetName}"? This action cannot be undone.`,
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
            this.performDelete();
          }
        }
      ]
    });

    await alert.present();
  }

  private async performDelete() {
    try {
      // Get current user ID (you might need to adjust this based on your auth service)
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userId = currentUser.userId || currentUser.UserId || 1;

      const response = await this.http.delete<any>(
        `${environment.apiUrl}/api/Dataset/${this.dataset.datasetId}?userId=${userId}`
      ).toPromise();

      this.toastService.presentToast('success', 'Dataset deleted successfully!');
      
      // Emit an event to refresh the dataset list
      // You might need to implement an event emitter or service to refresh the parent component
      this.datasetDeleted.emit(this.dataset.datasetId);
    } catch (error: any) {
      console.error('Error deleting dataset:', error);
      const errorMessage = error?.error?.message || 'Failed to delete dataset. Please try again.';
      this.toastService.presentToast('error', errorMessage);
    }
  }
}