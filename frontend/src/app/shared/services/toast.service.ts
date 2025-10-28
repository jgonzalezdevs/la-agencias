import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toasts.asObservable();
  private nextId = 1;

  /**
   * Show a success toast notification
   */
  success(message: string, duration: number = 3000): void {
    this.show(message, 'success', duration);
  }

  /**
   * Show an error toast notification
   */
  error(message: string, duration: number = 5000): void {
    this.show(message, 'error', duration);
  }

  /**
   * Show a warning toast notification
   */
  warning(message: string, duration: number = 4000): void {
    this.show(message, 'warning', duration);
  }

  /**
   * Show an info toast notification
   */
  info(message: string, duration: number = 3000): void {
    this.show(message, 'info', duration);
  }

  /**
   * Show a toast notification
   */
  private show(message: string, type: Toast['type'], duration: number): void {
    const toast: Toast = {
      id: this.nextId++,
      message,
      type,
      duration
    };

    const currentToasts = this.toasts.value;
    this.toasts.next([...currentToasts, toast]);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(toast.id);
      }, duration);
    }
  }

  /**
   * Remove a specific toast
   */
  remove(id: number): void {
    const currentToasts = this.toasts.value.filter(t => t.id !== id);
    this.toasts.next(currentToasts);
  }

  /**
   * Clear all toasts
   */
  clear(): void {
    this.toasts.next([]);
  }
}
