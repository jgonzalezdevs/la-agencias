import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { UserService, TopSeller } from '../../../services/user.service';
import { BadgeComponent } from '../../ui/badge/badge.component';

@Component({
  selector: 'app-top-sellers',
  standalone: true,
  imports: [CommonModule, BadgeComponent],
  templateUrl: './top-sellers.component.html'
})
export class TopSellersComponent implements OnInit, OnDestroy {
  topSellers: TopSeller[] = [];
  isLoading = true;
  errorMessage = '';
  private destroy$ = new Subject<void>();

  // Pagination
  currentPage = 1;
  itemsPerPage = 6;
  totalItems = 0;
  totalPages = 0;
  Math = Math; // Expose Math to template

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadTopSellers();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get paginatedSellers(): TopSeller[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.topSellers.slice(startIndex, endIndex);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  loadTopSellers() {
    this.isLoading = true;
    this.errorMessage = '';

    // Fetch more sellers to have enough for pagination
    this.userService.getTopSellers(50)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sellers) => {
          this.topSellers = sellers;
          this.totalItems = sellers.length;
          this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading top sellers:', error);
          this.errorMessage = 'Failed to load top sellers';
          this.isLoading = false;
        }
      });
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  getRankColor(rank: number): string {
    if (rank === 1) return 'bg-yellow-500';
    if (rank === 2) return 'bg-gray-400';
    if (rank === 3) return 'bg-amber-600';
    return 'bg-brand-500';
  }

  getRankIcon(rank: number): string {
    if (rank <= 3) return '🏆';
    return '🎯';
  }
}
