import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import { IonContent, IonItem, IonLabel, IonInput, IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';
import { AuthService, RegisterDTO } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
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
    IonCardContent
  ]
})
export class RegisterComponent {
  registerForm: FormGroup;
  passwordPattern = '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {
    this.registerForm = this.formBuilder.group({
      Username: ['', [Validators.required]],
      Email: ['', [Validators.required, Validators.email]],
      Password: ['', [Validators.required, Validators.pattern(this.passwordPattern)]],
      ConfirmPassword: ['', [Validators.required]],
      Role: ['Developer', [Validators.required]] // Default role
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator(g: FormGroup) {
    return g.get('Password')?.value === g.get('ConfirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  async onSubmit() {
    if (this.registerForm.valid) {
      try {
        const formValue = this.registerForm.value;
        const userData: RegisterDTO = {
          Username: formValue.Username,
          Email: formValue.Email,
          Password: formValue.Password,
          ConfirmPassword: formValue.ConfirmPassword,
          Role: formValue.Role
        };

        this.authService.register(userData).subscribe({
          next: async () => {
            await this.showToast('Registration successful! Please login with your credentials.', 'success');
            this.router.navigate(['/login']);
          },
          error: (error) => {
            console.error('Registration error:', error);
            this.showError(error.error?.message || error.message || 'Registration failed');
          }
        });
      } catch (error: any) {
        console.error('Registration error:', error);
        await this.showError(error.message || 'Registration failed');
      }
    } else {
      if (this.registerForm.errors?.['mismatch']) {
        await this.showError('Passwords do not match');
      } else if (this.registerForm.get('Password')?.errors?.['pattern']) {
        await this.showError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number and one special character');
      } else {
        await this.showError('Please fill in all required fields correctly');
      }
    }
  }

  private async showError(message: string) {
    await this.showToast(message, 'danger');
  }

  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color
    });
    await toast.present();
  }
} 