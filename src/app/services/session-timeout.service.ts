import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, fromEvent, merge, timer, Subscription } from 'rxjs';
import { debounceTime, tap, switchMap, takeUntil } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SessionTimeoutService {
  // Disabled timeout - set to a very large value (24 hours)
  private readonly TIMEOUT_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
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
    console.log('SessionTimeoutService initialized - TIMEOUT DISABLED');
  }

  /**
   * Start monitoring user activity and session timeout
   */
  startMonitoring(): void {
    if (!this.authService.isAuthenticated()) {
      console.log('User not authenticated, skipping session monitoring');
      return;
    }

    console.log('Starting session timeout monitoring... (TIMEOUT DISABLED)');
    // Don't actually start timers since timeout is disabled
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
    
    console.log(`Session timeout disabled - no timeout will occur`);
    
    // Don't start any timers since timeout is disabled
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
        tap(() => console.log('User activity detected (timeout disabled)'))
      )
      .subscribe(() => {
        // Don't reset timeout since it's disabled
        console.log('Activity detected but timeout is disabled');
      });
  }

  /**
   * Show timeout warning to user
   */
  private showTimeoutWarning(): void {
    console.log('Timeout warning disabled');
    // Don't show warning since timeout is disabled
  }

  /**
   * Handle session timeout - log user out
   */
  private handleTimeout(): void {
    console.log('Session timeout disabled - no logout will occur');
    // Don't handle timeout since it's disabled
  }

  /**
   * Show timeout message to user (non-blocking)
   */
  private showTimeoutMessage(): void {
    console.log('Session timeout disabled - no timeout message');
    // Don't show timeout message since timeout is disabled
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
    console.log('Session extended by user (timeout disabled)');
    // Don't reset timeout since it's disabled
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
    return this.authService.isAuthenticated();
  }
}
