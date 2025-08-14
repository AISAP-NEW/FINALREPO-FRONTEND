import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonBackButton,
  IonIcon, IonItem, IonLabel, IonInput, IonTextarea, IonNote, IonSpinner, IonBadge,
  ActionSheetController, AlertController, LoadingController
} from '@ionic/angular/standalone';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  checkmark, create, camera, trash, close, save, lockClosed, 
  informationCircle, arrowBack, checkmarkCircleOutline, personCircle,
  person, briefcase, settings, refresh, checkmarkCircle
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
    IonIcon, IonItem, IonLabel, IonInput, IonTextarea, IonNote, IonSpinner, IonBadge
  ]
})
export class ProfilePage implements OnInit {
  profileForm!: FormGroup;
  userProfile: any = {};
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  currentUserId: number = 0;
  profilePictureFile: File | null = null;
  cachedProfilePictureUrl: string = '/assets/default-avatar.png';

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
      informationCircle, arrowBack, checkmarkCircleOutline, personCircle,
      person, briefcase, settings, refresh, checkmarkCircle
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
      
      if (!profileData) {
        throw new Error('No profile data received');
      }
      
      console.log('Profile data loaded:', profileData);
      
      // Handle both camelCase and PascalCase from backend
      this.userProfile = {
        ...profileData,
        firstName: profileData.firstName || profileData.FirstName || '',
        lastName: profileData.lastName || profileData.LastName || '',
        phoneNumber: profileData.phoneNumber || profileData.PhoneNumber || '',
        bio: profileData.bio || profileData.Bio || '',
        dateOfBirth: profileData.dateOfBirth || profileData.DateOfBirth || null,
        businessEmail: profileData.businessEmail || profileData.BusinessEmail || '',
        createdAt: profileData.createdAt || profileData.CreatedAt || new Date().toISOString(),
        updatedAt: profileData.updatedAt || profileData.UpdatedAt || null,
        isFirstLogin: profileData.isFirstLogin || profileData.IsFirstLogin || false,
        userId: profileData.userId || profileData.UserId || this.currentUserId,
        username: profileData.username || profileData.Username || currentUser.username,
        email: profileData.email || profileData.Email || currentUser.email,
        role: profileData.role || profileData.Role || currentUser.role,
        profilePictureUrl: profileData.profilePictureUrl || profileData.ProfilePictureUrl || '/assets/default-avatar.png'
      };
      
      console.log('User profile processed:', this.userProfile);
      console.log('Profile picture URL:', this.userProfile.profilePictureUrl);
      
      // Update cached profile picture URL
      this.updateProfilePictureUrl();
      
      // Format date of birth for display
      let formattedDateOfBirth = '';
      if (this.userProfile.dateOfBirth) {
        try {
          const date = new Date(this.userProfile.dateOfBirth);
          if (!isNaN(date.getTime())) {
            formattedDateOfBirth = date.toISOString().split('T')[0]; // YYYY-MM-DD format
          }
        } catch (e) {
          console.warn('Could not parse date of birth:', this.userProfile.dateOfBirth);
        }
      }
      
      // Update form with user data
      this.profileForm.patchValue({
        firstName: this.userProfile.firstName || '',
        lastName: this.userProfile.lastName || '',
        username: this.userProfile.username || '',
        email: this.userProfile.email || '',
        phoneNumber: this.userProfile.phoneNumber || '',
        dateOfBirth: formattedDateOfBirth,
        bio: this.userProfile.bio || ''
      });

    } catch (error) {
      console.error('Error loading user profile:', error);
      this.toastService.showError('Failed to load profile information. Please try again.');
      
      // Fallback to current user data if profile loading fails
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        this.userProfile = {
          userId: currentUser.userId,
          username: currentUser.username,
          email: currentUser.email,
          role: currentUser.role,
          firstName: '',
          lastName: '',
          phoneNumber: '',
          bio: '',
          dateOfBirth: null,
          businessEmail: '',
          createdAt: new Date().toISOString(),
          updatedAt: null,
          isFirstLogin: false,
          profilePictureUrl: '/assets/default-avatar.png'
        };
        
        // Update cached profile picture URL for fallback case
        this.updateProfilePictureUrl();
      }
    } finally {
      this.isLoading = false;
    }
  }

  // Method to manually refresh the entire profile
  async refreshProfile() {
    console.log('Manually refreshing profile...');
    await this.loadUserProfile();
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
      
      // Convert date string back to Date object for backend
      let dateOfBirth: Date | null = null;
      if (formData.dateOfBirth) {
        try {
          const parsedDate = new Date(formData.dateOfBirth);
          if (!isNaN(parsedDate.getTime())) {
            dateOfBirth = parsedDate;
          }
        } catch (e) {
          dateOfBirth = null;
        }
      }
      
      const updateData = {
        userId: this.currentUserId,
        ...formData,
        dateOfBirth: dateOfBirth
      };

      console.log('Updating profile with data:', updateData);
      
      const result = await this.userService.updateUserProfile(updateData).toPromise();
      console.log('Profile update result:', result);
      
      // Update local user profile
      this.userProfile = { ...this.userProfile, ...formData };
      
      // Upload profile picture if selected
      if (this.profilePictureFile) {
        await this.uploadProfilePicture(this.profilePictureFile);
        this.profilePictureFile = null;
      }
      
      this.isEditMode = false;
      await this.toastService.showSuccess('Profile updated successfully');

    } catch (error: any) {
      console.error('Error updating profile:', error);
      if (error.message !== 'SUCCESS') {
        await this.toastService.showError(error.message || 'Failed to update profile. Please try again.');
      } else {
        // Success case
        this.isEditMode = false;
        await this.toastService.showSuccess('Profile updated successfully');
      }
    } finally {
      this.isSaving = false;
    }
  }

  cancelEdit() {
    this.isEditMode = false;
    this.profilePictureFile = null;
    // Reset form to original values
    this.profileForm.patchValue({
      firstName: this.userProfile.firstName || '',
      lastName: this.userProfile.lastName || '',
      username: this.userProfile.username || '',
      email: this.userProfile.email || '',
      phoneNumber: this.userProfile.phoneNumber || '',
      dateOfBirth: this.userProfile.dateOfBirth ? new Date(this.userProfile.dateOfBirth).toISOString().split('T')[0] : '',
      bio: this.userProfile.bio || ''
    });
  }

  async presentProfilePictureOptions() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Profile Picture',
      buttons: [
        {
          text: 'Choose from Gallery',
          icon: 'images',
          handler: () => {
            this.selectProfilePicture();
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

  selectProfilePicture() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.profilePictureFile = file;
        this.toastService.showSuccess('Profile picture selected. Click save to upload.');
      }
    };
    input.click();
  }

  async uploadProfilePicture(file: File) {
    const loading = await this.loadingController.create({
      message: 'Uploading profile picture...'
    });
    await loading.present();

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('ImageFile', file);
      formData.append('UserId', this.currentUserId.toString());

      console.log('Uploading profile picture for user:', this.currentUserId);
      
      const result = await this.userService.uploadProfilePicture(formData).toPromise();
      console.log('Profile picture upload result:', result);
      
      // Update profile picture URL - handle both response formats
      if (result && (result.profilePictureUrl || result.ProfilePictureUrl)) {
        const newUrl = result.profilePictureUrl || result.ProfilePictureUrl;
        this.userProfile.profilePictureUrl = newUrl;
        
        // Update cached URL and force Angular to detect the change
        this.updateProfilePictureUrl();
        this.userProfile = { ...this.userProfile };
        
        console.log('Profile picture URL updated to:', newUrl);
        
        // Also update the auth service with the new profile picture URL
        this.updateAuthServiceProfilePicture(newUrl);
      } else {
        console.log('No specific profile picture URL in response, using endpoint-based approach');
        // Even if no URL in response, we can still use the endpoint approach
        // Just mark that the user has a profile picture (not default)
        this.userProfile.profilePictureUrl = 'uploaded'; // Non-default indicator
        this.updateProfilePictureUrl();
        this.userProfile = { ...this.userProfile };
        
        // Try to refresh from server as well
        await this.refreshProfilePicture();
      }
      
      // Add a small delay to ensure the backend has processed the upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try to refresh the profile picture one more time to ensure it's displayed
      await this.refreshProfilePicture();
      
      // Force refresh with cache busting to ensure immediate display
      this.forceRefreshProfilePicture();
      
      await this.toastService.showSuccess('Profile picture updated successfully');

    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      if (error.message !== 'SUCCESS') {
        await this.toastService.showError(error.message || 'Failed to upload profile picture');
      } else {
        // Success case - try to get the updated profile picture URL
        await this.refreshProfilePicture();
        await this.toastService.showSuccess('Profile picture updated successfully');
      }
    } finally {
      await loading.dismiss();
    }
  }

  async refreshProfilePicture() {
    try {
      console.log('Refreshing profile picture from server...');
      const profileData = await this.userService.getUserProfile(this.currentUserId).toPromise();
      console.log('Profile data received:', profileData);
      
      if (profileData && (profileData.profilePictureUrl || profileData.ProfilePictureUrl)) {
        const newUrl = profileData.profilePictureUrl || profileData.ProfilePictureUrl;
        this.userProfile.profilePictureUrl = newUrl;
        
        // Update cached URL and force Angular to detect the change
        this.updateProfilePictureUrl();
        this.userProfile = { ...this.userProfile };
        
        // Also update the auth service
        this.updateAuthServiceProfilePicture(newUrl);
        
        console.log('Profile picture refreshed from server:', newUrl);
      } else {
        console.warn('No profile picture URL found in profile data');
      }
    } catch (error) {
      console.warn('Could not refresh profile picture:', error);
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
              this.userProfile.profilePictureUrl = '/assets/default-avatar.png';
              await this.toastService.showSuccess('Profile picture removed successfully');
            } catch (error: any) {
              console.error('Error removing profile picture:', error);
              if (error.message !== 'SUCCESS') {
                await this.toastService.showError(error.message || 'Failed to remove profile picture');
              } else {
                this.userProfile.profilePictureUrl = '/assets/default-avatar.png';
                await this.toastService.showSuccess('Profile picture removed successfully');
              }
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
              if (error.message !== 'SUCCESS') {
                await this.toastService.showError(error.message || 'Failed to change password');
              } else {
                await this.toastService.showSuccess('Password changed successfully');
              }
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
    console.warn('Profile picture failed to load, using default avatar');
    event.target.src = '/assets/default-avatar.png';
  }

  // Helper method to format date for display
  formatDate(date: any): string {
    if (!date) return '';
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return '';
      return dateObj.toLocaleDateString();
    } catch (e) {
      return '';
    }
  }

  // Helper method to get profile picture URL (cached to prevent constant reloading)
  getProfilePictureUrl(): string {
    return this.cachedProfilePictureUrl;
  }

  // Method to update the cached profile picture URL
  private updateProfilePictureUrl() {
    console.log('Updating profile picture URL:', this.userProfile.profilePictureUrl);
    
    this.cachedProfilePictureUrl = this.userService.processProfilePictureUrl(
      this.userProfile?.profilePictureUrl,
      this.userProfile?.userId
    );
    
    console.log('Profile picture URL updated to:', this.cachedProfilePictureUrl);
  }

  // Method to test if profile picture URL is accessible
  async testProfilePictureUrl(): Promise<boolean> {
    try {
      const url = this.userProfile.profilePictureUrl;
      if (!url || url === '/assets/default-avatar.png') {
        await this.toastService.showInfo('Using default avatar - no custom profile picture set');
        return false;
      }
      
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        await this.toastService.showSuccess('Profile picture URL is accessible');
        return true;
      } else {
        await this.toastService.showError('Profile picture URL is not accessible');
        return false;
      }
    } catch (error) {
      console.warn('Profile picture URL test failed:', error);
      await this.toastService.showError('Failed to test profile picture URL');
      return false;
    }
  }

  // Method to force refresh profile picture with cache busting
  forceRefreshProfilePicture() {
    if (this.userProfile.profilePictureUrl && this.userProfile.profilePictureUrl !== '/assets/default-avatar.png') {
      // Add cache busting parameter
      const timestamp = new Date().getTime();
      const baseUrl = this.userProfile.profilePictureUrl.split('?')[0]; // Remove existing query params
      
      let profileUrl = baseUrl;
      if (profileUrl.startsWith('/') && !profileUrl.startsWith('//')) {
        profileUrl = `http://localhost:5183${profileUrl}`;
      }
      
      this.cachedProfilePictureUrl = `${profileUrl}?t=${timestamp}`;
      console.log('Force refreshed profile picture with cache busting:', this.cachedProfilePictureUrl);
    }
  }

  // Method to update the auth service with new profile picture URL
  private updateAuthServiceProfilePicture(profilePictureUrl: string) {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          profilePictureUrl: profilePictureUrl,
          ProfilePictureUrl: profilePictureUrl
        };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        console.log('Updated auth service profile picture URL:', profilePictureUrl);
      }
    } catch (error) {
      console.warn('Could not update auth service profile picture:', error);
    }
  }
}
