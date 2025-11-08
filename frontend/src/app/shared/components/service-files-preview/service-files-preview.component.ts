import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceImage } from '../../services/orders.service';

@Component({
  selector: 'app-service-files-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './service-files-preview.component.html'
})
export class ServiceFilesPreviewComponent {
  @Input() images: ServiceImage[] = [];
  @Input() showTitle: boolean = true;

  get validImages(): ServiceImage[] {
    // Filter out images with invalid URLs
    return this.images.filter(img => this.isValidUrl(img.image_url));
  }

  isValidUrl(url: string): boolean {
    // Check if URL is not empty and has a filename (not just the upload path)
    if (!url || url.trim() === '') return false;
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1];
    return filename && filename.length > 0 && filename !== 'upload';
  }

  isImage(url: string): boolean {
    return this.isValidUrl(url) && /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url);
  }

  isPdf(url: string): boolean {
    return /\.pdf$/i.test(url);
  }

  getFileName(url: string): string {
    return url.split('/').pop() || 'archivo';
  }

  getFileExtension(url: string): string {
    const parts = url.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'FILE';
  }

  openFile(url: string): void {
    window.open(url, '_blank');
  }

  downloadFile(url: string, event: Event): void {
    event.stopPropagation();
    const link = document.createElement('a');
    link.href = url;
    link.download = this.getFileName(url);
    link.click();
  }
}
