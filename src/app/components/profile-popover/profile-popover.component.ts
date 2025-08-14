import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  IonIcon, IonButton, PopoverController 
} from '@ionic/angular/standalone';
import { UserService } from '../../services/user.service';
import { addIcons } from 'ionicons';
import { 
  callOutline, businessOutline, calendarOutline, informationCircleOutline,
  createOutline, personOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-profile-popover',
  templateUrl: './profile-popover.component.html',
  styleUrls: ['./profile-popover.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon, IonButton]
})
export class ProfilePopoverComponent implements OnInit {
  @Input() userProfile: any;
  cachedProfilePictureUrl: string = '/assets/default-avatar.png';

  constructor(
    private router: Router,
    private popoverController: PopoverController,
    private userService: UserService
  ) {
    // Register icons
    addIcons({
      callOutline, businessOutline, calendarOutline, informationCircleOutline,
      createOutline, personOutline
    });
  }

  ngOnInit() {
    this.updateProfilePictureUrl();
  }

  private updateProfilePictureUrl() {
    console.log('ProfilePopover: Updating profile picture URL:', this.userProfile?.profilePictureUrl);
    
    this.cachedProfilePictureUrl = this.userService.processProfilePictureUrl(
      this.userProfile?.profilePictureUrl,
      this.userProfile?.userId
    );
    
    console.log('ProfilePopover: Profile picture URL updated to:', this.cachedProfilePictureUrl);
  }

  getProfilePictureUrl(): string {
    return this.cachedProfilePictureUrl;
  }

  async editProfile() {
    // Close the popover first
    await this.popoverController.dismiss();
    // Navigate to profile page in edit mode
    this.router.navigate(['/profile'], { queryParams: { edit: 'true' } });
  }

  async viewFullProfile() {
    // Close the popover first
    await this.popoverController.dismiss();
    // Navigate to profile page
    this.router.navigate(['/profile']);
  }

  onImageError(event: any) {
    console.warn('ProfilePopover: Profile picture failed to load, using default avatar');
    event.target.src = '/assets/default-avatar.png';
    this.cachedProfilePictureUrl = '/assets/default-avatar.png';
  }
}
