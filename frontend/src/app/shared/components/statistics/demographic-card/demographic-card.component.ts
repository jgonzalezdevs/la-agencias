import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component';
import { CountryMapComponent, FlightRoute } from '../../charts/country-map/country-map.component';
import { StatsService, PopularTrip } from '../../../services/stats.service';

interface Destination {
  id: number;
  name: string;
  topRoutes: string;
  tickets: string;
  percent: number;
  growth: string;
  travelType: string;
  img: string;
  alt: string;
  route?: FlightRoute;
}

@Component({
  selector: 'app-demographic-card',
  imports: [
    CommonModule,
    TranslateModule,
    CountryMapComponent,
    DropdownComponent,
    DropdownItemComponent,
  ],
  templateUrl: './demographic-card.component.html',
})
export class DemographicCardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isOpen = false;
  currentPage = 1;
  itemsPerPage = 2;
  isLoading = false;
  errorMessage = '';

  destinations: Destination[] = [];
  maxTickets = 0;
  selectedRoute?: FlightRoute;
  selectedDestinationIndex?: number;

  constructor(private statsService: StatsService) {}

  ngOnInit() {
    this.loadPopularTrips();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  closeDropdown() {
    this.isOpen = false;
  }

  loadPopularTrips() {
    this.isLoading = true;
    this.errorMessage = '';

    this.statsService.getPopularTrips(10)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (trips: PopularTrip[]) => {
          // Find max tickets for percentage calculation
          this.maxTickets = Math.max(...trips.map(t => t.sales_count), 1);

          // Transform backend data to component format
          this.destinations = trips.map((trip, index) => {
            const route: FlightRoute | undefined =
              trip.origin_location.latitude && trip.origin_location.longitude &&
              trip.destination_location.latitude && trip.destination_location.longitude
              ? {
                  originLat: Number(trip.origin_location.latitude),
                  originLon: Number(trip.origin_location.longitude),
                  originName: trip.origin_location.city,
                  destLat: Number(trip.destination_location.latitude),
                  destLon: Number(trip.destination_location.longitude),
                  destName: trip.destination_location.city
                }
              : undefined;

            return {
              id: trip.id,
              name: `${trip.origin_location.city} → ${trip.destination_location.city}`,
              topRoutes: `${trip.origin_location.city} → ${trip.destination_location.city}`,
              tickets: `${trip.sales_count} ${trip.sales_count === 1 ? 'Ticket' : 'Tickets'}`,
              percent: Math.round((trip.sales_count / this.maxTickets) * 100),
              growth: '+0%', // You could calculate this if you track historical data
              travelType: 'Flight & Bus', // Default since we count both
              img: this.getCountryImage(index),
              alt: trip.origin_location.country.toLowerCase(),
              route
            };
          });

          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading popular trips:', error);
          this.errorMessage = 'Failed to load popular destinations';
          this.isLoading = false;

          // Fallback to empty array
          this.destinations = [];
        }
      });
  }

  getCountryImage(index: number): string {
    const imageIndex = (index % 5) + 1;
    return `/images/country/country-0${imageIndex}.svg`;
  }

  selectDestination(index: number) {
    const destination = this.destinations[index];
    if (destination.route) {
      this.selectedRoute = destination.route;
      this.selectedDestinationIndex = index;
    }
  }

  isSelected(index: number): boolean {
    return this.selectedDestinationIndex === index;
  }

  get paginatedDestinations() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.destinations.slice(startIndex, endIndex);
  }

  get totalPages() {
    return Math.ceil(this.destinations.length / this.itemsPerPage);
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

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
}
