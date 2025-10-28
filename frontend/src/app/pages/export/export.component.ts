import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExportService, ExportFilters } from '../../shared/services/export.service';
import { DatePickerComponent } from '../../shared/components/form/date-picker/date-picker.component';

@Component({
  selector: 'app-export',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePickerComponent],
  templateUrl: './export.component.html',
  styleUrl: './export.component.css'
})
export class ExportComponent {
  filters: ExportFilters = {};
  isExporting = false;
  successMessage = '';
  errorMessage = '';

  constructor(private exportService: ExportService) {}

  onStartDateChange(event: any) {
    this.filters.startDate = event.dateStr;
  }

  onEndDateChange(event: any) {
    this.filters.endDate = event.dateStr;
  }

  exportToExcel() {
    if (!this.validateFilters()) {
      return;
    }

    this.isExporting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.exportService.exportToExcel(this.filters).subscribe({
      next: (blob) => {
        const filename = `orders_export_${this.getDateString()}.xlsx`;
        this.exportService.downloadFile(blob, filename);
        this.successMessage = 'Excel file downloaded successfully!';
        this.isExporting = false;
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: (error) => {
        console.error('Error exporting to Excel:', error);
        this.errorMessage = 'Failed to export to Excel. Please try again.';
        this.isExporting = false;
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  exportToPDF() {
    if (!this.validateFilters()) {
      return;
    }

    this.isExporting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.exportService.exportToPDF(this.filters).subscribe({
      next: (blob) => {
        const filename = `orders_report_${this.getDateString()}.pdf`;
        this.exportService.downloadFile(blob, filename);
        this.successMessage = 'PDF file downloaded successfully!';
        this.isExporting = false;
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: (error) => {
        console.error('Error exporting to PDF:', error);
        this.errorMessage = 'Failed to export to PDF. Please try again.';
        this.isExporting = false;
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  validateFilters(): boolean {
    if (this.filters.startDate && this.filters.endDate) {
      const start = new Date(this.filters.startDate);
      const end = new Date(this.filters.endDate);
      if (start > end) {
        this.errorMessage = 'Start date must be before end date';
        setTimeout(() => this.errorMessage = '', 5000);
        return false;
      }
    }
    return true;
  }

  resetFilters() {
    this.filters = {};
    this.errorMessage = '';
    this.successMessage = '';
  }

  private getDateString(): string {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  }
}
