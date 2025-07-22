import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { 
  ToastController,
  LoadingController,
  IonSpinner,
  IonIcon
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import { mailOutline } from 'ionicons/icons';

@Component({
  selector: 'app-forgot-password',
  template: `
    <div class="forgot-password-container">
      <div class="forgot-password-content">
        <!-- Left side - Branding -->
        <div class="branding-section">
          <div class="brand-content">
            <div class="logo-section">
              <h1 class="brand-title">AISAP</h1>
              <p class="brand-subtitle">AI-Powered Solutions & Analytics Platform</p>
            </div>
            <div class="feature-highlights">
              <div class="feature-item">
                <div class="feature-icon">🔐</div>
                <div class="feature-text">
                  <h3>Secure Recovery</h3>
                  <p>Safe and secure password recovery process</p>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon">📧</div>
                <div class="feature-text">
                  <h3>Email Verification</h3>
                  <p>Receive reset instructions via email</p>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon">⚡</div>
                <div class="feature-text">
                  <h3>Quick Process</h3>
                  <p>Fast and efficient password reset</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right side - Forgot Password Form -->
        <div class="form-section">
          <div class="form-container">
            <div class="form-header">
              <h2 class="form-title">Reset Password</h2>
              <p class="form-subtitle">Enter your email address and we'll send you instructions to reset your password.</p>
            </div>

            <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()" class="forgot-password-form">
              <div class="form-group">
                <label class="form-label">Email Address</label>
                <div class="input-container">
                  <ion-icon name="mail-outline" class="input-icon"></ion-icon>
                  <input 
                    type="email" 
                    formControlName="email" 
                    class="form-input"
                    [class.error]="hasFieldError('email')"
                    placeholder="Enter your email address"
                    [disabled]="isLoading"
                  />
                </div>
                <div class="validation-error" *ngIf="hasFieldError('email')">
                  <div *ngIf="forgotPasswordForm.get('email')?.errors?.['required']">Email address is required</div>
                  <div *ngIf="forgotPasswordForm.get('email')?.errors?.['email']">Please enter a valid email address</div>
                </div>
              </div>

              <button 
                type="submit" 
                class="submit-btn"
                [disabled]="forgotPasswordForm.invalid || isLoading"
                [class.loading]="isLoading"
              >
                <ion-spinner name="dots" *ngIf="isLoading" class="btn-spinner"></ion-spinner>
                <span *ngIf="!isLoading">Send Reset Instructions</span>
                <span *ngIf="isLoading">Sending...</span>
              </button>

              <div class="form-footer">
                <p class="back-to-login">
                  Remember your password? 
                  <a routerLink="/login" class="login-link" [class.disabled]="isLoading">Back to Login</a>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .forgot-password-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .forgot-password-content {
      display: flex;
      width: 100%;
      max-width: 1200px;
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      min-height: 600px;
    }

    .branding-section {
      flex: 1;
      background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 60px 40px;
      color: white;
    }

    .brand-content {
      text-align: center;
      max-width: 400px;
    }

    .logo-section {
      margin-bottom: 40px;
    }

    .brand-title {
      font-size: 48px;
      font-weight: 700;
      margin: 0 0 16px 0;
      background: linear-gradient(45deg, #fff, #e3f2fd);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .brand-subtitle {
      font-size: 18px;
      opacity: 0.9;
      margin: 0;
      line-height: 1.5;
    }

    .feature-highlights {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .feature-item {
      display: flex;
      align-items: center;
      text-align: left;
    }

    .feature-icon {
      font-size: 32px;
      margin-right: 16px;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
    }

    .feature-text h3 {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
    }

    .feature-text p {
      margin: 0;
      font-size: 14px;
      opacity: 0.8;
      line-height: 1.4;
    }

    .form-section {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 60px 40px;
    }

    .form-container {
      width: 100%;
      max-width: 400px;
    }

    .form-header {
      text-align: center;
      margin-bottom: 40px;
    }

    .form-title {
      font-size: 32px;
      font-weight: 700;
      color: #2c3e50;
      margin: 0 0 12px 0;
    }

    .form-subtitle {
      font-size: 16px;
      color: #7f8c8d;
      margin: 0;
      line-height: 1.5;
    }

    .forgot-password-form {
      width: 100%;
    }

    .form-group {
      margin-bottom: 24px;
    }

    .form-label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 8px;
    }

    .input-container {
      position: relative;
      display: flex;
      align-items: center;
      background: #f8f9fa;
      border: 2px solid #e9ecef;
      border-radius: 12px;
      transition: all 0.3s ease;
    }

    .input-container:focus-within {
      border-color: #3498db;
      background: white;
      box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
    }

    .input-container.error {
      border-color: #e74c3c;
      background: #fdf2f2;
    }

    .input-icon {
      color: #7f8c8d;
      margin: 0 16px;
      font-size: 20px;
    }

    .form-input {
      flex: 1;
      border: none;
      background: transparent;
      padding: 16px 16px 16px 0;
      font-size: 16px;
      color: #2c3e50;
      outline: none;
    }

    .form-input::placeholder {
      color: #bdc3c7;
    }

    .form-input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .validation-error {
      color: #e74c3c;
      font-size: 14px;
      margin-top: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .submit-btn {
      width: 100%;
      background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
      color: white;
      border: none;
      border-radius: 12px;
      padding: 16px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 24px;
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(52, 152, 219, 0.3);
    }

    .submit-btn:disabled {
      background: #bdc3c7;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .btn-spinner {
      width: 20px;
      height: 20px;
    }

    .form-footer {
      text-align: center;
    }

    .back-to-login {
      font-size: 14px;
      color: #7f8c8d;
      margin: 0;
    }

    .login-link {
      color: #3498db;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.3s ease;
    }

    .login-link:hover:not(.disabled) {
      color: #2980b9;
      text-decoration: underline;
    }

    .login-link.disabled {
      color: #bdc3c7;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .forgot-password-content {
        flex-direction: column;
        margin: 10px;
      }

      .branding-section {
        padding: 40px 20px;
      }

      .brand-title {
        font-size: 36px;
      }

      .form-section {
        padding: 40px 20px;
      }

      .form-title {
        font-size: 28px;
      }
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    IonSpinner,
    IonIcon
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
    // Add icons
    addIcons({
      mailOutline
    });
    
    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.forgotPasswordForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
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