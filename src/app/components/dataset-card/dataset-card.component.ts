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
  @Input() dataset!: Dataset;
  @Input() isSelected = false;
  
  hasImageError = false;
  isLoading = true;
  thumbnailUrl: string | SafeUrl = 'assets/images/default-dataset.png';
  defaultThumbnail = 'assets/images/default-dataset.png';

  constructor(
    private sanitizer: DomSanitizer,
    private modalCtrl: ModalController,
    private router: Router
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['dataset']) {
      this.updateThumbnail();
    }
  }

  private updateThumbnail() {
    this.isLoading = true;
    this.hasImageError = false;
    
    // Always use the server URL for thumbnails to avoid large base64 data in headers
    if (this.dataset?.datasetId) {
      this.thumbnailUrl = `${environment.apiUrl}/datasets/${this.dataset.datasetId}/thumbnail?t=${Date.now()}`;
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