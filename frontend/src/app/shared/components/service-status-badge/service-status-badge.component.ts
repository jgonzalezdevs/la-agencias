import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceStatus } from '../../services/orders.service';

@Component({
  selector: 'app-service-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="getBadgeClass()">
      <span class="flex items-center gap-1">
        <span [class]="getDotClass()"></span>
        {{ getStatusLabel() }}
      </span>
    </span>
  `
})
export class ServiceStatusBadgeComponent {
  @Input() status!: ServiceStatus;

  getBadgeClass(): string {
    const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';

    switch (this.status) {
      case 'activo':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`;
      case 'cancelado':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`;
      case 'postpuesto':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400`;
    }
  }

  getDotClass(): string {
    const baseClasses = 'w-1.5 h-1.5 rounded-full';

    switch (this.status) {
      case 'activo':
        return `${baseClasses} bg-green-600 dark:bg-green-400`;
      case 'cancelado':
        return `${baseClasses} bg-red-600 dark:bg-red-400`;
      case 'postpuesto':
        return `${baseClasses} bg-yellow-600 dark:bg-yellow-400`;
      default:
        return `${baseClasses} bg-gray-600 dark:bg-gray-400`;
    }
  }

  getStatusLabel(): string {
    switch (this.status) {
      case 'activo':
        return 'Activo';
      case 'cancelado':
        return 'Cancelado';
      case 'postpuesto':
        return 'Postpuesto';
      default:
        return this.status;
    }
  }
}
