import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { PopoverController, LoadingController } from '@ionic/angular/standalone';
import { ProfilePopoverComponent } from '../profile-popover/profile-popover.component';

@Component({
  selector: 'app-profile-icon',
  templateUrl: './profile-icon.component.html',
  styleUrls: ['./profile-icon.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ProfileIconComponent implements OnInit {
  @Input() showDetails = false;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  
  userProfile: any = null;
  isOnline = true; // For future online status implementation
  cachedProfilePictureUrl: string = '/assets/default-avatar.png';

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
    private popoverController: PopoverController,
    private loadingController: LoadingController
  ) {}

  ngOnInit() {
    this.loadUserProfile();
  }

  async loadUserProfile() {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        // Get basic user info from auth service
        this.userProfile = {
          userId: currentUser.userId,
          username: currentUser.username,
          email: currentUser.email,
          role: currentUser.role,
          profilePictureUrl: currentUser.profilePictureUrl
        };

        // Always fetch detailed profile from backend for popover
        try {
          const detailedProfile = await this.userService.getUserProfile(currentUser.userId).toPromise();
                  // Handle both camelCase and PascalCase from backend
        const normalizedProfile = {
          ...detailedProfile,
          firstName: detailedProfile.firstName || detailedProfile.FirstName,
          lastName: detailedProfile.lastName || detailedProfile.LastName,
          phoneNumber: detailedProfile.phoneNumber || detailedProfile.PhoneNumber,
          bio: detailedProfile.bio || detailedProfile.Bio,
          dateOfBirth: detailedProfile.dateOfBirth || detailedProfile.DateOfBirth,
          businessEmail: detailedProfile.businessEmail || detailedProfile.BusinessEmail,
          createdAt: detailedProfile.createdAt || detailedProfile.CreatedAt,
          updatedAt: detailedProfile.updatedAt || detailedProfile.UpdatedAt,
          isFirstLogin: detailedProfile.isFirstLogin || detailedProfile.IsFirstLogin,
          userId: detailedProfile.userId || detailedProfile.UserId,
          username: detailedProfile.username || detailedProfile.Username,
          email: detailedProfile.email || detailedProfile.Email,
          role: detailedProfile.role || detailedProfile.Role,
          profilePictureUrl: detailedProfile.profilePictureUrl || detailedProfile.ProfilePictureUrl || '/assets/default-avatar.png'
        };
          this.userProfile = { ...this.userProfile, ...normalizedProfile };
          this.updateProfilePictureUrl();
        } catch (error) {
          console.warn('Could not load detailed profile:', error);
          // Continue with basic profile info
          this.updateProfilePictureUrl();
        }
      }
    } catch (error) {
      console.error('Error loading user profile for icon:', error);
      // Set default values
      this.userProfile = {
        username: 'User',
        role: 'Member',
        profilePictureUrl: null
      };
      this.updateProfilePictureUrl();
    }
  }

  async showProfilePopover(event: Event) {
    // Ensure we have the latest profile data
    await this.refreshProfileData();

    const popover = await this.popoverController.create({
      component: ProfilePopoverComponent,
      componentProps: {
        userProfile: this.userProfile
      },
      event: event,
      translucent: true,
      showBackdrop: true,
      cssClass: 'profile-popover'
    });

    await popover.present();
  }

  async refreshProfileData() {
    const loading = await this.loadingController.create({
      message: 'Loading profile...',
      duration: 2000
    });

    try {
      await loading.present();
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        const detailedProfile = await this.userService.getUserProfile(currentUser.userId).toPromise();
        // Handle both camelCase and PascalCase from backend
        const normalizedProfile = {
          ...detailedProfile,
          firstName: detailedProfile.firstName || detailedProfile.FirstName,
          lastName: detailedProfile.lastName || detailedProfile.LastName,
          phoneNumber: detailedProfile.phoneNumber || detailedProfile.PhoneNumber,
          bio: detailedProfile.bio || detailedProfile.Bio,
          dateOfBirth: detailedProfile.dateOfBirth || detailedProfile.DateOfBirth,
          businessEmail: detailedProfile.businessEmail || detailedProfile.BusinessEmail,
          createdAt: detailedProfile.createdAt || detailedProfile.CreatedAt,
          updatedAt: detailedProfile.updatedAt || detailedProfile.UpdatedAt,
          isFirstLogin: detailedProfile.isFirstLogin || detailedProfile.IsFirstLogin,
          userId: detailedProfile.userId || detailedProfile.UserId,
          username: detailedProfile.username || detailedProfile.Username,
          email: detailedProfile.email || detailedProfile.Email,
          role: detailedProfile.role || detailedProfile.Role,
          profilePictureUrl: detailedProfile.profilePictureUrl || detailedProfile.ProfilePictureUrl || '/assets/default-avatar.png'
        };
        this.userProfile = { ...this.userProfile, ...normalizedProfile };
        this.updateProfilePictureUrl();
      }
    } catch (error) {
      console.warn('Could not refresh profile data:', error);
    } finally {
      await loading.dismiss();
    }
  }

  // Method to update the cached profile picture URL
  private updateProfilePictureUrl() {
    console.log('ProfileIcon: Updating profile picture URL:', this.userProfile?.profilePictureUrl);
    
    this.cachedProfilePictureUrl = this.userService.processProfilePictureUrl(
      this.userProfile?.profilePictureUrl, 
      this.userProfile?.userId
    );
    
    console.log('ProfileIcon: Profile picture URL updated to:', this.cachedProfilePictureUrl);
  }

  // Method to get cached profile picture URL
  getProfilePictureUrl(): string {
    return this.cachedProfilePictureUrl;
  }

  onImageError(event: any) {
    console.warn('ProfileIcon: Profile picture failed to load, using default avatar');
    event.target.src = '/assets/default-avatar.png';
    this.cachedProfilePictureUrl = '/assets/default-avatar.png';
  }

  // Method to manually refresh profile data (can be called from other components)
  async forceRefresh() {
    console.log('ProfileIcon: Force refresh requested');
    await this.loadUserProfile();
  }
}
