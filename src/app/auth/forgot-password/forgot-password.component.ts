import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { 
  IonContent, 
  IonItem, 
  IonLabel, 
  IonInput,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  ToastController,
  LoadingController,
  IonSpinner
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  template: `
    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Forgot Password</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()">
            <ion-item>
              <ion-label position="floating">Email</ion-label>
              <ion-input type="email" formControlName="email" [disabled]="isLoading"></ion-input>
            </ion-item>
            <div class="validation-error" *ngIf="forgotPasswordForm.get('email')?.invalid && forgotPasswordForm.get('email')?.touched">
              <div *ngIf="forgotPasswordForm.get('email')?.errors?.['required']">Email is required</div>
              <div *ngIf="forgotPasswordForm.get('email')?.errors?.['email']">Please enter a valid email</div>
            </div>

            <ion-button expand="block" type="submit" [disabled]="forgotPasswordForm.invalid || isLoading" class="ion-margin-top">
              <ion-spinner name="dots" *ngIf="isLoading"></ion-spinner>
              <span *ngIf="!isLoading">Send Reset Code</span>
            </ion-button>

            <ion-button expand="block" fill="clear" routerLink="/login" class="ion-margin-top" [disabled]="isLoading">
              Back to Login
            </ion-button>
          </form>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [`
    .validation-error {
      color: var(--ion-color-danger);
      font-size: 0.8em;
      margin: 5px 0 0 16px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSpinner
  ]
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  async onSubmit() {
    if (this.forgotPasswordForm.valid) {
      const loading = await this.loadingController.create({
        message: 'Sending reset code...',
      });
      await loading.present();
      
      try {
        this.isLoading = true;
        console.log('Sending forgot password request for email:', this.forgotPasswordForm.value.email);
        
        this.authService.forgotPassword({ email: this.forgotPasswordForm.value.email }).subscribe({
          next: async (response) => {
            console.log('Forgot password response:', response);
            await loading.dismiss();
            this.isLoading = false;
            const toast = await this.toastController.create({
              message: 'If your email is registered, you will receive a password reset code.',
              duration: 3000,
              color: 'success'
            });
            await toast.present();
            this.router.navigate(['/reset-password']);
          },
          error: async (error) => {
            console.error('Forgot password error details:', {
              error,
              status: error.status,
              statusText: error.statusText,
              message: error.message,
              errorObject: error.error
            });
            
            await loading.dismiss();
            this.isLoading = false;
            
            let errorMessage = 'Failed to process forgot password request.';
            
            if (error.status === 0) {
              errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
            } else if (error.status === 404) {
              errorMessage = 'The server endpoint was not found. Please contact support.';
            } else if (error.error?.message) {
              errorMessage = error.error.message;
            } else if (error.message) {
              errorMessage = error.message;
            }
            
            const toast = await this.toastController.create({
              message: errorMessage,
              duration: 3000,
              color: 'danger'
            });
            await toast.present();
          }
        });
      } catch (error: any) {
        console.error('Unexpected error in forgot password:', error);
        await loading.dismiss();
        this.isLoading = false;
        const toast = await this.toastController.create({
          message: 'An unexpected error occurred. Please try again later.',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }
    } else {
      const toast = await this.toastController.create({
        message: 'Please enter a valid email address',
        duration: 3000,
        color: 'warning'
      });
      await toast.present();
    }
  }
} 