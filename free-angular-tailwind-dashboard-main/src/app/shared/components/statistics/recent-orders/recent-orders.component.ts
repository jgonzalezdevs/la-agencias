import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BadgeComponent } from '../../ui/badge/badge.component';

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
  status: 'Confirmed' | 'Pending' | 'Cancelled';
  paymentMethod: string;
  commission: string;
  additionalServices?: AdditionalService[];
}

@Component({
  selector: 'app-recent-orders',
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    BadgeComponent,
  ],
  templateUrl: './recent-orders.component.html'
})
export class RecentOrdersComponent implements OnInit {
  ticketsData: TicketSale[] = [
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
      status: "Confirmed",
      paymentMethod: "Credit Card",
      commission: "$170.00",
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
      status: "Pending",
      paymentMethod: "PayPal",
      commission: "$8.50"
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
      status: "Confirmed",
      paymentMethod: "Credit Card",
      commission: "$1,280.00",
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
      status: "Cancelled",
      paymentMethod: "Credit Card",
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
      status: "Confirmed",
      paymentMethod: "Debit Card",
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

  ngOnInit() {
    this.calculateTotalPages();
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

  getBadgeColor(status: string): 'success' | 'warning' | 'error' {
    if (status === 'Confirmed') return 'success';
    if (status === 'Pending') return 'warning';
    return 'error';
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
}