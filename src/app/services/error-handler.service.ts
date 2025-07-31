import { Injectable } from '@angular/core';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  constructor(private notificationService: NotificationService) {}

  /**
   * Handle errors consistently across the application
   */
  handleError(error: any, context: string) {
    console.error(`Error in ${context}:`, error);
    
    let message = 'An unexpected error occurred';
    
    if (error.status === 400) {
      message = error.error?.message || 'Invalid request';
    } else if (error.status === 404) {
      message = 'Resource not found';
    } else if (error.status === 500) {
      message = 'Server error occurred';
    } else if (error.message) {
      message = error.message;
    }
    
    this.notificationService.showError(message);
  }

  /**
   * Handle specific error types
   */
  handleValidationError(error: any) {
    const message = error.error?.message || 'Validation failed';
    this.notificationService.showError(message);
  }

  /**
   * Handle network errors
   */
  handleNetworkError(error: any) {
    const message = 'Network error. Please check your connection and try again.';
    this.notificationService.showError(message);
  }

  /**
   * Handle authentication errors
   */
  handleAuthError(error: any) {
    const message = 'Authentication failed. Please log in again.';
    this.notificationService.showError(message);
  }
} 