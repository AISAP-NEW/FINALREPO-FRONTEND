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
import { keyOutline, lockClosedOutline, checkmarkCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-reset-password',
  template: `
    <div class="reset-password-container">
      <div class="reset-password-content">
        <!-- Left side - Branding -->
        <div class="branding-section">
          <div class="brand-content">
            <div class="logo-section">
              <h1 class="brand-title">AISAP</h1>
              <p class="brand-subtitle">AI-Powered Solutions & Analytics Platform</p>
            </div>
            <div class="feature-highlights">
              <div class="feature-item">
                <div class="feature-icon">🔑</div>
                <div class="feature-text">
                  <h3>Secure Reset</h3>
                  <p>Verify your identity with the reset code</p>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon">🔒</div>
                <div class="feature-text">
                  <h3>Strong Password</h3>
                  <p>Create a secure new password</p>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon">✓</div>
                <div class="feature-text">
                  <h3>Instant Access</h3>
                  <p>Regain access to your account immediately</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right side - Reset Password Form -->
        <div class="form-section">
          <div class="form-container">
            <div class="form-header">
              <h2 class="form-title">Create New Password</h2>
              <p class="form-subtitle">Enter the reset code from your email and create a new secure password.</p>
            </div>

            <form [formGroup]="resetPasswordForm" (ngSubmit)="onSubmit()" class="reset-password-form">
              <div class="form-group">
                <label class="form-label">Reset Code</label>
                <div class="input-container" [class.error]="hasFieldError('token')">
                  <ion-icon name="key-outline" class="input-icon"></ion-icon>
                  <input 
                    type="text" 
                    formControlName="token" 
                    class="form-input"
                    placeholder="Enter reset code from email"
                    [disabled]="isLoading"
                  />
                </div>
                <div class="validation-error" *ngIf="hasFieldError('token')">
                  <div *ngIf="resetPasswordForm.get('token')?.errors?.['required']">Reset code is required</div>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">New Password</label>
                <div class="input-container" [class.error]="hasFieldError('newPassword')">
                  <ion-icon name="lock-closed-outline" class="input-icon"></ion-icon>
                  <input 
                    type="password" 
                    formControlName="newPassword" 
                    class="form-input"
                    placeholder="Enter new password"
                    [disabled]="isLoading"
                  />
                </div>
                <div class="password-requirements">
                  <p>Password must contain:</p>
                  <ul>
                    <li>At least 8 characters</li>
                    <li>One uppercase letter (A-Z)</li>
                    <li>One lowercase letter (a-z)</li>
                    <li>One number (0-9)</li>
                    <li>One special character (&#64;$!%*?&)</li>
                  </ul>
                </div>
                <div class="validation-error" *ngIf="hasFieldError('newPassword')">
                  <div *ngIf="resetPasswordForm.get('newPassword')?.errors?.['required']">New password is required</div>
                  <div *ngIf="resetPasswordForm.get('newPassword')?.errors?.['pattern']">
                    Password does not meet requirements above
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Confirm New Password</label>
                <div class="input-container" [class.error]="hasFieldError('confirmNewPassword') || resetPasswordForm.errors?.['mismatch']">
                  <ion-icon name="checkmark-circle-outline" class="input-icon"></ion-icon>
                  <input 
                    type="password" 
                    formControlName="confirmNewPassword" 
                    class="form-input"
                    placeholder="Confirm new password"
                    [disabled]="isLoading"
                  />
                </div>
                <div class="validation-error" *ngIf="hasFieldError('confirmNewPassword')">
                  <div *ngIf="resetPasswordForm.get('confirmNewPassword')?.errors?.['required']">Please confirm your new password</div>
                </div>
                <div class="validation-error" *ngIf="resetPasswordForm.errors?.['mismatch'] && resetPasswordForm.get('confirmNewPassword')?.touched">
                  Passwords do not match
                </div>
              </div>

              <button 
                type="submit" 
                class="submit-btn"
                [disabled]="resetPasswordForm.invalid || isLoading"
                [class.loading]="isLoading"
              >
                <ion-spinner name="dots" *ngIf="isLoading" class="btn-spinner"></ion-spinner>
                <span *ngIf="!isLoading">Reset Password</span>
                <span *ngIf="isLoading">Resetting...</span>
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
    .reset-password-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .reset-password-content {
      display: flex;
      width: 100%;
      max-width: 1200px;
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      min-height: 700px;
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

    .reset-password-form {
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

    .password-requirements {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 12px;
      margin-top: 8px;
      font-size: 12px;
      color: #7f8c8d;
    }

    .password-requirements p {
      margin: 0 0 8px 0;
      font-weight: 600;
    }

    .password-requirements ul {
      margin: 0;
      padding-left: 16px;
    }

    .password-requirements li {
      margin-bottom: 4px;
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
      .reset-password-content {
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
    // Add icons
    addIcons({
      keyOutline,
      lockClosedOutline,
      checkmarkCircleOutline
    });
    
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

  hasFieldError(fieldName: string): boolean {
    const field = this.resetPasswordForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
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