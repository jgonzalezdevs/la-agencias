import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ServiceStatusBadgeComponent } from '../../service-status-badge/service-status-badge.component';
import { OrdersService, OrderWithDetails, Service, ServiceType, ServiceStatus } from '../../../services/orders.service';
import { TicketPdfService } from '../../../services/ticket-pdf.service';
import { Subject, takeUntil } from 'rxjs';

interface AdditionalService {
  type: 'hotel' | 'car' | 'luggage';
  name: string;
  details: string;
  price: string;
}

interface TicketSale {
  id: number;
  ticketNumber: string;
  travelType: 'flight' | 'bus';
  travelNumber: string;
  origin: string;
  destination: string;
  travelDate: string;
  departureTime: string;
  arrivalTime: string;
  carrier: string; // airline or bus company
  seller: {
    name: string;
    email: string;
    avatar: string;
    totalSales: number;
    rating: number;
  };
  buyer: {
    name: string;
    email: string;
  };
  class: string;
  quantity: number;
  price: string;
  totalAmount: string;
  saleDate: string;
  status: ServiceStatus; // Changed from 'Confirmed' | 'Pending' | 'Cancelled'
  commission: string;
  filesCount: number; // Added for file attachments
  additionalServices?: AdditionalService[];
}

@Component({
  selector: 'app-recent-orders',
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ServiceStatusBadgeComponent,
  ],
  templateUrl: './recent-orders.component.html'
})
export class RecentOrdersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  ticketsData: TicketSale[] = [];
  isLoading = true;
  errorMessage: string | null = null;

  // Old mock data for reference (can be removed later)
  private mockTicketsData: TicketSale[] = [
    {
      id: 1,
      ticketNumber: "TKT-2024-001",
      travelType: "flight",
      travelNumber: "AA 1234",
      origin: "New York (JFK)",
      destination: "Los Angeles (LAX)",
      travelDate: "Dec 15, 2024",
      departureTime: "08:30 AM",
      arrivalTime: "11:45 AM",
      carrier: "American Airlines",
      seller: {
        name: "Sarah Johnson",
        email: "sarah.j@example.com",
        avatar: "https://ui-avatars.com/api/?name=Sarah+Johnson&background=465fff&color=fff",
        totalSales: 156,
        rating: 4.8
      },
      buyer: {
        name: "Michael Smith",
        email: "michael.s@example.com"
      },
      class: "Business",
      quantity: 2,
      price: "$850.00",
      totalAmount: "$1,700.00",
      saleDate: "Oct 12, 2024",
      status: "activo",
      commission: "$170.00",
      filesCount: 2,
      additionalServices: [
        {
          type: "hotel",
          name: "Hilton Los Angeles Airport",
          details: "2 nights, Standard Room",
          price: "$380.00"
        },
        {
          type: "car",
          name: "Economy Car Rental",
          details: "3 days, Toyota Camry",
          price: "$210.00"
        }
      ]
    },
    {
      id: 2,
      ticketNumber: "TKT-2024-002",
      travelType: "bus",
      travelNumber: "GB 5678",
      origin: "Miami",
      destination: "Orlando",
      travelDate: "Nov 28, 2024",
      departureTime: "06:15 PM",
      arrivalTime: "10:30 PM",
      carrier: "Greyhound",
      seller: {
        name: "David Martinez",
        email: "david.m@example.com",
        avatar: "https://ui-avatars.com/api/?name=David+Martinez&background=f79009&color=fff",
        totalSales: 89,
        rating: 4.5
      },
      buyer: {
        name: "Emma Wilson",
        email: "emma.w@example.com"
      },
      class: "Standard",
      quantity: 1,
      price: "$85.00",
      totalAmount: "$85.00",
      saleDate: "Oct 11, 2024",
      status: "postpuesto",
      commission: "$8.50",
      filesCount: 0
    },
    {
      id: 3,
      ticketNumber: "TKT-2024-003",
      travelType: "flight",
      travelNumber: "UA 9012",
      origin: "Chicago (ORD)",
      destination: "Tokyo (NRT)",
      travelDate: "Dec 20, 2024",
      departureTime: "11:00 AM",
      arrivalTime: "02:45 PM",
      carrier: "United Airlines",
      seller: {
        name: "Jessica Lee",
        email: "jessica.l@example.com",
        avatar: "https://ui-avatars.com/api/?name=Jessica+Lee&background=12b76a&color=fff",
        totalSales: 234,
        rating: 4.9
      },
      buyer: {
        name: "James Brown",
        email: "james.b@example.com"
      },
      class: "First Class",
      quantity: 4,
      price: "$3,200.00",
      totalAmount: "$12,800.00",
      saleDate: "Oct 10, 2024",
      status: "activo",
      commission: "$1,280.00",
      filesCount: 3,
      additionalServices: [
        {
          type: "hotel",
          name: "Tokyo Grand Hotel",
          details: "5 nights, Deluxe Room with View",
          price: "$1,200.00"
        },
        {
          type: "luggage",
          name: "Extra Luggage Service",
          details: "2 additional bags, 23kg each",
          price: "$150.00"
        }
      ]
    },
    {
      id: 4,
      ticketNumber: "TKT-2024-004",
      travelType: "flight",
      travelNumber: "BA 3456",
      origin: "San Francisco (SFO)",
      destination: "Paris (CDG)",
      travelDate: "Jan 5, 2025",
      departureTime: "03:30 PM",
      arrivalTime: "10:15 AM",
      carrier: "British Airways",
      seller: {
        name: "Robert Chen",
        email: "robert.c@example.com",
        avatar: "https://ui-avatars.com/api/?name=Robert+Chen&background=d92d20&color=fff",
        totalSales: 45,
        rating: 4.2
      },
      buyer: {
        name: "Lisa Anderson",
        email: "lisa.a@example.com"
      },
      class: "Business",
      quantity: 2,
      price: "$1,450.00",
      totalAmount: "$2,900.00",
      saleDate: "Oct 9, 2024",
      status: "cancelado",
      filesCount: 1,
      commission: "$0.00"
    },
    {
      id: 5,
      ticketNumber: "TKT-2024-005",
      travelType: "bus",
      travelNumber: "MB 7890",
      origin: "Boston",
      destination: "New York",
      travelDate: "Nov 18, 2024",
      departureTime: "05:45 PM",
      arrivalTime: "10:15 PM",
      carrier: "Megabus",
      seller: {
        name: "Amanda White",
        email: "amanda.w@example.com",
        avatar: "https://ui-avatars.com/api/?name=Amanda+White&background=7a5af8&color=fff",
        totalSales: 178,
        rating: 4.7
      },
      buyer: {
        name: "Chris Taylor",
        email: "chris.t@example.com"
      },
      class: "Standard",
      quantity: 3,
      price: "$45.00",
      totalAmount: "$135.00",
      saleDate: "Oct 8, 2024",
      status: "activo",
      filesCount: 2,
      commission: "$13.50",
      additionalServices: [
        {
          type: "luggage",
          name: "Luggage Storage",
          details: "3 bags under bus storage",
          price: "$15.00"
        }
      ]
    },
  ];

  // Pagination and filtering
  currentPage = 1;
  itemsPerPage = 5;
  totalPages = 1;

  // Filters
  filters = {
    agent: '',
    origin: '',
    destination: '',
    status: '',
    travelType: ''
  };

  selectedTicket: TicketSale | null = null;
  Math = Math;

  constructor(
    private ordersService: OrdersService,
    private ticketPdfService: TicketPdfService
  ) {}

  ngOnInit() {
    this.loadTicketsFromBackend();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTicketsFromBackend() {
    this.isLoading = true;
    this.errorMessage = null;

    // Get orders with full details (services, customer, user) in a single request
    this.ordersService.listOrdersWithDetails({ limit: 50 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orders) => {
          console.log('Orders loaded from backend:', orders);

          if (orders.length === 0) {
            this.errorMessage = 'No ticket data found in database. Showing sample data.';
            this.ticketsData = this.mockTicketsData;
          } else {
            this.ticketsData = this.convertOrdersToTickets(orders);
          }

          this.isLoading = false;
          this.calculateTotalPages();
        },
        error: (error) => {
          console.error('Error loading orders:', error);

          if (error.status === 401) {
            this.errorMessage = 'Authentication required. Please log in to see real data.';
          } else if (error.status === 0) {
            this.errorMessage = 'Cannot connect to backend. Check if server is running on port 5050.';
          } else {
            this.errorMessage = `Failed to load ticket data (Error ${error.status}). Showing sample data.`;
          }

          this.ticketsData = this.mockTicketsData;
          this.isLoading = false;
          this.calculateTotalPages();
        }
      });
  }

  /**
   * Convert backend orders to frontend TicketSale format
   */
  private convertOrdersToTickets(orders: OrderWithDetails[]): TicketSale[] {
    const tickets: TicketSale[] = [];

    orders.forEach(order => {
      // Find FLIGHT or BUS services (the main travel tickets)
      const travelServices = order.services?.filter(
        s => s.service_type === 'FLIGHT' || s.service_type === 'BUS'
      ) || [];

      travelServices.forEach(service => {
        const ticket = this.convertServiceToTicket(order, service);
        if (ticket) {
          tickets.push(ticket);
        }
      });
    });

    return tickets;
  }

  /**
   * Convert a single service and its order to a TicketSale
   */
  private convertServiceToTicket(order: OrderWithDetails, service: Service): TicketSale | null {
    if (!service.origin_location || !service.destination_location) {
      return null;
    }

    const travelType = service.service_type === 'FLIGHT' ? 'flight' : 'bus';

    // Get additional services (hotel, luggage, etc.)
    const additionalServices: AdditionalService[] = (order.services || [])
      .filter(s => s.id !== service.id && ['HOTEL', 'LUGGAGE', 'OTHER'].includes(s.service_type))
      .map(s => this.convertToAdditionalService(s))
      .filter(s => s !== null) as AdditionalService[];

    // Get status from service (not order - orders don't have status anymore)
    const status: ServiceStatus = service.status || 'activo';

    // Format location strings
    const originStr = this.formatLocation(service.origin_location);
    const destStr = this.formatLocation(service.destination_location);

    // Format dates
    const travelDate = service.departure_datetime
      ? new Date(service.departure_datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'N/A';

    const departureTime = service.departure_datetime
      ? new Date(service.departure_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : 'N/A';

    const arrivalTime = service.arrival_datetime
      ? new Date(service.arrival_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : 'N/A';

    const saleDate = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Calculate commission (profit)
    const costPrice = parseFloat(service.cost_price);
    const salePrice = parseFloat(service.sale_price);
    const commission = (salePrice - costPrice).toFixed(2);

    // Generate avatar URL for seller
    const sellerName = order.user?.full_name || 'Unknown';
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerName)}&background=465fff&color=fff`;

    return {
      id: service.id,
      ticketNumber: order.order_number,
      travelType: travelType,
      travelNumber: service.pnr_code || 'N/A',
      origin: originStr,
      destination: destStr,
      travelDate: travelDate,
      departureTime: departureTime,
      arrivalTime: arrivalTime,
      carrier: service.company || 'N/A',
      seller: {
        name: sellerName,
        email: order.user?.email || '',
        avatar: avatarUrl,
        totalSales: order.user?.sales_count || 0,
        rating: 4.5 // TODO: Add rating to backend if needed
      },
      buyer: {
        name: order.customer.full_name,
        email: order.customer.email || ''
      },
      class: 'Standard', // TODO: Add class info to backend if needed
      quantity: 1, // TODO: Add quantity to backend if needed
      price: `$${parseFloat(service.sale_price).toFixed(2)}`,
      totalAmount: `$${parseFloat(service.sale_price).toFixed(2)}`,
      saleDate: saleDate,
      status: status,
      commission: `$${commission}`,
      filesCount: service.images?.length || 0,
      additionalServices: additionalServices.length > 0 ? additionalServices : undefined
    };
  }

  /**
   * Format location for display
   */
  private formatLocation(location: any): string {
    if (!location) return 'N/A';

    const city = location.city || '';
    const code = location.airport_code ? ` (${location.airport_code})` : '';

    return `${city}${code}`;
  }

  /**
   * Convert service to AdditionalService format
   */
  private convertToAdditionalService(service: Service): AdditionalService | null {
    let type: 'hotel' | 'car' | 'luggage';

    if (service.service_type === 'HOTEL') {
      type = 'hotel';
    } else if (service.service_type === 'LUGGAGE') {
      type = 'luggage';
    } else {
      type = 'car'; // Default for OTHER
    }

    return {
      type: type,
      name: service.name,
      details: service.description || '',
      price: `$${parseFloat(service.sale_price).toFixed(2)}`
    };
  }

  get filteredData(): TicketSale[] {
    return this.ticketsData.filter(ticket => {
      const matchesAgent = !this.filters.agent ||
        ticket.seller.name.toLowerCase().includes(this.filters.agent.toLowerCase());
      const matchesOrigin = !this.filters.origin ||
        ticket.origin.toLowerCase().includes(this.filters.origin.toLowerCase());
      const matchesDestination = !this.filters.destination ||
        ticket.destination.toLowerCase().includes(this.filters.destination.toLowerCase());
      const matchesStatus = !this.filters.status ||
        ticket.status === this.filters.status;
      const matchesTravelType = !this.filters.travelType ||
        ticket.travelType === this.filters.travelType;

      return matchesAgent && matchesOrigin && matchesDestination && matchesStatus && matchesTravelType;
    });
  }

  get paginatedData(): TicketSale[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredData.slice(startIndex, endIndex);
  }

  calculateTotalPages() {
    this.totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
  }

  onFilterChange() {
    this.currentPage = 1;
    this.calculateTotalPages();
  }

  clearFilters() {
    this.filters = {
      agent: '',
      origin: '',
      destination: '',
      status: '',
      travelType: ''
    };
    this.onFilterChange();
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

  getBadgeColor(status: ServiceStatus): 'success' | 'warning' | 'error' {
    if (status === 'activo') return 'success';
    if (status === 'postpuesto') return 'warning';
    return 'error'; // cancelado
  }

  getTravelIcon(travelType: string): string {
    return travelType === 'flight' ? 'plane' : 'bus';
  }

  openTicketDetails(ticket: TicketSale) {
    this.selectedTicket = ticket;
  }

  closeModal() {
    this.selectedTicket = null;
  }

  downloadTicketPDF(ticket: TicketSale) {
    this.ticketPdfService.generateTicketPDF(ticket);
  }

  getAdditionalServiceIcon(type: string): string {
    switch(type) {
      case 'hotel': return 'hotel';
      case 'car': return 'car';
      case 'luggage': return 'luggage';
      default: return 'service';
    }
  }

  getAdditionalServiceColor(type: string): string {
    switch(type) {
      case 'hotel': return 'text-blue-600 dark:text-blue-400';
      case 'car': return 'text-green-600 dark:text-green-400';
      case 'luggage': return 'text-purple-600 dark:text-purple-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  }

  hasAdditionalServices(ticket: TicketSale): boolean {
    return !!ticket.additionalServices && ticket.additionalServices.length > 0;
  }

  getAdditionalServicesCount(ticket: TicketSale): number {
    return ticket.additionalServices?.length || 0;
  }

  getAdditionalServicesTypes(ticket: TicketSale): string[] {
    if (!ticket.additionalServices) return [];
    return [...new Set(ticket.additionalServices.map(s => s.type))];
  }
}