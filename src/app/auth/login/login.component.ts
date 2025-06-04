import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
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
  IonSpinner,
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  template: `
    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Login</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <ion-item>
              <ion-label position="floating">Username</ion-label>
              <ion-input type="text" formControlName="username" [disabled]="isLoading"></ion-input>
            </ion-item>
            <div class="validation-error" *ngIf="loginForm.get('username')?.invalid && loginForm.get('username')?.touched">
              <div *ngIf="loginForm.get('username')?.errors?.['required']">Username is required</div>
            </div>

            <ion-item>
              <ion-label position="floating">Password</ion-label>
              <ion-input type="password" formControlName="password" [disabled]="isLoading"></ion-input>
            </ion-item>
            <div class="validation-error" *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
              <div *ngIf="loginForm.get('password')?.errors?.['required']">Password is required</div>
              <div *ngIf="loginForm.get('password')?.errors?.['minlength']">Password must be at least 6 characters</div>
            </div>

            <ion-button expand="block" type="submit" [disabled]="loginForm.invalid || isLoading" class="ion-margin-top">
              <ion-spinner name="dots" *ngIf="isLoading"></ion-spinner>
              <span *ngIf="!isLoading">Login</span>
            </ion-button>

            <ion-button expand="block" fill="clear" routerLink="/register" class="ion-margin-top" [disabled]="isLoading">
              Don't have an account? Register
            </ion-button>
          </form>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [`
    .validation-error {
      color: var(--ion-color-danger);
      font-size: 14px;
      margin: 8px 0 0 16px;
    }

    ion-card {
      max-width: 400px;
      margin: 20px auto;
    }

    ion-card-header {
      text-align: center;
    }

    ion-card-title {
      font-size: 24px;
      font-weight: bold;
    }

    ion-item {
      margin-bottom: 16px;
    }

    ion-button {
      margin-top: 24px;
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
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  returnUrl: string = '/home';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
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
            this.router.navigate([this.returnUrl]);
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
} 