import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AlertController, IonicModule, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Icons will be used directly in the template using ion-icon component

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule
  ]
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  showPassword = false;
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {

    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  ngOnInit() {
    // Add animation on page load
    setTimeout(() => {
      const loginCard = document.querySelector('.login-card');
      if (loginCard) {
        loginCard.classList.add('slide-in');
      }
    }, 100);
  }

  async onLogin() {
    if (this.loginForm.invalid) {
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Signing in...',
      spinner: 'crescent',
      translucent: true,
      backdropDismiss: false
    });

    try {
      await loading.present();
      
      const credentials = {
        Username: this.loginForm.value.username,
        Password: this.loginForm.value.password
      };
      
      await this.authService.login(credentials).toPromise();
      
      await loading.dismiss();
      this.router.navigate(['/home']);
    } catch (error: any) {
      await loading.dismiss();
      
      // Log the full error for debugging
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed. Please check your credentials and try again.';
      
      if (error.status === 401) {
        errorMessage = 'Invalid username or password. Please try again.';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      const alert = await this.alertController.create({
        header: 'Login Failed',
        message: errorMessage,
        buttons: ['OK'],
        cssClass: 'error-alert'
      });
      
      await alert.present();
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async loginWithGoogle() {
    // Implement Google OAuth login
    const loading = await this.loadingController.create({
      message: 'Connecting with Google...',
      spinner: 'crescent',
      translucent: true
    });
    
    try {
      await loading.present();
      // Add your Google OAuth implementation here
      // await this.authService.loginWithGoogle();
      await loading.dismiss();
    } catch (error) {
      await loading.dismiss();
      this.showError('Google login failed. Please try again.');
    }
  }

  async loginWithGithub() {
    // Implement GitHub OAuth login
    const loading = await this.loadingController.create({
      message: 'Connecting with GitHub...',
      spinner: 'crescent',
      translucent: true
    });
    
    try {
      await loading.present();
      // Add your GitHub OAuth implementation here
      // await this.authService.loginWithGithub();
      await loading.dismiss();
    } catch (error) {
      await loading.dismiss();
      this.showError('GitHub login failed. Please try again.');
    }
  }

  async loginWithMicrosoft() {
    // Implement Microsoft OAuth login
    const loading = await this.loadingController.create({
      message: 'Connecting with Microsoft...',
      spinner: 'crescent',
      translucent: true
    });
    
    try {
      await loading.present();
      // Add your Microsoft OAuth implementation here
      // await this.authService.loginWithMicrosoft();
      await loading.dismiss();
    } catch (error) {
      await loading.dismiss();
      this.showError('Microsoft login failed. Please try again.');
    }
  }

  private async showError(message: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message,
      buttons: ['OK'],
      cssClass: 'error-alert'
    });
    
    await alert.present();
  }
}
