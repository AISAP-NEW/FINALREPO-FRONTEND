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
  ToastController
} from '@ionic/angular/standalone';
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

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {
    this.registerForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  async onSubmit() {
    if (this.registerForm.valid) {
      try {
        const formValue = this.registerForm.value;
        const userData: RegisterDTO = {
          username: formValue.username,
          email: formValue.email,
          password: formValue.password,
          role: 'Developer' // Default role
        };

        this.authService.register(userData).subscribe({
          next: async () => {
            // Show success message
            await this.showToast('Registration successful! Please login with your credentials.', 'success');
            // Redirect to login page
            this.router.navigate(['/login']);
          },
          error: (error) => {
            console.error('Registration error:', error);
            this.showError(error.error?.message || 'Registration failed');
          }
        });
      } catch (error: any) {
        console.error('Registration error:', error);
        await this.showError(error.message || 'Registration failed');
      }
    } else {
      if (this.registerForm.errors?.['mismatch']) {
        await this.showError('Passwords do not match');
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