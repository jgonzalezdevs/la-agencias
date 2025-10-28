import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      @for (toast of toasts$ | async; track toast.id) {
        <div
          [class]="getToastClasses(toast.type)"
          class="pointer-events-auto transform transition-all duration-300 ease-in-out shadow-lg rounded-lg p-4 min-w-[300px] max-w-[400px] flex items-start gap-3"
          (click)="remove(toast.id)"
        >
          <!-- Icon -->
          <div class="flex-shrink-0">
            @switch (toast.type) {
              @case ('success') {
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
              }
              @case ('error') {
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
              }
              @case ('warning') {
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
              }
              @case ('info') {
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                </svg>
              }
            }
          </div>

          <!-- Message -->
          <div class="flex-1 text-sm font-medium">
            {{ toast.message }}
          </div>

          <!-- Close button -->
          <button
            type="button"
            class="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            (click)="remove(toast.id)"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class ToastContainerComponent {
  toasts$;

  constructor(private toastService: ToastService) {
    this.toasts$ = this.toastService.toasts$;
  }

  remove(id: number): void {
    this.toastService.remove(id);
  }

  getToastClasses(type: Toast['type']): string {
    const baseClasses = 'animate-slide-in';
    const typeClasses = {
      success: 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800',
      error: 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800',
      warning: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800',
      info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800'
    };
    return `${baseClasses} ${typeClasses[type]}`;
  }
}
