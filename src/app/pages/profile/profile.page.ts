import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonBackButton,
  IonIcon, IonItem, IonLabel, IonInput, IonTextarea, IonDatetime, IonNote, IonSpinner,
  ActionSheetController, AlertController, LoadingController
} from '@ionic/angular/standalone';
// Camera functionality will be implemented later
// import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  checkmark, create, camera, trash, close, save, lockClosed, 
  informationCircle, arrowBack
} from 'ionicons/icons';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonBackButton,
    IonIcon, IonItem, IonLabel, IonInput, IonTextarea, IonDatetime, IonNote, IonSpinner
  ]
})
export class ProfilePage implements OnInit {
  profileForm!: FormGroup;
  userProfile: any = {};
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  currentUserId: number = 0;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private toastService: ToastService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private actionSheetController: ActionSheetController,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {
    // Register icons
    addIcons({
      checkmark, create, camera, trash, close, save, lockClosed, 
      informationCircle, arrowBack
    });
    
    this.initializeForm();
  }

  ngOnInit() {
    this.loadUserProfile();
    
    // Check if we should start in edit mode
    this.route.queryParams.subscribe(params => {
      if (params['edit'] === 'true') {
        this.isEditMode = true;
      }
    });
  }

  initializeForm() {
    this.profileForm = this.formBuilder.group({
      firstName: ['', [Validators.maxLength(100)]],
      lastName: ['', [Validators.maxLength(100)]],
      username: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      phoneNumber: ['', [Validators.maxLength(20)]],
      dateOfBirth: [''],
      bio: ['', [Validators.maxLength(500)]]
    });
  }

  async loadUserProfile() {
    this.isLoading = true;
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        this.router.navigate(['/login']);
        return;
      }

      this.currentUserId = currentUser.userId;
      
      // Get detailed user profile
      const profileData = await this.userService.getUserProfile(this.currentUserId).toPromise();
      
      // Handle both camelCase and PascalCase from backend
      this.userProfile = {
        ...profileData,
        firstName: profileData.firstName || profileData.FirstName,
        lastName: profileData.lastName || profileData.LastName,
        phoneNumber: profileData.phoneNumber || profileData.PhoneNumber,
        bio: profileData.bio || profileData.Bio,
        dateOfBirth: profileData.dateOfBirth || profileData.DateOfBirth,
        businessEmail: profileData.businessEmail || profileData.BusinessEmail,
        createdAt: profileData.createdAt || profileData.CreatedAt,
        updatedAt: profileData.updatedAt || profileData.UpdatedAt,
        isFirstLogin: profileData.isFirstLogin || profileData.IsFirstLogin,
        userId: profileData.userId || profileData.UserId,
        username: profileData.username || profileData.Username,
        email: profileData.email || profileData.Email,
        role: profileData.role || profileData.Role
      };
      
      // Update form with user data
      this.profileForm.patchValue({
        firstName: this.userProfile.firstName || '',
        lastName: this.userProfile.lastName || '',
        username: this.userProfile.username || '',
        email: this.userProfile.email || '',
        phoneNumber: this.userProfile.phoneNumber || '',
        dateOfBirth: this.userProfile.dateOfBirth || '',
        bio: this.userProfile.bio || ''
      });

    } catch (error) {
      console.error('Error loading user profile:', error);
      this.toastService.showError('Failed to load profile information');
    } finally {
      this.isLoading = false;
    }
  }

  toggleEditMode() {
    if (this.isEditMode) {
      this.saveProfile();
    } else {
      this.isEditMode = true;
    }
  }

  async saveProfile() {
    if (this.profileForm.invalid) {
      await this.toastService.showError('Please fill in all required fields correctly');
      return;
    }

    this.isSaving = true;
    try {
      const formData = this.profileForm.value;
      const updateData = {
        userId: this.currentUserId,
        ...formData
      };

      await this.userService.updateUserProfile(updateData).toPromise();
      
      // Update local user profile
      this.userProfile = { ...this.userProfile, ...formData };
      
      this.isEditMode = false;
      await this.toastService.showSuccess('Profile updated successfully');

    } catch (error: any) {
      console.error('Error updating profile:', error);
      await this.toastService.showError(error.error?.message || 'Failed to update profile');
    } finally {
      this.isSaving = false;
    }
  }

  cancelEdit() {
    this.isEditMode = false;
    // Reset form to original values
    this.profileForm.patchValue({
      firstName: this.userProfile.firstName || '',
      lastName: this.userProfile.lastName || '',
      username: this.userProfile.username || '',
      email: this.userProfile.email || '',
      phoneNumber: this.userProfile.phoneNumber || '',
      dateOfBirth: this.userProfile.dateOfBirth || '',
      bio: this.userProfile.bio || ''
    });
  }

  async presentProfilePictureOptions() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Profile Picture',
      buttons: [
        {
          text: 'Take Photo',
          icon: 'camera',
          handler: () => {
            this.showCameraNotImplemented();
          }
        },
        {
          text: 'Choose from Gallery',
          icon: 'images',
          handler: () => {
            this.showCameraNotImplemented();
          }
        },
        {
          text: 'Remove Picture',
          icon: 'trash',
          role: 'destructive',
          handler: () => {
            this.removeProfilePicture();
          }
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async showCameraNotImplemented() {
    await this.toastService.showInfo('Camera functionality will be implemented in a future update');
  }

  async uploadProfilePicture(file: File) {
    const loading = await this.loadingController.create({
      message: 'Uploading profile picture...'
    });
    await loading.present();

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('imageFile', file);
      formData.append('userId', this.currentUserId.toString());

      const result = await this.userService.uploadProfilePicture(formData).toPromise();
      
      // Update profile picture URL
      this.userProfile.profilePictureUrl = result.profilePictureUrl;
      
      await this.toastService.showSuccess('Profile picture updated successfully');

    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      await this.toastService.showError(error.error?.message || 'Failed to upload profile picture');
    } finally {
      await loading.dismiss();
    }
  }

  async removeProfilePicture() {
    const alert = await this.alertController.create({
      header: 'Remove Profile Picture',
      message: 'Are you sure you want to remove your profile picture?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Remove',
          role: 'destructive',
          handler: async () => {
            try {
              await this.userService.deleteProfilePicture(this.currentUserId).toPromise();
              this.userProfile.profilePictureUrl = null;
              await this.toastService.showSuccess('Profile picture removed successfully');
            } catch (error: any) {
              console.error('Error removing profile picture:', error);
              await this.toastService.showError(error.error?.message || 'Failed to remove profile picture');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async changePassword() {
    const alert = await this.alertController.create({
      header: 'Change Password',
      inputs: [
        {
          name: 'currentPassword',
          type: 'password',
          placeholder: 'Current Password'
        },
        {
          name: 'newPassword',
          type: 'password',
          placeholder: 'New Password'
        },
        {
          name: 'confirmPassword',
          type: 'password',
          placeholder: 'Confirm New Password'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Change',
          handler: async (data) => {
            if (!data.currentPassword || !data.newPassword || !data.confirmPassword) {
              await this.toastService.showError('Please fill in all password fields');
              return false;
            }

            if (data.newPassword !== data.confirmPassword) {
              await this.toastService.showError('New passwords do not match');
              return false;
            }

            if (data.newPassword.length < 8) {
              await this.toastService.showError('New password must be at least 8 characters long');
              return false;
            }

            try {
              const changePasswordData = {
                userId: this.currentUserId,
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
                confirmNewPassword: data.confirmPassword
              };

              await this.userService.changePassword(changePasswordData).toPromise();
              await this.toastService.showSuccess('Password changed successfully');
              return true;
            } catch (error: any) {
              console.error('Error changing password:', error);
              await this.toastService.showError(error.error?.message || 'Failed to change password');
              return false;
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async confirmDeleteAccount() {
    const alert = await this.alertController.create({
      header: 'Delete Account',
      message: 'Are you sure you want to delete your account? This action cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.deleteAccount();
          }
        }
      ]
    });
    await alert.present();
  }

  async deleteAccount() {
    // This would typically require additional confirmation and admin approval
    await this.toastService.showError('Account deletion requires administrator approval. Please contact support.');
  }

  onImageError(event: any) {
    event.target.src = '/assets/default-avatar.png';
  }
}
