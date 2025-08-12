import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor(private toastController: ToastController) {}

  async presentToast(
    type: ToastType,
    message: string,
    duration: number = 3000
  ): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration,
      color: this.getColorForType(type),
      position: 'bottom',
      buttons: [
        {
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  private getColorForType(type: ToastType): string {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'primary';
    }
  }

  // Convenience methods
  async showSuccess(message: string, duration: number = 3000): Promise<void> {
    return this.presentToast('success', message, duration);
  }

  async showError(message: string, duration: number = 3000): Promise<void> {
    return this.presentToast('error', message, duration);
  }

  async showWarning(message: string, duration: number = 3000): Promise<void> {
    return this.presentToast('warning', message, duration);
  }

  async showInfo(message: string, duration: number = 3000): Promise<void> {
    return this.presentToast('info', message, duration);
  }
}
