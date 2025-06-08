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
  selector: 'app-reset-password',
  template: `
    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Reset Password</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <form [formGroup]="resetPasswordForm" (ngSubmit)="onSubmit()">
            <ion-item>
              <ion-label position="floating">Reset Code</ion-label>
              <ion-input type="text" formControlName="token" [disabled]="isLoading"></ion-input>
            </ion-item>
            <div class="validation-error" *ngIf="resetPasswordForm.get('token')?.invalid && resetPasswordForm.get('token')?.touched">
              <div *ngIf="resetPasswordForm.get('token')?.errors?.['required']">Reset code is required</div>
            </div>

            <ion-item>
              <ion-label position="floating">New Password</ion-label>
              <ion-input type="password" formControlName="newPassword" [disabled]="isLoading"></ion-input>
            </ion-item>
            <div class="validation-error" *ngIf="resetPasswordForm.get('newPassword')?.invalid && resetPasswordForm.get('newPassword')?.touched">
              <div *ngIf="resetPasswordForm.get('newPassword')?.errors?.['required']">New password is required</div>
              <div *ngIf="resetPasswordForm.get('newPassword')?.errors?.['pattern']">
                Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number and one special character
              </div>
            </div>

            <ion-item>
              <ion-label position="floating">Confirm New Password</ion-label>
              <ion-input type="password" formControlName="confirmNewPassword" [disabled]="isLoading"></ion-input>
            </ion-item>
            <div class="validation-error" *ngIf="resetPasswordForm.get('confirmNewPassword')?.invalid && resetPasswordForm.get('confirmNewPassword')?.touched">
              <div *ngIf="resetPasswordForm.get('confirmNewPassword')?.errors?.['required']">Please confirm your new password</div>
            </div>
            <div class="validation-error" *ngIf="resetPasswordForm.errors?.['mismatch'] && resetPasswordForm.get('confirmNewPassword')?.touched">
              Passwords do not match
            </div>

            <ion-button expand="block" type="submit" [disabled]="resetPasswordForm.invalid || isLoading" class="ion-margin-top">
              <ion-spinner name="dots" *ngIf="isLoading"></ion-spinner>
              <span *ngIf="!isLoading">Reset Password</span>
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
export class ResetPasswordComponent {
  resetPasswordForm: FormGroup;
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    this.resetPasswordForm = this.formBuilder.group({
      token: ['', [Validators.required]],
      newPassword: ['', [
        Validators.required,
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      confirmNewPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmNewPassword')?.value
      ? null
      : { mismatch: true };
  }

  async onSubmit() {
    if (this.resetPasswordForm.valid) {
      const loading = await this.loadingController.create({
        message: 'Resetting password...',
      });
      await loading.present();
      
      try {
        this.isLoading = true;
        const formValue = this.resetPasswordForm.value;
        
        console.log('Attempting to validate reset code:', formValue.token);
        
        // First validate the reset code
        this.authService.validateResetCode(formValue.token).subscribe({
          next: async () => {
            console.log('Reset code validated successfully, proceeding with password reset');
            
            // If code is valid, proceed with password reset
            const resetData = {
              token: formValue.token,
              newPassword: formValue.newPassword,
              confirmNewPassword: formValue.confirmNewPassword
            };
            
            console.log('Sending password reset request');
            
            this.authService.resetPassword(resetData).subscribe({
              next: async () => {
                await loading.dismiss();
                this.isLoading = false;
                const toast = await this.toastController.create({
                  message: 'Password has been reset successfully. Please login with your new password.',
                  duration: 3000,
                  color: 'success'
                });
                await toast.present();
                this.router.navigate(['/login']);
              },
              error: async (error) => {
                console.error('Reset password error:', error);
                await loading.dismiss();
                this.isLoading = false;
                const toast = await this.toastController.create({
                  message: error.message || 'Failed to reset password.',
                  duration: 3000,
                  color: 'danger'
                });
                await toast.present();
              }
            });
          },
          error: async (error) => {
            console.error('Reset code validation error:', error);
            await loading.dismiss();
            this.isLoading = false;
            const toast = await this.toastController.create({
              message: error.message || 'Invalid or expired reset code.',
              duration: 3000,
              color: 'danger'
            });
            await toast.present();
          }
        });
      } catch (error: any) {
        console.error('Unexpected error during password reset:', error);
        await loading.dismiss();
        this.isLoading = false;
        const toast = await this.toastController.create({
          message: error.message || 'An unexpected error occurred',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }
    } else {
      if (this.resetPasswordForm.errors?.['mismatch']) {
        const toast = await this.toastController.create({
          message: 'Passwords do not match',
          duration: 3000,
          color: 'warning'
        });
        await toast.present();
      } else {
        const toast = await this.toastController.create({
          message: 'Please fill in all required fields correctly',
          duration: 3000,
          color: 'warning'
        });
        await toast.present();
      }
    }
  }
} 