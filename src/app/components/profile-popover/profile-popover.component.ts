import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  IonIcon, IonButton, PopoverController 
} from '@ionic/angular/standalone';
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
export class ProfilePopoverComponent {
  @Input() userProfile: any;

  constructor(
    private router: Router,
    private popoverController: PopoverController
  ) {
    // Register icons
    addIcons({
      callOutline, businessOutline, calendarOutline, informationCircleOutline,
      createOutline, personOutline
    });
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
    event.target.src = '/assets/default-avatar.png';
  }
}
