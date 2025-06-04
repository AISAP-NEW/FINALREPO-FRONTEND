import { Component } from '@angular/core';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButtons,
  IonMenuButton
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Home</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="ion-padding">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Welcome to AISAP</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>This is your dashboard where you can:</p>
            <ul>
              <li>View your projects</li>
              <li>Manage datasets</li>
              <li>Collaborate with developers</li>
              <li>Check notifications</li>
            </ul>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    ion-card {
      margin: 20px;
    }
    ul {
      padding-left: 20px;
    }
    li {
      margin: 10px 0;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButtons,
    IonMenuButton
  ]
})
export class HomePage {
  constructor() {}
}
