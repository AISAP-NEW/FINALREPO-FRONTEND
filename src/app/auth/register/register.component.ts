import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastController, IonicModule } from '@ionic/angular';
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
    IonicModule
  ]
})
export class RegisterComponent {
  registerForm: FormGroup;
  passwordPattern = '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$';
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {
    this.registerForm = this.formBuilder.group({
      Username: ['', [Validators.required, Validators.minLength(3)]],
      Email: ['', [Validators.required, Validators.email]],
      Password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(this.passwordPattern)]],
      ConfirmPassword: ['', [Validators.required]],
      Role: ['Developer', [Validators.required]], // Default role
      FirstName: [''],
      LastName: [''],
      PhoneNumber: ['', [Validators.pattern('^[+]?[0-9]{10,15}$')]],
      Bio: ['', [Validators.maxLength(500)]],
      DateOfBirth: ['']
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
    console.log('=== REGISTRATION FORM SUBMISSION ===');
    console.log('Form valid:', this.registerForm.valid);
    console.log('Form value:', this.registerForm.value);
    console.log('Form errors:', this.registerForm.errors);
    
    if (this.registerForm.valid) {
      this.isLoading = true;
      try {
        const formValue = this.registerForm.value;
        const userData: RegisterDTO = {
          Username: formValue.Username,
          Email: formValue.Email,
          Password: formValue.Password,
          ConfirmPassword: formValue.ConfirmPassword,
          Role: formValue.Role,
          FirstName: formValue.FirstName?.trim() || undefined,
          LastName: formValue.LastName?.trim() || undefined,
          PhoneNumber: formValue.PhoneNumber?.trim() || undefined,
          Bio: formValue.Bio?.trim() || undefined,
          DateOfBirth: formValue.DateOfBirth || undefined
        };

        console.log('Sending registration data:', userData);
        console.log('API URL will be:', `${this.authService['apiUrl']}/register`);

        this.authService.register(userData).subscribe({
          next: async (response) => {
            console.log('Registration successful:', response);
            this.isLoading = false;
            await this.showToast('Registration successful! Please login with your credentials.', 'success');
            this.router.navigate(['/login']);
          },
          error: async (error) => {
            console.error('Registration error details:', {
              status: error.status,
              statusText: error.statusText,
              error: error.error,
              message: error.message,
              url: error.url
            });
            
            this.isLoading = false;
            let errorMessage = 'Registration failed';
            
            if (error.status === 409) {
              // Handle 409 Conflict specifically
              errorMessage = error.error || 'Username or email already exists. Please try different credentials.';
              console.log('409 Conflict - Username or Email already exists');
              console.log('Attempted Username:', userData.Username);
              console.log('Attempted Email:', userData.Email);
            } else if (error.error?.message) {
              errorMessage = error.error.message;
            } else if (error.message) {
              errorMessage = error.message;
            } else if (error.status === 0) {
              errorMessage = 'Unable to connect to server. Please check your connection.';
            } else if (error.status === 400) {
              errorMessage = 'Invalid registration data. Please check all fields.';
            }
            
            await this.showError(errorMessage);
          }
        });
      } catch (error: any) {
        console.error('Unexpected registration error:', error);
        this.isLoading = false;
        await this.showError(error.message || 'Registration failed');
      }
    } else {
      console.log('Form is invalid, cannot submit');
      this.getFormValidationStatus();
    }
  }

  // Debug method to check form validation status
  getFormValidationStatus() {
    console.log('=== FORM VALIDATION DEBUG ===');
    console.log('Form valid:', this.registerForm.valid);
    console.log('Form errors:', this.registerForm.errors);
    
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      console.log(`${key}:`, {
        value: control?.value,
        valid: control?.valid,
        errors: control?.errors,
        touched: control?.touched,
        dirty: control?.dirty
      });
    });
  }

  // Toggle password visibility
  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  // Toggle confirm password visibility
  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Check if form is ready for submission
  isFormReady(): boolean {
    // Check if all required fields are valid
    const requiredFields = ['Username', 'Email', 'Password', 'ConfirmPassword', 'Role'];
    const requiredFieldsValid = requiredFields.every(field => {
      const control = this.registerForm.get(field);
      return control && control.valid;
    });
    
    // Check if password match validator passes
    const passwordsMatch = !this.registerForm.errors?.['mismatch'];
    
    // Check if optional fields with values are valid
    const optionalFields = ['PhoneNumber', 'Bio'];
    const optionalFieldsValid = optionalFields.every(field => {
      const control = this.registerForm.get(field);
      return !control || !control.value || control.valid;
    });
    
    return requiredFieldsValid && passwordsMatch && optionalFieldsValid;
  }

  // Get specific validation messages for better UX
  getValidationMessage(fieldName: string): string {
    const control = this.registerForm.get(fieldName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    const errors = control.errors;
    if (errors['required']) {
      return `${fieldName} is required`;
    }
    if (errors['email']) {
      return 'Please enter a valid email address';
    }
    if (errors['minlength']) {
      return `${fieldName} must be at least ${errors['minlength'].requiredLength} characters`;
    }
    if (errors['maxlength']) {
      return `${fieldName} must not exceed ${errors['maxlength'].requiredLength} characters`;
    }
    if (errors['pattern'] && fieldName === 'Password') {
      return 'Password must contain at least 8 characters with uppercase, lowercase, number, and special character';
    }
    if (errors['pattern'] && fieldName === 'PhoneNumber') {
      return 'Please enter a valid phone number (10-15 digits)';
    }
    if (this.registerForm.errors?.['mismatch'] && fieldName === 'ConfirmPassword') {
      return 'Passwords do not match';
    }
    return '';
  }

  // Check if a specific field has errors
  hasFieldError(fieldName: string): boolean {
    const control = this.registerForm.get(fieldName);
    return !!(control && control.errors && control.touched);
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

  // Get character count for bio field
  getBioCharacterCount(): number {
    const bioValue = this.registerForm.get('Bio')?.value;
    return bioValue ? bioValue.length : 0;
  }

  // Check if bio is over character limit
  isBioOverLimit(): boolean {
    return this.getBioCharacterCount() > 500;
  }
} 