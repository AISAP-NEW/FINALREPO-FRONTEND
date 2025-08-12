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
            role: detailedProfile.role || detailedProfile.Role
          };
          this.userProfile = { ...this.userProfile, ...normalizedProfile };
        } catch (error) {
          console.warn('Could not load detailed profile:', error);
          // Continue with basic profile info
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
          role: detailedProfile.role || detailedProfile.Role
        };
        this.userProfile = { ...this.userProfile, ...normalizedProfile };
      }
    } catch (error) {
      console.warn('Could not refresh profile data:', error);
    } finally {
      await loading.dismiss();
    }
  }



  onImageError(event: any) {
    event.target.src = '/assets/default-avatar.png';
  }
}
