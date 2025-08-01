import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  documentAttach, cloudUpload, document, notifications, bug,
  menu, close, home, settings, cloudDownload 
} from 'ionicons/icons';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterOutlet, IonicModule]
})
export class AppComponent {
  constructor(private alertController: AlertController) {
    // Register the icons
    addIcons({ 
      'document-attach': documentAttach,
      'cloud-upload': cloudUpload,
      'document': document,
      'notifications': notifications,
      'bug': bug,
      'menu': menu,
      'close': close,
      'home': home,
      'settings': settings,
      'cloud-download': cloudDownload
    });
  }

  async confirmLogout() {
    const alert = await this.alertController.create({
      header: 'Confirm Logout',
      message: 'Are you sure you want to log out?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Logout',
          handler: () => {
            // Add your logout logic here
            // For example: this.authService.logout();
            console.log('User confirmed logout');
          }
        }
      ]
    });

    await alert.present();
  }
}
