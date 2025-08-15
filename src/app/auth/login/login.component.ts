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
import { GitHubAuthService, GitHubCallbackResponse } from '../../services/github-auth.service';

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
  isGitHubLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private githubAuthService: GitHubAuthService,
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

    // Check if this is a GitHub OAuth callback
    this.checkGitHubCallback();
  }

  /**
   * Check if the user is returning from GitHub OAuth
   */
  private async checkGitHubCallback() {
    if (this.githubAuthService.isGitHubCallback()) {
      console.log('GitHub OAuth callback detected');
      await this.handleGitHubCallback();
    }
  }

  /**
   * Handle GitHub OAuth callback
   */
  private async handleGitHubCallback() {
    const loading = await this.loadingController.create({
      message: 'Completing GitHub login...',
    });
    await loading.present();

    try {
      this.isGitHubLoading = true;
      
      this.githubAuthService.handleGitHubReturn().subscribe({
        next: async (response: GitHubCallbackResponse) => {
          await loading.dismiss();
          this.isGitHubLoading = false;
          
          // Clear GitHub OAuth parameters from URL
          this.githubAuthService.clearGitHubParams();
          
          // Log the response to debug
          console.log('GitHub OAuth response:', response);
          
          // Use AuthService to handle GitHub authentication
          this.authService.handleGitHubAuth(response);
          
          // Show success message
          const toast = await this.toastController.create({
            message: `Welcome back, ${response.Username}! GitHub login successful.`,
            duration: 3000,
            color: 'success'
          });
          await toast.present();
          
          // Navigate to home
          this.router.navigate(['/home']);
        },
        error: async (error) => {
          await loading.dismiss();
          this.isGitHubLoading = false;
          
          // Clear GitHub OAuth parameters from URL
          this.githubAuthService.clearGitHubParams();
          
          console.error('GitHub callback error:', error);
          const toast = await this.toastController.create({
            message: error.message || 'GitHub login failed. Please try again.',
            duration: 3000,
            color: 'danger'
          });
          await toast.present();
        }
      });
    } catch (error: any) {
      await loading.dismiss();
      this.isGitHubLoading = false;
      
      // Clear GitHub OAuth parameters from URL
      this.githubAuthService.clearGitHubParams();
      
      const toast = await this.toastController.create({
        message: error.message || 'An unexpected error occurred during GitHub login.',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
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

  /**
   * Initiate GitHub OAuth login
   */
  async onGitHubLogin() {
    if (this.isGitHubLoading) return;

    try {
      this.isGitHubLoading = true;
      
      // Show loading message
      const loading = await this.loadingController.create({
        message: 'Redirecting to GitHub...',
        duration: 2000
      });
      await loading.present();
      
      // Initiate GitHub OAuth
      this.githubAuthService.initiateGitHubLogin();
      
    } catch (error: any) {
      this.isGitHubLoading = false;
      const toast = await this.toastController.create({
        message: error.message || 'Failed to initiate GitHub login.',
        duration: 3000,
        color: 'danger'
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