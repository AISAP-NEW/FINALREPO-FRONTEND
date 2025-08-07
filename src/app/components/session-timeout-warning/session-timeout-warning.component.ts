import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonModal, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButton, 
  IonIcon,
  ModalController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { warningOutline, timeOutline } from 'ionicons/icons';
import { SessionTimeoutService } from '../../services/session-timeout.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-session-timeout-warning',
  template: `
    <ion-modal [isOpen]="isVisible" [canDismiss]="false" [backdropDismiss]="false">
      <ion-header>
        <ion-toolbar color="warning">
          <ion-title>
            <ion-icon name="warning-outline"></ion-icon>
            Session Timeout Warning
          </ion-title>
        </ion-toolbar>
      </ion-header>
      
      <ion-content class="ion-padding">
        <div class="warning-content">
          <div class="timeout-icon">
            <ion-icon name="time-outline" size="large" color="warning"></ion-icon>
          </div>
          
          <h2>Your session will expire soon!</h2>
          
          <p>
            Due to inactivity, your session will automatically expire in:
          </p>
          
          <div class="countdown">
            <span class="countdown-number">{{ timeRemaining }}</span>
            <span class="countdown-label">seconds</span>
          </div>
          
          <p class="warning-text">
            You will be automatically logged out and redirected to the login page.
          </p>
          
          <div class="button-container">
            <ion-button 
              expand="block" 
              color="primary" 
              (click)="extendSession()"
              class="extend-button">
              Stay Logged In
            </ion-button>
            
            <ion-button 
              expand="block" 
              fill="outline" 
              color="medium" 
              (click)="logoutNow()"
              class="logout-button">
              Logout Now
            </ion-button>
          </div>
        </div>
      </ion-content>
    </ion-modal>
  `,
  styles: [`
    .warning-content {
      text-align: center;
      padding: 20px;
    }
    
    .timeout-icon {
      margin: 20px 0;
    }
    
    h2 {
      color: var(--ion-color-warning);
      margin: 20px 0;
      font-weight: bold;
    }
    
    .countdown {
      margin: 30px 0;
      padding: 20px;
      background: var(--ion-color-warning-tint);
      border-radius: 12px;
      border: 2px solid var(--ion-color-warning);
    }
    
    .countdown-number {
      font-size: 3rem;
      font-weight: bold;
      color: var(--ion-color-warning-shade);
      display: block;
    }
    
    .countdown-label {
      font-size: 1.2rem;
      color: var(--ion-color-warning-shade);
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .warning-text {
      color: var(--ion-color-medium);
      font-style: italic;
      margin: 20px 0;
    }
    
    .button-container {
      margin-top: 30px;
    }
    
    .extend-button {
      margin-bottom: 10px;
      --border-radius: 8px;
      font-weight: bold;
    }
    
    .logout-button {
      --border-radius: 8px;
    }
    
    ion-modal {
      --width: 90%;
      --max-width: 400px;
      --height: auto;
      --border-radius: 16px;
    }
    
    @media (max-width: 768px) {
      ion-modal {
        --width: 95%;
      }
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon
  ]
})
export class SessionTimeoutWarningComponent implements OnInit, OnDestroy {
  isVisible = false;
  timeRemaining = 0;
  
  private warningSubscription?: Subscription;
  private timeSubscription?: Subscription;

  constructor(
    private sessionTimeoutService: SessionTimeoutService,
    private modalController: ModalController
  ) {
    addIcons({
      warningOutline,
      timeOutline
    });
  }

  ngOnInit() {
    // Subscribe to warning state
    this.warningSubscription = this.sessionTimeoutService.isWarningShown$.subscribe(
      isShown => {
        this.isVisible = isShown;
        console.log('Session warning visibility:', isShown);
      }
    );
    
    // Subscribe to time remaining
    this.timeSubscription = this.sessionTimeoutService.timeRemaining$.subscribe(
      time => {
        this.timeRemaining = Math.ceil(time);
        console.log('Time remaining:', this.timeRemaining);
      }
    );
  }

  ngOnDestroy() {
    if (this.warningSubscription) {
      this.warningSubscription.unsubscribe();
    }
    
    if (this.timeSubscription) {
      this.timeSubscription.unsubscribe();
    }
  }

  /**
   * Extend the session when user clicks "Stay Logged In"
   */
  extendSession() {
    console.log('User chose to extend session');
    this.sessionTimeoutService.extendSession();
    this.isVisible = false;
  }

  /**
   * Logout immediately when user clicks "Logout Now"
   */
  logoutNow() {
    console.log('User chose to logout immediately');
    this.sessionTimeoutService.stopMonitoring();
    // The AuthService logout will be called by the session service
    this.isVisible = false;
  }
}
