import { Component, Input, OnChanges, SimpleChanges, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { RouterModule, Router } from '@angular/router';
import { Dataset } from '../../services/dataset.service';
import { IonIcon, IonSpinner, IonButton } from '@ionic/angular/standalone';
import { environment } from '../../../environments/environment';
import { DatasetActionsModalComponent } from '../dataset-actions-modal/dataset-actions-modal.component';
import { ModalController } from '@ionic/angular';
import { Subject, fromEvent, debounceTime, takeUntil } from 'rxjs';
import { ThumbnailService } from '../../services/thumbnail.service';

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
export class DatasetCardComponent implements OnChanges, OnInit, OnDestroy {
  @Input() dataset!: Dataset;
  @Input() isSelected = false;
  @Output() datasetDeleted = new EventEmitter<string>();
  
  hasImageError = false;
  isLoading = true;
  thumbnailUrl: string | SafeUrl = 'assets/images/default-dataset.png';
  defaultThumbnail = 'assets/images/default-dataset.png';
  isInViewport = false;
  private destroy$ = new Subject<void>();

  constructor(
    private sanitizer: DomSanitizer,
    private modalCtrl: ModalController,
    public router: Router,
    private thumbnailService: ThumbnailService
  ) {}

  ngOnInit() {
    // Set up intersection observer for lazy loading
    this.setupIntersectionObserver();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['dataset']) {
      this.updateThumbnail();
    }
  }

  private setupIntersectionObserver() {
    // Use Intersection Observer for lazy loading
    const options = {
      root: null,
      rootMargin: '100px', // Start loading 100px before entering viewport
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.isInViewport = true;
          this.loadThumbnailIfNeeded();
          observer.unobserve(entry.target);
        }
      });
    }, options);

    // Observe this component's element
    setTimeout(() => {
      const element = document.querySelector(`[data-dataset-id="${this.dataset?.datasetId}"]`);
      if (element) {
        observer.observe(element);
      }
    }, 100);
  }

  private loadThumbnailIfNeeded() {
    if (this.isInViewport && this.isLoading && this.dataset?.datasetId) {
      this.updateThumbnail();
    }
  }

  getFullThumbnailUrl(_: string): string {
    if (this.dataset?.datasetId) {
      return this.thumbnailService.getThumbnailUrl(this.dataset.datasetId);
    }
    return 'assets/images/default-dataset.png';
  }

  private async updateThumbnail() {
    this.isLoading = true;
    this.hasImageError = false;

    if (this.dataset?.datasetId) {
      try {
        // Check if already cached
        const cachedUrl = this.thumbnailService.getCachedThumbnailUrl(this.dataset.datasetId);
        if (cachedUrl) {
          this.thumbnailUrl = cachedUrl;
          this.isLoading = false;
          return;
        }

        // Use the thumbnail service to load with optimization
        const thumbnailUrl = await this.thumbnailService.preloadThumbnail(this.dataset.datasetId);
        this.thumbnailUrl = thumbnailUrl;
        this.isLoading = false;
      } catch (error) {
        console.warn(`Failed to load thumbnail for dataset ${this.dataset.datasetId}:`, error);
        this.onImageError();
      }
    } else {
      this.thumbnailUrl = this.defaultThumbnail;
      this.isLoading = false;
    }
  }

  onImageError() {
    this.hasImageError = true;
    this.thumbnailUrl = this.defaultThumbnail;
    this.isLoading = false;
  }

  onImageLoad() {
    this.isLoading = false;
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

  editDataset() {
    // Navigate to details or edit route (fallback to details if edit not available)
    const id = this.dataset?.datasetId;
    if (id) {
      this.router.navigate(['/datasets', id, 'details']);
    }
  }

  deleteDataset() {
    // Emit deletion event for parent to handle actual deletion
    const id = this.dataset?.datasetId;
    if (id) {
      this.datasetDeleted.emit(id);
    }
  }

  getStatusClass(): string {
    const status = this.dataset.validationStatus?.toLowerCase() || 'pending';
    switch (status) {
      case 'validated':
        return 'status-validated';
      case 'invalid':
        return 'status-invalid';
      case 'processing':
        return 'status-processing';
      default:
        return 'status-pending';
    }
  }
}