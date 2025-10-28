import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class InactivityService {
  private inactivityTimeout: any;
  private warningTimeout: any;

  // Configuration (in minutes)
  private readonly INACTIVITY_TIME = 15; // Logout after 15 minutes of inactivity
  private readonly WARNING_TIME = 13;    // Show warning 2 minutes before logout

  // Events to track user activity
  private readonly activityEvents = [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click'
  ];

  private isWarningShown = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService,
    private ngZone: NgZone
  ) {}

  /**
   * Start monitoring user activity
   */
  startWatching(): void {
    // Only watch if user is authenticated
    if (!this.authService.hasToken()) {
      return;
    }

    this.resetTimers();

    // Add event listeners for user activity
    this.activityEvents.forEach(event => {
      document.addEventListener(event, () => this.onUserActivity(), true);
    });
  }

  /**
   * Stop monitoring user activity
   */
  stopWatching(): void {
    this.clearTimers();

    // Remove event listeners
    this.activityEvents.forEach(event => {
      document.removeEventListener(event, () => this.onUserActivity(), true);
    });
  }

  /**
   * Reset inactivity timers when user is active
   */
  private onUserActivity(): void {
    // Run outside Angular zone to prevent change detection on every mouse move
    this.ngZone.runOutsideAngular(() => {
      this.resetTimers();
    });
  }

  /**
   * Reset all timers
   */
  private resetTimers(): void {
    this.clearTimers();
    this.isWarningShown = false;

    // Set warning timer (2 minutes before logout)
    this.warningTimeout = setTimeout(() => {
      this.ngZone.run(() => {
        this.showInactivityWarning();
      });
    }, this.WARNING_TIME * 60 * 1000);

    // Set logout timer
    this.inactivityTimeout = setTimeout(() => {
      this.ngZone.run(() => {
        this.logoutDueToInactivity();
      });
    }, this.INACTIVITY_TIME * 60 * 1000);
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.warningTimeout) {
      clearTimeout(this.warningTimeout);
      this.warningTimeout = null;
    }

    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = null;
    }
  }

  /**
   * Show warning before auto-logout
   */
  private showInactivityWarning(): void {
    if (!this.isWarningShown) {
      this.isWarningShown = true;
      this.toastService.warning(
        'You will be logged out in 2 minutes due to inactivity. Move your mouse to stay logged in.',
        8000
      );
    }
  }

  /**
   * Logout user due to inactivity
   */
  private logoutDueToInactivity(): void {
    this.toastService.info('You have been logged out due to inactivity.', 5000);
    this.authService.logout();
    this.stopWatching();
  }

  /**
   * Manually extend the session (call this when user performs important actions)
   */
  extendSession(): void {
    this.resetTimers();
  }
}
