import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { RouterModule, Router } from '@angular/router';
import { Dataset } from '../../services/dataset.service';
import { IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { environment } from '../../../environments/environment';
import { DatasetActionsModalComponent } from '../dataset-actions-modal/dataset-actions-modal.component';
import { ModalController } from '@ionic/angular';

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
    IonSpinner
  ]
})
export class DatasetCardComponent implements OnChanges {
  getFullThumbnailUrl(_: string): string {
    if (this.dataset?.datasetId) {
      return `http://localhost:5183/api/Dataset/${this.dataset.datasetId}/thumbnail`;
    }
    return 'assets/images/default-dataset.png';
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
  @Input() dataset!: Dataset;
  @Input() isSelected = false;
  
  hasImageError = false;
  isLoading = true;
  thumbnailUrl: string | SafeUrl = 'assets/images/default-dataset.png';
  defaultThumbnail = 'assets/images/default-dataset.png';

  constructor(
    private sanitizer: DomSanitizer,
    private modalCtrl: ModalController,
    public router: Router
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['dataset']) {
      this.updateThumbnail();
    }
  }

  private updateThumbnail() {
    this.isLoading = true;
    this.hasImageError = false;

    if (this.dataset?.datasetId) {
      // Always use the backend thumbnail endpoint
      this.thumbnailUrl = `http://localhost:5183/api/Dataset/${this.dataset.datasetId}/thumbnail?t=${Date.now()}`;
    } else {
      this.thumbnailUrl = this.defaultThumbnail;
    }
  }

  onImageError() {
    this.hasImageError = true;
    this.thumbnailUrl = this.defaultThumbnail;
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
}