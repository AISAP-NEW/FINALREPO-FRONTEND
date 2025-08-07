import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { 
  IonIcon,
  IonSpinner,
  IonButton,
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    IonIcon,
    IonSpinner,
    IonButton
  ]
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  showPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    console.log('Login component constructor');
  }

  ngOnInit() {
    console.log('Login component initialized');
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      const loading = await this.loadingController.create({
        message: 'Logging in...',
      });
      await loading.present();
      
      try {
        this.isLoading = true;
        this.authService.login(this.loginForm.value).subscribe({
          next: async () => {
            await loading.dismiss();
            this.isLoading = false;
            const toast = await this.toastController.create({
              message: 'Login successful!',
              duration: 2000,
              color: 'success'
            });
            await toast.present();
            this.router.navigate(['/home']);
          },
          error: async (error) => {
            await loading.dismiss();
            this.isLoading = false;
            console.error('Login error:', error);
            const toast = await this.toastController.create({
              message: error.message || 'Login failed. Please check your credentials.',
              duration: 3000,
              color: 'danger'
            });
            await toast.present();
          }
        });
      } catch (error: any) {
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
      const toast = await this.toastController.create({
        message: 'Please fill in all required fields correctly',
        duration: 3000,
        color: 'warning'
      });
      await toast.present();
    }
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
} 