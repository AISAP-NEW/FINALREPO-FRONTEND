import { Component, Input } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface ModelUpload {
  id: number;
  title: string;
  date: string;
}

@Component({
  selector: 'app-calendar-date-modal',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Models uploaded on {{ selectedDate | date:'mediumDate' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="close()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div *ngIf="models.length > 0; else noModels">
        <ion-list>
          <ion-item 
            *ngFor="let model of models" 
            button 
            (click)="viewModelDetails(model.id)"
            class="model-item">
            <ion-label>
              <h2>{{ model.title }}</h2>
              <p>Uploaded: {{ model.date | date:'short' }}</p>
            </ion-label>
            <ion-icon name="chevron-forward-outline" slot="end"></ion-icon>
          </ion-item>
        </ion-list>
      </div>
      
      <ng-template #noModels>
        <div class="no-models-container">
          <ion-icon name="document-outline" size="large"></ion-icon>
          <h3>No models uploaded</h3>
          <p>No models were uploaded on this date.</p>
        </div>
      </ng-template>
    </ion-content>
  `,
  styles: [`
    .model-item {
      --background: rgba(0, 255, 231, 0.05);
      --border-color: rgba(0, 255, 231, 0.2);
      margin-bottom: 8px;
      border-radius: 12px;
    }

    .model-item ion-label h2 {
      color: #00ffe7;
      font-weight: 600;
    }

    .model-item ion-label p {
      color: #b2fefa;
    }

    .no-models-container {
      text-align: center;
      padding: 2rem;
      color: #b2fefa;
    }

    .no-models-container ion-icon {
      color: #00ffe7;
      margin-bottom: 1rem;
    }

    .no-models-container h3 {
      color: #00ffe7;
      margin-bottom: 0.5rem;
    }

    ion-header ion-toolbar {
      --background: linear-gradient(135deg, #232526 0%, #414345 100%);
      --color: #00ffe7;
    }

    ion-content {
      --background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    }
  `]
})
export class CalendarDateModalComponent {
  @Input() models: ModelUpload[] = [];
  @Input() selectedDate: string = '';

  constructor(
    private modalCtrl: ModalController,
    private router: Router
  ) {}

  close() {
    this.modalCtrl.dismiss();
  }

  viewModelDetails(modelId: number) {
    this.modalCtrl.dismiss();
    this.router.navigate(['/model-details', modelId]);
  }
}
