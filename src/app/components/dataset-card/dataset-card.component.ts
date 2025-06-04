import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Dataset } from '../../services/dataset.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-dataset-card',
  templateUrl: './dataset-card.component.html',
  styleUrls: ['./dataset-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class DatasetCardComponent {
  @Input() dataset!: Dataset;
  @Input() isSelected = false;

  constructor(private sanitizer: DomSanitizer) {}

  get imageUrl(): SafeUrl {
    if (this.dataset.thumbnailBase64) {
      return this.sanitizer.bypassSecurityTrustUrl('data:image/jpeg;base64,' + this.dataset.thumbnailBase64);
    }
    return 'assets/default-dataset.png';
  }
} 