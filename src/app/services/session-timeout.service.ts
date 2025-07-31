import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, fromEvent, merge, timer, Subscription } from 'rxjs';
import { debounceTime, tap, switchMap, takeUntil } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SessionTimeoutService {
  private readonly TIMEOUT_DURATION = 90000; // 30 seconds in milliseconds
  private readonly WARNING_DURATION = 10000; // Show warning 10 seconds before timeout
  
  private timeoutTimer?: Subscription;
  private warningTimer?: Subscription;
  private activitySubscription?: Subscription;
  
  private isWarningShown = new BehaviorSubject<boolean>(false);
  private timeRemaining = new BehaviorSubject<number>(0);
  
  // Observable streams
  public isWarningShown$ = this.isWarningShown.asObservable();
  public timeRemaining$ = this.timeRemaining.asObservable();
  
  // Activity events to monitor
  private activityEvents = [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click'
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone
  ) {
    console.log('SessionTimeoutService initialized');
  }

  /**
   * Start monitoring user activity and session timeout
   */
  startMonitoring(): void {
    if (!this.authService.isAuthenticated()) {
      console.log('User not authenticated, skipping session monitoring');
      return;
    }

    console.log('Starting session timeout monitoring...');
    this.resetTimeout();
    this.setupActivityListeners();
  }

  /**
   * Stop monitoring (called on logout or component destruction)
   */
  stopMonitoring(): void {
    console.log('Stopping session timeout monitoring...');
    this.clearTimers();
    this.clearActivityListeners();
    this.isWarningShown.next(false);
    this.timeRemaining.next(0);
  }

  /**
   * Reset the timeout timer (called on user activity)
   */
  private resetTimeout(): void {
    this.clearTimers();
    this.isWarningShown.next(false);
    
    console.log(`Setting timeout for ${this.TIMEOUT_DURATION / 1000} seconds`);
    
    // Start warning timer (shows warning before actual timeout)
    const warningTime = this.TIMEOUT_DURATION - this.WARNING_DURATION;
    if (warningTime > 0) {
      this.warningTimer = timer(warningTime).subscribe(() => {
        this.showTimeoutWarning();
      });
    }
    
    // Start main timeout timer
    this.timeoutTimer = timer(this.TIMEOUT_DURATION).subscribe(() => {
      this.handleTimeout();
    });
  }

  /**
   * Setup listeners for user activity events
   */
  private setupActivityListeners(): void {
    this.clearActivityListeners();
    
    // Create observables for all activity events
    const activityObservables = this.activityEvents.map(event =>
      fromEvent(document, event, { passive: true })
    );
    
    // Merge all activity events and debounce to avoid excessive resets
    this.activitySubscription = merge(...activityObservables)
      .pipe(
        debounceTime(1000), // Wait 1 second after last activity
        tap(() => console.log('User activity detected'))
      )
      .subscribe(() => {
        this.resetTimeout();
      });
  }

  /**
   * Show timeout warning to user
   */
  private showTimeoutWarning(): void {
    console.log('Showing timeout warning');
    this.isWarningShown.next(true);
    
    // Start countdown timer for remaining time
    const remainingTime = this.WARNING_DURATION / 1000;
    this.timeRemaining.next(remainingTime);
    
    // Update countdown every second
    timer(0, 1000)
      .pipe(
        takeUntil(timer(this.WARNING_DURATION))
      )
      .subscribe(tick => {
        const remaining = remainingTime - tick;
        this.timeRemaining.next(Math.max(0, remaining));
      });
  }

  /**
   * Handle session timeout - log user out
   */
  private handleTimeout(): void {
    console.log('Session timeout - logging user out');
    
    this.ngZone.run(() => {
      // Force close any warning modal first
      this.isWarningShown.next(false);
      this.stopMonitoring();
      
      // Clear any existing authentication state first
      localStorage.removeItem('currentUser');
      
      // Show timeout message (non-blocking)
      this.showTimeoutMessage();
      
      // Force logout immediately - no delay needed
      this.authService.logout();
    });
  }

  /**
   * Show timeout message to user (non-blocking)
   */
  private showTimeoutMessage(): void {
    console.log('Session expired due to inactivity - redirecting to login');
    
    // Create a non-blocking notification
    if (typeof document !== 'undefined') {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f04141;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        max-width: 300px;
      `;
      notification.textContent = 'Session expired - redirecting to login...';
      document.body.appendChild(notification);
      
      // Remove notification after 3 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 3000);
    }
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.timeoutTimer) {
      this.timeoutTimer.unsubscribe();
      this.timeoutTimer = undefined;
    }
    
    if (this.warningTimer) {
      this.warningTimer.unsubscribe();
      this.warningTimer = undefined;
    }
  }

  /**
   * Clear activity listeners
   */
  private clearActivityListeners(): void {
    if (this.activitySubscription) {
      this.activitySubscription.unsubscribe();
      this.activitySubscription = undefined;
    }
  }

  /**
   * Extend session (called when user clicks "Stay logged in" on warning)
   */
  extendSession(): void {
    console.log('Session extended by user');
    this.resetTimeout();
  }

  /**
   * Get current timeout duration in seconds
   */
  getTimeoutDuration(): number {
    return this.TIMEOUT_DURATION / 1000;
  }

  /**
   * Check if session is currently active
   */
  isSessionActive(): boolean {
    return this.authService.isAuthenticated() && (this.timeoutTimer !== undefined);
  }
}
