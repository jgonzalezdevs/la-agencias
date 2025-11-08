import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';

import { Component, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { EventInput, CalendarOptions, DateSelectArg, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { OrdersService, OrderCreate, ServiceCreate, ServiceStatus } from '../../shared/services/orders.service';
import { CustomersService, Customer, CustomerCreate } from '../../shared/services/customers.service';
import { LocationsService, Location } from '../../shared/services/locations.service';
import { FileUploadService, UploadResponse } from '../../shared/services/file-upload.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import { DatePickerComponent } from '../../shared/components/form/date-picker/date-picker.component';
import { TimePickerComponent } from '../../shared/components/form/time-picker/time-picker.component';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';

interface TicketService {
  tempId: string;
  serviceType: 'FLIGHT' | 'BUS' | 'HOTEL' | 'LUGGAGE' | 'CAR' | 'OTHER';
  status: ServiceStatus;
  serviceId?: number; // Track service ID for edits
  name: string;
  description: string;
  costPrice: number;
  salePrice: number;

  // FLIGHT/BUS fields
  originLocationId: number | null;
  destinationLocationId: number | null;
  pnrCode: string;
  company: string;
  routeGuide: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;

  // HOTEL fields
  hotelName: string;
  reservationNumber: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;

  // LUGGAGE fields
  weightKg: number;

  // Document uploads
  uploadedImages: UploadResponse[];
  originalImageCount?: number; // Track how many images were loaded from backend
}

interface CalendarEvent extends EventInput {
  orderId?: number;
  extendedProps: {
    customerId: number;
    customerName: string;
    customerDocument: string;
    customerPhone?: string;
    orderNumber?: string;
    totalAmount: number;
    commission: number;
    status: 'activo' | 'cancelado' | 'postpuesto';
    servicesCount: number;
    mainService?: string;
    serviceType?: string;
    serviceIcon?: string;
    company?: string;
    routeGuide?: string;
    departureDate?: Date;
    arrivalDate?: Date | null;
  };
}

@Component({
  selector: 'app-calender',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FullCalendarModule,
    ModalComponent,
    DatePickerComponent,
    TimePickerComponent
  ],
  templateUrl: './calender.component.html',
  styles: ``
})
export class CalenderComponent implements AfterViewInit {

  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  // Expose Math for template
  Math = Math;

  events: CalendarEvent[] = [];
  allEvents: CalendarEvent[] = []; // Store all events for filtering
  selectedEvent: CalendarEvent | null = null;
  isOpen = false;
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  // View mode
  viewMode: 'calendar' | 'table' = 'calendar';

  // Filters
  filterStatus: string = 'all';
  filterServiceType: string = 'all';
  filterStartDate: string = '';
  filterEndDate: string = '';
  filterSearchName: string = '';
  filterSearchTicket: string = '';
  filterSearchPhone: string = '';
  filteredEvents: CalendarEvent[] = [];

  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  paginatedEvents: CalendarEvent[] = [];
  totalPages: number = 0;

  // Year filter
  selectedYear: number = new Date().getFullYear();
  availableYears: number[] = [];

  // Customer fields
  selectedCustomer: Customer | null = null;
  customerSearchQuery = '';
  customerSearchResults: Customer[] = [];
  isSearchingCustomers = false;
  showCustomerDropdown = false;
  showNewCustomerForm = false;
  private customerSearch$ = new Subject<string>();

  // New customer form
  newCustomer: CustomerCreate = {
    full_name: '',
    email: null,
    phone_number: null,
    document_id: null,
    address: null,
    notes: null
  };

  // Locations
  locations: Location[] = [];
  filteredOriginLocations: Location[] = [];
  filteredDestinationLocations: Location[] = [];
  originSearchQuery = '';
  destinationSearchQuery = '';
  showOriginDropdown = false;
  showDestinationDropdown = false;
  showNewOriginForm = false;
  showNewDestinationForm = false;

  // New location forms
  newOriginLocation = { city: '', state: '', country: '', airport_code: '', terminal_name: '' };
  newDestinationLocation = { city: '', state: '', country: '', airport_code: '', terminal_name: '' };

  // Services array
  services: TicketService[] = [];
  currentServiceIndex = 0; // Index of currently displayed service

  // Order fields
  orderNotes = '';

  // Customer edit modal
  isEditCustomerModalOpen = false;
  editingCustomer: Customer | null = null;
  editCustomerForm: CustomerCreate = {
    full_name: '',
    email: null,
    phone_number: null,
    document_id: null,
    address: null,
    notes: null
  };

  calendarOptions!: CalendarOptions;

  constructor(
    private ordersService: OrdersService,
    private customersService: CustomersService,
    private locationsService: LocationsService,
    private fileUploadService: FileUploadService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Initialize calendar data
    this.loadLocations();
    this.loadAvailableYears();
    this.setupCustomerSearch();

    this.calendarOptions = {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: 'dayGridMonth',
      initialDate: new Date(), // Current date (today)
      validRange: {
        start: new Date(this.selectedYear, 0, 1), // January 1st
        end: new Date(this.selectedYear + 1, 0, 1) // January 1st of next year
      },
      headerToolbar: {
        left: 'prev,next addTicketButton',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      selectable: true,
      events: this.events,
      select: (info) => this.handleDateSelect(info),
      eventClick: (info) => this.handleEventClick(info),
      customButtons: {
        addTicketButton: {
          text: '+ Register New Sale',
          click: () => this.openModal()
        }
      },
      eventContent: (arg) => this.renderEventContent(arg)
    };
  }

  ngAfterViewInit() {
    console.log('📅 Calendar ViewChild initialized');
    console.log('   calendarComponent:', !!this.calendarComponent);
    if (this.calendarComponent) {
      console.log('   getApi:', typeof this.calendarComponent.getApi);
      const api = this.calendarComponent.getApi();
      if (api) {
        console.log('   Current events in calendar:', api.getEvents().length);
      }
    }
  }

  setupCustomerSearch() {
    this.customerSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.length < 2) {
          return of([]);
        }
        this.isSearchingCustomers = true;
        return this.customersService.searchCustomers(query, 10).pipe(
          catchError(error => {
            console.error('Error searching customers:', error);
            return of([]);
          })
        );
      })
    ).subscribe(results => {
      this.customerSearchResults = results;
      this.isSearchingCustomers = false;
      this.showCustomerDropdown = results.length > 0;
    });
  }

  onCustomerSearchInput(event: any) {
    const query = event.target.value;
    this.customerSearchQuery = query;
    this.customerSearch$.next(query);
    this.showCustomerDropdown = true;
  }

  selectCustomer(customer: Customer) {
    this.selectedCustomer = customer;
    this.customerSearchQuery = customer.full_name;
    this.showCustomerDropdown = false;
    this.showNewCustomerForm = false;
  }

  clearCustomerSelection() {
    this.selectedCustomer = null;
    this.customerSearchQuery = '';
    this.customerSearchResults = [];
  }

  toggleNewCustomerForm() {
    this.showNewCustomerForm = !this.showNewCustomerForm;
    if (this.showNewCustomerForm) {
      this.showCustomerDropdown = false;
      this.clearCustomerSelection();
    }
  }

  async createCustomer() {
    if (!this.newCustomer.full_name) {
      this.errorMessage = 'Customer name is required';
      this.toastr.error('El nombre del cliente es requerido', 'Error de Validación');
      return;
    }

    this.isSaving = true;
    this.customersService.createCustomer(this.newCustomer).subscribe({
      next: (customer) => {
        this.selectedCustomer = customer;
        this.customerSearchQuery = customer.full_name;
        this.showNewCustomerForm = false;
        this.newCustomer = { full_name: '', email: null, phone_number: null, document_id: null, address: null, notes: null };
        this.isSaving = false;
        this.toastr.success(`Cliente "${customer.full_name}" creado exitosamente`, 'Cliente Creado');
      },
      error: (error) => {
        console.error('Error creating customer:', error);
        this.errorMessage = 'Failed to create customer';
        this.isSaving = false;
        this.toastr.error('No se pudo crear el cliente', 'Error al Crear');
      }
    });
  }

  loadLocations() {
    this.locationsService.listLocations().subscribe({
      next: (locations) => {
        this.locations = locations;
        this.filteredOriginLocations = locations;
        this.filteredDestinationLocations = locations;
      },
      error: (error) => {
        console.error('Error loading locations:', error);
      }
    });
  }

  // Origin location search
  onOriginSearchInput(event: any) {
    const query = event.target.value.toLowerCase();
    this.originSearchQuery = query;

    if (!query) {
      this.filteredOriginLocations = this.locations;
      this.showOriginDropdown = false;
      return;
    }

    this.filteredOriginLocations = this.locations.filter(loc =>
      loc.city?.toLowerCase().includes(query) ||
      loc.state?.toLowerCase().includes(query) ||
      loc.country?.toLowerCase().includes(query) ||
      (loc.airport_code && loc.airport_code.toLowerCase().includes(query))
    );
    this.showOriginDropdown = true;
  }

  onOriginBlur() {
    // Delay to allow clicking dropdown items
    setTimeout(() => {
      this.showOriginDropdown = false;
    }, 200);
  }

  selectOriginLocation(location: Location) {
    const currentService = this.services[this.currentServiceIndex];
    currentService.originLocationId = location.id;
    this.originSearchQuery = `${location.city}, ${location.state}`;
    this.showOriginDropdown = false;
    this.showNewOriginForm = false;
  }

  clearOriginSelection() {
    const currentService = this.services[this.currentServiceIndex];
    currentService.originLocationId = null;
    this.originSearchQuery = '';
    this.filteredOriginLocations = this.locations;
    this.showOriginDropdown = false;
  }

  toggleNewOriginForm() {
    this.showNewOriginForm = !this.showNewOriginForm;
    this.showOriginDropdown = false;
  }

  async createOriginLocation() {
    if (!this.newOriginLocation.city || !this.newOriginLocation.state || !this.newOriginLocation.country) {
      this.errorMessage = 'City, state, and country are required for origin location';
      setTimeout(() => this.errorMessage = '', 5000);
      return;
    }

    this.isSaving = true;
    this.locationsService.createLocation(this.newOriginLocation).subscribe({
      next: (location) => {
        this.locations.push(location);
        this.filteredOriginLocations = this.locations;
        this.selectOriginLocation(location);
        this.newOriginLocation = { city: '', state: '', country: '', airport_code: '', terminal_name: '' };
        this.showNewOriginForm = false;
        this.isSaving = false;
        this.toastr.success(`Ubicación de origen "${location.city}" creada exitosamente`, 'Ubicación Creada');
      },
      error: (error) => {
        console.error('Error creating location:', error);
        this.errorMessage = error.error?.detail || 'Failed to create origin location';
        this.isSaving = false;
        this.toastr.error('No se pudo crear la ubicación de origen', 'Error al Crear');
      }
    });
  }

  // Destination location search
  onDestinationSearchInput(event: any) {
    const query = event.target.value.toLowerCase();
    this.destinationSearchQuery = query;

    if (!query) {
      this.filteredDestinationLocations = this.locations;
      this.showDestinationDropdown = false;
      return;
    }

    this.filteredDestinationLocations = this.locations.filter(loc =>
      loc.city?.toLowerCase().includes(query) ||
      loc.state?.toLowerCase().includes(query) ||
      loc.country?.toLowerCase().includes(query) ||
      (loc.airport_code && loc.airport_code.toLowerCase().includes(query))
    );
    this.showDestinationDropdown = true;
  }

  onDestinationBlur() {
    // Delay to allow clicking dropdown items
    setTimeout(() => {
      this.showDestinationDropdown = false;
    }, 200);
  }

  selectDestinationLocation(location: Location) {
    const currentService = this.services[this.currentServiceIndex];
    currentService.destinationLocationId = location.id;
    this.destinationSearchQuery = `${location.city}, ${location.state}`;
    this.showDestinationDropdown = false;
    this.showNewDestinationForm = false;
  }

  clearDestinationSelection() {
    const currentService = this.services[this.currentServiceIndex];
    currentService.destinationLocationId = null;
    this.destinationSearchQuery = '';
    this.filteredDestinationLocations = this.locations;
    this.showDestinationDropdown = false;
  }

  toggleNewDestinationForm() {
    this.showNewDestinationForm = !this.showNewDestinationForm;
    this.showDestinationDropdown = false;
  }

  async createDestinationLocation() {
    if (!this.newDestinationLocation.city || !this.newDestinationLocation.state || !this.newDestinationLocation.country) {
      this.errorMessage = 'City, state, and country are required for destination location';
      setTimeout(() => this.errorMessage = '', 5000);
      return;
    }

    this.isSaving = true;
    this.locationsService.createLocation(this.newDestinationLocation).subscribe({
      next: (location) => {
        this.locations.push(location);
        this.filteredDestinationLocations = this.locations;
        this.selectDestinationLocation(location);
        this.newDestinationLocation = { city: '', state: '', country: '', airport_code: '', terminal_name: '' };
        this.showNewDestinationForm = false;
        this.isSaving = false;
        this.toastr.success(`Ubicación de destino "${location.city}" creada exitosamente`, 'Ubicación Creada');
      },
      error: (error) => {
        console.error('Error creating location:', error);
        this.errorMessage = error.error?.detail || 'Failed to create destination location';
        this.isSaving = false;
        this.toastr.error('No se pudo crear la ubicación de destino', 'Error al Crear');
      }
    });
  }

  // Get location display name
  getLocationDisplayName(locationId: number | null): string {
    if (!locationId) return '';
    const location = this.locations.find(l => l.id === locationId);
    return location ? `${location.city}, ${location.state}` : '';
  }

  // Date and time change handlers
  onDepartureDateChange(event: any) {
    const currentService = this.services[this.currentServiceIndex];
    currentService.departureDate = event.dateStr;
  }

  onDepartureTimeChange(timeStr: string) {
    const currentService = this.services[this.currentServiceIndex];
    currentService.departureTime = timeStr;
  }

  onArrivalDateChange(event: any) {
    const currentService = this.services[this.currentServiceIndex];
    currentService.arrivalDate = event.dateStr;
  }

  onArrivalTimeChange(timeStr: string) {
    const currentService = this.services[this.currentServiceIndex];
    currentService.arrivalTime = timeStr;
  }

  onCheckInDateChange(event: any) {
    const currentService = this.services[this.currentServiceIndex];
    currentService.checkInDate = event.dateStr;
  }

  onCheckInTimeChange(timeStr: string) {
    const currentService = this.services[this.currentServiceIndex];
    currentService.checkInTime = timeStr;
  }

  onCheckOutDateChange(event: any) {
    const currentService = this.services[this.currentServiceIndex];
    currentService.checkOutDate = event.dateStr;
  }

  onCheckOutTimeChange(timeStr: string) {
    const currentService = this.services[this.currentServiceIndex];
    currentService.checkOutTime = timeStr;
  }

  loadAvailableYears() {
    console.log('📅 Loading available years...');
    this.ordersService.getAvailableYears().subscribe({
      next: (response) => {
        this.availableYears = response.years;
        console.log('📆 Available years from backend:', this.availableYears);

        // Set selected year to current year if available, otherwise first in list
        const currentYear = new Date().getFullYear();
        if (this.availableYears.includes(currentYear)) {
          this.selectedYear = currentYear;
        } else if (this.availableYears.length > 0) {
          this.selectedYear = this.availableYears[0];
        }

        console.log('🎯 Selected year:', this.selectedYear);

        // Load orders after years are loaded
        this.loadOrders();
      },
      error: (error) => {
        console.error('❌ Error loading available years:', error);
        // Fallback to current year
        this.selectedYear = new Date().getFullYear();
        this.availableYears = [this.selectedYear];
        this.loadOrders();
      }
    });
  }

  loadOrders(): Promise<void> {
    if (!this.selectedYear) {
      console.warn('⚠️ No selected year, skipping load');
      return Promise.resolve();
    }

    this.isLoading = true;
    console.log('🔄 Loading orders for year:', this.selectedYear);

    return new Promise((resolve, reject) => {
      this.ordersService.listOrdersWithDetails({ limit: 500 }).subscribe({
      next: (orders) => {
        console.log('📦 Orders received:', orders.length);
        this.allEvents = orders.map(order => {
          const mainService = order.services.find(s => s.service_type === 'FLIGHT' || s.service_type === 'BUS');
          const serviceType = mainService?.service_type || (order.services.length > 0 ? order.services[0].service_type : 'OTHER');
          const serviceLabel = mainService
            ? `${mainService.origin_location?.city || 'N/A'} → ${mainService.destination_location?.city || 'N/A'}`
            : order.services.length > 0 ? order.services[0].name : 'Order';

          // Use departure_datetime if available (backend combines date + time)
          let departureDate: Date;
          let arrivalDate: Date | null = null;

          if (mainService?.departure_datetime) {
            departureDate = new Date(mainService.departure_datetime);
            console.log('📅 Event from departure_datetime:', mainService.departure_datetime, '→', departureDate.toISOString());

            // Get arrival time if available
            if (mainService?.arrival_datetime) {
              arrivalDate = new Date(mainService.arrival_datetime);
              console.log('🏁 Arrival datetime:', mainService.arrival_datetime, '→', arrivalDate.toISOString());
            }
          } else {
            // Fallback to created_at (all-day event)
            departureDate = new Date(order.created_at);
            console.log('📅 Event from created_at (all-day):', order.created_at, '→', departureDate.toISOString().split('T')[0]);
          }

          const icon = this.getServiceIcon(serviceType);
          const color = this.getServiceColor(serviceType);

          // Build event object - always use date-only for consistent month view display
          const event: any = {
            id: order.id.toString(),
            orderId: order.id,
            title: `${icon} ${order.customer.full_name}`,
            start: departureDate.toISOString().split('T')[0], // Always date-only for proper month view colors
            backgroundColor: color,
            borderColor: color,
            textColor: '#FFFFFF',
            extendedProps: {
              customerId: order.customer.id,
              customerName: order.customer.full_name,
              customerDocument: order.customer.document_id || 'N/A',
              customerPhone: order.customer.phone_number || '',
              orderNumber: order.order_number,
              totalAmount: parseFloat(order.total_sale_price?.toString() || '0'),
              commission: parseFloat(order.total_profit?.toString() || '0'),
              status: mainService?.status || 'activo',
              servicesCount: order.services.length,
              mainService: serviceLabel,
              serviceType: serviceType,
              serviceIcon: icon,
              company: mainService?.company || '',
              routeGuide: mainService?.route_guide || '',
              departureDate: departureDate,
              arrivalDate: arrivalDate
            }
          };

          return event;
        });

        console.log('✅ All events created:', this.allEvents.length);

        // Debug: Check if phone numbers are being loaded
        const eventsWithPhone = this.allEvents.filter(e => e.extendedProps?.customerPhone);
        console.log('📞 Events with phone numbers:', eventsWithPhone.length);
        if (eventsWithPhone.length > 0) {
          console.log('📞 Sample phone:', eventsWithPhone[0].extendedProps.customerPhone);
        }

        // Filter events by selected year
        this.filterEventsByYear();
        this.isLoading = false;
        resolve();
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.isLoading = false;
        this.errorMessage = 'Failed to load orders from backend';
        this.toastr.error('No se pudieron cargar las ventas', 'Error de Carga');
        reject(error);
      }
      });
    });
  }

  filterEventsByYear() {
    console.log('🔍 Filtering events for year:', this.selectedYear);
    console.log('🔍 Total events before filter:', this.allEvents.length);

    this.events = this.allEvents.filter(event => {
      if (!event.start || typeof event.start !== 'string') return false;
      const eventYear = new Date(event.start as string).getFullYear();
      return eventYear === this.selectedYear;
    });

    console.log('✅ Events after filter:', this.events.length);
    console.log('📋 Sample events:', this.events.slice(0, 3));

    // Update calendar with new events
    setTimeout(() => {
      if (this.calendarComponent && this.calendarComponent.getApi()) {
        const calendarApi = this.calendarComponent.getApi();
        console.log('📅 Calendar API available, updating events...');

        // Update validRange to restrict navigation to selected year
        calendarApi.setOption('validRange', {
          start: new Date(this.selectedYear, 0, 1),
          end: new Date(this.selectedYear + 1, 0, 1)
        });
        console.log('🔒 Valid range updated to year:', this.selectedYear);

        // Remove all existing events
        const allCalendarEvents = calendarApi.getEvents();
        console.log('🗑️ Removing existing events:', allCalendarEvents.length);
        allCalendarEvents.forEach(event => event.remove());

        // Add filtered events
        console.log('➕ Adding new events:', this.events.length);
        this.events.forEach((event, index) => {
          try {
            calendarApi.addEvent(event);
            if (index < 3) {
              console.log(`  ✓ Added event ${index + 1}:`, (event as any).title, (event as any).start);
            }
          } catch (error) {
            console.error('❌ Error adding event:', error, event);
          }
        });

        // Navigate to current month if selected year is current year, otherwise go to January
        const currentYear = new Date().getFullYear();
        const targetDate = this.selectedYear === currentYear
          ? new Date() // Current date (today's month)
          : new Date(this.selectedYear, 0, 1); // January of selected year

        calendarApi.gotoDate(targetDate);
        console.log('📍 Calendar navigated to:', targetDate.toLocaleDateString());

        // Verify events were added
        const newEventCount = calendarApi.getEvents().length;
        console.log('✅ Final event count in calendar:', newEventCount);
      } else {
        console.error('⚠️ Calendar API not available yet');
        console.log('   calendarComponent:', !!this.calendarComponent);
        if (this.calendarComponent) {
          console.log('   getApi:', typeof this.calendarComponent.getApi);
        }
      }
    }, 100);
  }

  onYearChange(year: number) {
    console.log('📆 Year changed to:', year);
    this.selectedYear = year;
    // Reload orders to get fresh data (in case new orders were added)
    this.loadOrders();
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'calendar' ? 'table' : 'calendar';
    if (this.viewMode === 'table') {
      this.applyFilters();
    }
  }

  applyFilters() {
    this.filteredEvents = this.events.filter(event => {
      // Filter by status
      if (this.filterStatus !== 'all') {
        if (event.extendedProps.status !== this.filterStatus) {
          return false;
        }
      }

      // Filter by service type
      if (this.filterServiceType !== 'all' && event.extendedProps.serviceType !== this.filterServiceType) {
        return false;
      }

      // Filter by date range using departureDate from extendedProps
      if (this.filterStartDate && event.extendedProps.departureDate) {
        const eventDate = new Date(event.extendedProps.departureDate);
        const startDate = new Date(this.filterStartDate);
        if (eventDate < startDate) {
          return false;
        }
      }

      if (this.filterEndDate && event.extendedProps.departureDate) {
        const eventDate = new Date(event.extendedProps.departureDate);
        const endDate = new Date(this.filterEndDate);
        if (eventDate > endDate) {
          return false;
        }
      }

      // Filter by customer name
      if (this.filterSearchName.trim()) {
        const searchTerm = this.filterSearchName.toLowerCase().trim();
        if (!event.extendedProps.customerName?.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }

      // Filter by ticket/order number
      if (this.filterSearchTicket.trim()) {
        const searchTerm = this.filterSearchTicket.toLowerCase().trim();
        if (!event.extendedProps.orderNumber?.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }

      // Filter by phone number
      if (this.filterSearchPhone.trim()) {
        const searchTerm = this.filterSearchPhone.trim();
        if (!event.extendedProps.customerPhone?.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });

    // Reset to first page when filters change
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredEvents.length / this.pageSize);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedEvents = this.filteredEvents.slice(startIndex, endIndex);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;

    if (this.totalPages <= maxPagesToShow) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const halfMax = Math.floor(maxPagesToShow / 2);
      let startPage = Math.max(1, this.currentPage - halfMax);
      let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

      if (endPage - startPage < maxPagesToShow - 1) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  resetFilters() {
    this.filterStatus = 'all';
    this.filterServiceType = 'all';
    this.filterStartDate = '';
    this.filterEndDate = '';
    this.filterSearchName = '';
    this.filterSearchTicket = '';
    this.filterSearchPhone = '';
    this.applyFilters();
  }

  openWhatsApp(phone: string) {
    if (!phone) {
      this.toastr.warning('Este cliente no tiene número de teléfono registrado', 'Sin Teléfono');
      return;
    }
    // Remove any non-numeric characters
    const cleanPhone = phone.replace(/\D/g, '');
    // Open WhatsApp Web
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  }

  onFilterChange() {
    this.applyFilters();
  }

  onFilterStartDateChange(event: any) {
    this.filterStartDate = event.dateStr;
    this.applyFilters();
  }

  onFilterEndDateChange(event: any) {
    this.filterEndDate = event.dateStr;
    this.applyFilters();
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'activo':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'postpuesto':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'cancelado':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'activo':
        return 'Activo';
      case 'postpuesto':
        return 'Postpuesto';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  }

  handleDateSelect(selectInfo: DateSelectArg) {
    this.resetModalFields();
    const newService = this.createEmptyService();
    newService.departureDate = selectInfo.startStr;
    this.services = [newService];
    this.openModal();
  }

  handleEventClick(clickInfo: EventClickArg) {
    const event = clickInfo.event as any;
    const orderId = parseInt(event.id);

    // Load full order details
    this.ordersService.getOrderDetails(orderId).subscribe({
      next: (order) => {
        this.selectedEvent = {
          orderId: orderId,
          title: event.title,
          start: event.startStr,
          extendedProps: event.extendedProps
        } as any;

        // Populate customer
        this.selectedCustomer = order.customer;
        this.customerSearchQuery = order.customer.full_name;

        // Populate services
        this.services = order.services.map(s => this.convertServiceToForm(s));

        // Reset order fields
        this.orderNotes = '';

        this.openModal();
      },
      error: (error) => {
        console.error('Error loading order details:', error);
        this.errorMessage = 'Failed to load order details';
      }
    });
  }

  viewEventDetails(event: CalendarEvent) {
    const eventAny = event as any;
    const orderId = parseInt(eventAny.id as string);

    // Load full order details
    this.ordersService.getOrderDetails(orderId).subscribe({
      next: (order) => {
        this.selectedEvent = {
          orderId: orderId,
          title: eventAny.title,
          start: eventAny.start,
          extendedProps: event.extendedProps
        } as any;

        // Populate customer
        this.selectedCustomer = order.customer;
        this.customerSearchQuery = order.customer.full_name;

        // Populate services
        this.services = order.services.map(s => this.convertServiceToForm(s));

        // Reset order fields
        this.orderNotes = '';

        this.openModal();
      },
      error: (error) => {
        console.error('Error loading order details:', error);
        this.errorMessage = 'Failed to load order details';
      }
    });
  }

  convertServiceToForm(service: any): TicketService {
    const departureDateTime = service.departure_datetime ? new Date(service.departure_datetime) : null;
    const arrivalDateTime = service.arrival_datetime ? new Date(service.arrival_datetime) : null;
    const checkInDateTime = service.check_in_datetime ? new Date(service.check_in_datetime) : null;
    const checkOutDateTime = service.check_out_datetime ? new Date(service.check_out_datetime) : null;

    const loadedImages = service.images
      ?.filter((img: any) => {
        // Filter out images with invalid URLs (empty or just the upload path)
        if (!img.image_url || img.image_url.trim() === '') return false;
        const filename = img.image_url.split('/').pop();
        return filename && filename.length > 0 && filename !== 'upload';
      })
      .map((img: any) => ({
        filename: img.image_url.split('/').pop(),
        url: this.makeAbsoluteUrl(img.image_url), // Convert to absolute URL
        size: 0,
        original_filename: img.image_url.split('/').pop()
      })) || [];

    return {
      tempId: `service-${Date.now()}-${Math.random()}`,
      serviceId: service.id, // Track service ID for edits
      serviceType: service.service_type,
      status: service.status || 'activo',
      name: service.name,
      description: service.description || '',
      costPrice: parseFloat(service.cost_price.toString()),
      salePrice: parseFloat(service.sale_price.toString()),
      originLocationId: service.origin_location_id,
      destinationLocationId: service.destination_location_id,
      pnrCode: service.pnr_code || '',
      company: service.company || '',
      routeGuide: service.route_guide || '',
      departureDate: departureDateTime ? departureDateTime.toISOString().split('T')[0] : '',
      departureTime: departureDateTime ? departureDateTime.toTimeString().substring(0, 5) : '',
      arrivalDate: arrivalDateTime ? arrivalDateTime.toISOString().split('T')[0] : '',
      arrivalTime: arrivalDateTime ? arrivalDateTime.toTimeString().substring(0, 5) : '',
      hotelName: service.hotel_name || '',
      reservationNumber: service.reservation_number || '',
      checkInDate: checkInDateTime ? checkInDateTime.toISOString().split('T')[0] : '',
      checkInTime: checkInDateTime ? checkInDateTime.toTimeString().substring(0, 5) : '',
      checkOutDate: checkOutDateTime ? checkOutDateTime.toISOString().split('T')[0] : '',
      checkOutTime: checkOutDateTime ? checkOutDateTime.toTimeString().substring(0, 5) : '',
      weightKg: service.weight_kg ? parseFloat(service.weight_kg.toString()) : 0,
      uploadedImages: loadedImages,
      originalImageCount: loadedImages.length // Track original count
    };
  }

  createEmptyService(): TicketService {
    return {
      tempId: `service-${Date.now()}-${Math.random()}`,
      serviceType: 'FLIGHT',
      status: 'activo', // Default status for new services
      name: '',
      description: '',
      costPrice: 0,
      salePrice: 0,
      originLocationId: null,
      destinationLocationId: null,
      pnrCode: '',
      company: '',
      routeGuide: '',
      departureDate: '',
      departureTime: '',
      arrivalDate: '',
      arrivalTime: '',
      hotelName: '',
      reservationNumber: '',
      checkInDate: '',
      checkInTime: '',
      checkOutDate: '',
      checkOutTime: '',
      weightKg: 0,
      uploadedImages: []
    };
  }

  addService() {
    this.services.push(this.createEmptyService());
    this.currentServiceIndex = this.services.length - 1; // Navigate to new service
  }

  removeService(index: number) {
    if (this.services.length === 1) {
      return; // Don't allow removing the last service
    }
    this.services.splice(index, 1);
    // Adjust current index if needed
    if (this.currentServiceIndex >= this.services.length) {
      this.currentServiceIndex = this.services.length - 1;
    }
  }

  nextService() {
    if (this.currentServiceIndex < this.services.length - 1) {
      this.currentServiceIndex++;
    }
  }

  previousService() {
    if (this.currentServiceIndex > 0) {
      this.currentServiceIndex--;
    }
  }

  goToService(index: number) {
    this.currentServiceIndex = index;
    // Load location display names for current service
    const service = this.services[index];
    this.originSearchQuery = this.getLocationDisplayName(service.originLocationId);
    this.destinationSearchQuery = this.getLocationDisplayName(service.destinationLocationId);
    this.showOriginDropdown = false;
    this.showDestinationDropdown = false;
    this.showNewOriginForm = false;
    this.showNewDestinationForm = false;
  }

  async onFileSelect(event: any, serviceIndex: number) {
    const files: FileList = event.target.files;
    if (files.length === 0) return;

    const service = this.services[serviceIndex];
    const filesToUpload = Array.from(files);

    for (const file of filesToUpload) {
      try {
        const response = await this.fileUploadService.uploadFile(file).toPromise();
        if (response) {
          // Convert relative URL to absolute URL
          const absoluteUrl = this.makeAbsoluteUrl(response.url);
          service.uploadedImages.push({
            ...response,
            url: absoluteUrl
          });
          this.toastr.success(`"${file.name}" subido correctamente`, 'Archivo Subido');
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        this.errorMessage = `Failed to upload ${file.name}`;
        this.toastr.error(`No se pudo subir "${file.name}"`, 'Error al Subir');
      }
    }

    // Reset input to allow selecting the same file again
    event.target.value = '';
  }

  makeAbsoluteUrl(url: string): string {
    // If URL is already absolute, return it
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // If URL is relative, prepend backend base URL
    const backendUrl = environment.apiUrl.replace('/api/v1', '');
    return `${backendUrl}${url.startsWith('/') ? url : '/' + url}`;
  }

  removeImage(serviceIndex: number, imageIndex: number) {
    const service = this.services[serviceIndex];
    const image = service.uploadedImages[imageIndex];

    this.fileUploadService.deleteFile(image.filename).subscribe({
      next: () => {
        service.uploadedImages.splice(imageIndex, 1);
        // Update original count if we're removing an image that was loaded from backend
        if (service.originalImageCount && imageIndex < service.originalImageCount) {
          service.originalImageCount--;
        }
        this.toastr.success('Archivo eliminado', 'Eliminado');
      },
      error: (error) => {
        console.error('Error deleting file:', error);
        // Remove from UI anyway
        service.uploadedImages.splice(imageIndex, 1);
        if (service.originalImageCount && imageIndex < service.originalImageCount) {
          service.originalImageCount--;
        }
        this.toastr.warning('Archivo eliminado de la vista', 'Eliminado Localmente');
      }
    });
  }

  isImageFile(filename: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    const lowerFilename = filename.toLowerCase();
    return imageExtensions.some(ext => lowerFilename.endsWith(ext));
  }

  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return 'Tamaño desconocido';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  getServiceIcon(serviceType: string): string {
    switch (serviceType) {
      case 'FLIGHT': return '✈️';
      case 'BUS': return '🚌';
      case 'HOTEL': return '🏨';
      case 'CAR': return '🚗';
      case 'LUGGAGE': return '🧳';
      default: return '📋';
    }
  }

  getServiceColor(serviceType: string): string {
    switch (serviceType) {
      case 'FLIGHT': return '#3B82F6'; // Blue - sky
      case 'BUS': return '#EF4444'; // Red - bus color
      case 'HOTEL': return '#8B5CF6'; // Purple - hotel luxury
      case 'CAR': return '#F59E0B'; // Amber - car rental
      case 'LUGGAGE': return '#10B981'; // Green - luggage
      default: return '#6B7280'; // Gray - other
    }
  }

  async handleSaveOrder() {
    // Validation
    if (!this.selectedCustomer) {
      this.errorMessage = 'Please select or create a customer';
      return;
    }

    if (this.services.length === 0) {
      this.errorMessage = 'Please add at least one ticket or service';
      return;
    }

    // Validate each service
    for (let i = 0; i < this.services.length; i++) {
      const service = this.services[i];
      if (!service.name) {
        this.errorMessage = `Service ${i + 1}: Name is required`;
        return;
      }
      if (service.salePrice <= 0) {
        this.errorMessage = `Service ${i + 1}: Sale price must be greater than 0`;
        return;
      }
      if ((service.serviceType === 'FLIGHT' || service.serviceType === 'BUS') && !service.originLocationId) {
        this.errorMessage = `Service ${i + 1}: Origin location is required`;
        return;
      }
      if ((service.serviceType === 'FLIGHT' || service.serviceType === 'BUS') && !service.destinationLocationId) {
        this.errorMessage = `Service ${i + 1}: Destination location is required`;
        return;
      }
    }

    this.isSaving = true;
    this.errorMessage = '';

    try {
      if (this.selectedEvent && this.selectedEvent.orderId) {
        // Update existing services and create new ones
        let statusChanged = false;
        let newServicesCount = 0;

        for (const service of this.services) {
          if (service.serviceId) {
            // Update existing service
            // Track original status for notification
            const originalStatus = this.selectedEvent.extendedProps.status;

            const serviceData: any = {
              service_type: service.serviceType,
              status: service.status,
              name: service.name,
              description: service.description,
              cost_price: service.costPrice.toString(),
              sale_price: service.salePrice.toString(),
              origin_location_id: service.originLocationId,
              destination_location_id: service.destinationLocationId,
              pnr_code: service.pnrCode || null,
              company: service.company || null,
              route_guide: service.routeGuide || null,
              departure_datetime: service.departureDate && service.departureTime
                ? new Date(`${service.departureDate}T${service.departureTime}`).toISOString()
                : null,
              arrival_datetime: service.arrivalDate && service.arrivalTime
                ? new Date(`${service.arrivalDate}T${service.arrivalTime}`).toISOString()
                : null,
              hotel_name: service.hotelName || null,
              reservation_number: service.reservationNumber || null,
              check_in_datetime: service.checkInDate && service.checkInTime
                ? new Date(`${service.checkInDate}T${service.checkInTime}`).toISOString()
                : null,
              check_out_datetime: service.checkOutDate && service.checkOutTime
                ? new Date(`${service.checkOutDate}T${service.checkOutTime}`).toISOString()
                : null,
              weight_kg: service.weightKg > 0 ? service.weightKg.toString() : null,
              event_start_date: service.departureDate
                ? new Date(`${service.departureDate}T${service.departureTime || '00:00'}`).toISOString()
                : null,
              event_end_date: service.arrivalDate
                ? new Date(`${service.arrivalDate}T${service.arrivalTime || '23:59'}`).toISOString()
                : null
            };

            await this.ordersService.updateService(service.serviceId, serviceData).toPromise();

            // Upload only NEW images for existing service
            // Check if there are more images now than when we loaded the service
            const originalCount = service.originalImageCount || 0;
            if (service.uploadedImages.length > originalCount) {
              // Only send the new images (the ones added after loading)
              const newImages = service.uploadedImages.slice(originalCount);
              const imageUrls = newImages.map(img => img.url);
              await this.ordersService.addServiceImages(service.serviceId, imageUrls).toPromise();
            }

            // Show notification if status changed
            if (originalStatus !== service.status) {
              statusChanged = true;
              const statusLabels: Record<ServiceStatus, string> = {
                'activo': 'Activo',
                'postpuesto': 'Postpuesto',
                'cancelado': 'Cancelado'
              };
              this.toastr.success(
                `Estado cambiado de ${statusLabels[originalStatus]} a ${statusLabels[service.status]}`,
                'Estado Actualizado'
              );
            }
          } else {
            // Create new service for this order
            newServicesCount++;
            const serviceData: ServiceCreate = {
              order_id: this.selectedEvent.orderId,
              service_type: service.serviceType,
              name: service.name,
              description: service.description,
              cost_price: service.costPrice.toString(),
              sale_price: service.salePrice.toString(),
              origin_location_id: service.originLocationId,
              destination_location_id: service.destinationLocationId,
              pnr_code: service.pnrCode || null,
              company: service.company || null,
              route_guide: service.routeGuide || null,
              departure_datetime: service.departureDate && service.departureTime
                ? new Date(`${service.departureDate}T${service.departureTime}`).toISOString()
                : null,
              arrival_datetime: service.arrivalDate && service.arrivalTime
                ? new Date(`${service.arrivalDate}T${service.arrivalTime}`).toISOString()
                : null,
              hotel_name: service.hotelName || null,
              reservation_number: service.reservationNumber || null,
              check_in_datetime: service.checkInDate && service.checkInTime
                ? new Date(`${service.checkInDate}T${service.checkInTime}`).toISOString()
                : null,
              check_out_datetime: service.checkOutDate && service.checkOutTime
                ? new Date(`${service.checkOutDate}T${service.checkOutTime}`).toISOString()
                : null,
              weight_kg: service.weightKg > 0 ? service.weightKg.toString() : null,
              event_start_date: service.departureDate
                ? new Date(`${service.departureDate}T${service.departureTime || '00:00'}`).toISOString()
                : null,
              event_end_date: service.arrivalDate
                ? new Date(`${service.arrivalDate}T${service.arrivalTime || '23:59'}`).toISOString()
                : null,
              calendar_color: null,
              calendar_icon: null
            };

            const createdService = await this.ordersService.addServiceToOrder(this.selectedEvent.orderId, serviceData).toPromise();

            // Upload images for new service
            if (createdService && service.uploadedImages.length > 0) {
              const imageUrls = service.uploadedImages.map(img => img.url);
              await this.ordersService.addServiceImages(createdService.id, imageUrls).toPromise();
            }
          }
        }

        // Show appropriate success message
        if (newServicesCount > 0) {
          this.toastr.success(
            `Venta actualizada: ${newServicesCount} servicio${newServicesCount > 1 ? 's' : ''} agregado${newServicesCount > 1 ? 's' : ''}`,
            'Actualización Exitosa'
          );
        } else {
          this.toastr.success('Venta actualizada correctamente', 'Actualización Exitosa');
        }

        this.isSaving = false;

        // Reload calendar
        this.loadOrders();

        // Close modal
        setTimeout(() => {
          this.closeModal();
        }, 800);
        return;
      }

      // Create new order
      const orderData: OrderCreate = {
        customer_id: this.selectedCustomer.id
      };

      const createdOrder = await this.ordersService.createOrder(orderData).toPromise();

      if (!createdOrder) {
        throw new Error('Failed to create order');
      }

      // Create services for the order
      for (const service of this.services) {
        const serviceData: ServiceCreate = {
          order_id: createdOrder.id,
          service_type: service.serviceType,
          name: service.name,
          description: service.description,
          cost_price: service.costPrice.toString(),
          sale_price: service.salePrice.toString(),
          origin_location_id: service.originLocationId,
          destination_location_id: service.destinationLocationId,
          pnr_code: service.pnrCode || null,
          company: service.company || null,
          route_guide: service.routeGuide || null,
          departure_datetime: service.departureDate && service.departureTime
            ? new Date(`${service.departureDate}T${service.departureTime}`).toISOString()
            : null,
          arrival_datetime: service.arrivalDate && service.arrivalTime
            ? new Date(`${service.arrivalDate}T${service.arrivalTime}`).toISOString()
            : null,
          hotel_name: service.hotelName || null,
          reservation_number: service.reservationNumber || null,
          check_in_datetime: service.checkInDate && service.checkInTime
            ? new Date(`${service.checkInDate}T${service.checkInTime}`).toISOString()
            : null,
          check_out_datetime: service.checkOutDate && service.checkOutTime
            ? new Date(`${service.checkOutDate}T${service.checkOutTime}`).toISOString()
            : null,
          weight_kg: service.weightKg > 0 ? service.weightKg.toString() : null,
          event_start_date: service.departureDate
            ? new Date(`${service.departureDate}T${service.departureTime || '00:00'}`).toISOString()
            : null,
          event_end_date: service.arrivalDate
            ? new Date(`${service.arrivalDate}T${service.arrivalTime || '23:59'}`).toISOString()
            : null,
          calendar_color: null,
          calendar_icon: null
        };

        const createdService = await this.ordersService.addServiceToOrder(createdOrder.id, serviceData).toPromise();

        // Upload images
        if (createdService && service.uploadedImages.length > 0) {
          const imageUrls = service.uploadedImages.map(img => img.url);
          await this.ordersService.addServiceImages(createdService.id, imageUrls).toPromise();
        }
      }

      this.toastr.success('Venta registrada exitosamente', 'Venta Creada');
      this.isSaving = false;

      // Reload calendar
      this.loadOrders();

      // Close modal
      setTimeout(() => {
        this.closeModal();
      }, 800);

    } catch (error: any) {
      console.error('Error saving order:', error);
      this.errorMessage = error.error?.detail || 'Failed to save order';
      this.toastr.error(this.errorMessage, 'Error al Guardar');
      this.isSaving = false;
    }
  }

  resetModalFields() {
    this.selectedCustomer = null;
    this.customerSearchQuery = '';
    this.customerSearchResults = [];
    this.showCustomerDropdown = false;
    this.showNewCustomerForm = false;
    this.services = [];
    this.orderNotes = '';
    this.selectedEvent = null;
    this.errorMessage = '';
    this.successMessage = '';
  }

  openModal() {
    this.isOpen = true;
    if (this.services.length === 0) {
      this.addService();
    }
  }

  closeModal() {
    this.isOpen = false;
    this.resetModalFields();
  }

  renderEventContent(eventInfo: any) {
    const props = eventInfo.event.extendedProps;

    // Get status badge with solid colors that stand out
    const statusBadge = props.status === 'activo'
      ? '<span class="inline-block px-2 py-0.5 text-[9px] font-bold rounded-md bg-green-500 text-white shadow-sm">ACTIVO</span>'
      : props.status === 'postpuesto'
      ? '<span class="inline-block px-2 py-0.5 text-[9px] font-bold rounded-md bg-yellow-400 text-gray-900 shadow-sm">POSTPUESTO</span>'
      : '<span class="inline-block px-2 py-0.5 text-[9px] font-bold rounded-md bg-red-500 text-white shadow-sm">CANCELADO</span>';

    // Profit badge with distinctive styling
    const profit = props.commission || 0;
    const profitBadge = `<span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-emerald-500 text-white shadow-sm">
      <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clip-rule="evenodd"/>
      </svg>
      $${profit.toFixed(0)}
    </span>`;

    return {
      html: `
        <div class="fc-event-main-frame px-2 py-1.5">
          <div class="flex items-start gap-1.5">
            <span class="text-base flex-shrink-0" style="line-height: 1;">${props.serviceIcon || '📋'}</span>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1 text-xs font-semibold text-white truncate">
                <span class="truncate">${props.customerName || 'Customer'}</span>
              </div>
              <div class="text-[10px] text-white/90 mt-0.5 truncate">
                ${props.mainService || 'Service'}
              </div>
              <div class="flex items-center flex-wrap gap-1 mt-1">
                ${statusBadge}
                <span class="text-[9px] font-semibold text-white/90 bg-black/20 px-1.5 py-0.5 rounded">$${props.totalAmount?.toFixed(0) || 0}</span>
                ${profitBadge}
              </div>
            </div>
          </div>
        </div>
      `
    };
  }

  // Customer edit modal functions
  openEditCustomerModal(customerId: number) {
    console.log('📂 Opening edit modal for customer:', customerId);
    // Fetch customer data
    this.customersService.getCustomer(customerId).subscribe({
      next: (customer) => {
        console.log('✅ Customer data loaded:', customer);
        console.log('📞 Current phone:', customer.phone_number);
        this.editingCustomer = customer;
        this.editCustomerForm = {
          full_name: customer.full_name,
          email: customer.email,
          phone_number: customer.phone_number,
          document_id: customer.document_id,
          address: customer.address,
          notes: customer.notes
        };
        console.log('📝 Form populated:', this.editCustomerForm);
        this.isEditCustomerModalOpen = true;
      },
      error: (error) => {
        console.error('❌ Error loading customer:', error);
        this.toastr.error('No se pudo cargar la información del cliente', 'Error');
      }
    });
  }

  closeEditCustomerModal() {
    this.isEditCustomerModalOpen = false;
    this.editingCustomer = null;
    this.editCustomerForm = {
      full_name: '',
      email: null,
      phone_number: null,
      document_id: null,
      address: null,
      notes: null
    };
  }

  async handleUpdateCustomer() {
    if (!this.editingCustomer) return;

    // Validate required fields
    if (!this.editCustomerForm.full_name?.trim()) {
      this.toastr.warning('El nombre completo es obligatorio', 'Validación');
      return;
    }

    // Validate phone number if provided
    if (this.editCustomerForm.phone_number && this.editCustomerForm.phone_number.trim()) {
      const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
      const cleanPhone = this.editCustomerForm.phone_number.replace(/\s/g, '');

      if (!phoneRegex.test(cleanPhone)) {
        this.toastr.warning('El número de teléfono no es válido. Formato ejemplo: +58 412-1234567', 'Validación');
        return;
      }

      // Check minimum length (at least 7 digits)
      const digitsOnly = cleanPhone.replace(/\D/g, '');
      if (digitsOnly.length < 7) {
        this.toastr.warning('El número de teléfono debe tener al menos 7 dígitos', 'Validación');
        return;
      }
    }

    // Validate email if provided
    if (this.editCustomerForm.email && this.editCustomerForm.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.editCustomerForm.email)) {
        this.toastr.warning('El correo electrónico no es válido', 'Validación');
        return;
      }
    }

    try {
      console.log('🔄 Updating customer:', this.editingCustomer.id);
      console.log('📝 Data to update:', this.editCustomerForm);

      const updatedCustomer = await this.customersService.updateCustomer(
        this.editingCustomer.id,
        this.editCustomerForm
      ).toPromise();

      console.log('✅ Customer updated successfully:', updatedCustomer);
      console.log('📞 Updated phone:', updatedCustomer?.phone_number);

      this.toastr.success('Cliente actualizado exitosamente', 'Éxito');

      // Reload orders to reflect changes in the table
      console.log('🔄 Reloading orders...');
      await this.loadOrders();
      console.log('✅ Orders reloaded');

      // Reapply filters to update the table view
      console.log('🔄 Reapplying filters...');
      this.applyFilters();
      console.log('✅ Filters applied, filtered events:', this.filteredEvents.length);

      // Log a sample event to check phone
      if (this.filteredEvents.length > 0) {
        const sampleEvent = this.filteredEvents.find(e => e.extendedProps.customerId === this.editingCustomer!.id);
        if (sampleEvent) {
          console.log('📋 Updated customer in table:', {
            name: sampleEvent.extendedProps.customerName,
            phone: sampleEvent.extendedProps.customerPhone,
            customerId: sampleEvent.extendedProps.customerId
          });
        }
      }

      // Update selectedCustomer if we're in edit order modal
      if (this.selectedCustomer && this.selectedCustomer.id === this.editingCustomer.id) {
        console.log('🔄 Updating selectedCustomer in edit order modal');
        this.selectedCustomer = updatedCustomer!;
      }

      // Force change detection to update the UI
      this.cdr.detectChanges();
      console.log('🔄 Change detection triggered');

      // Close modal
      this.closeEditCustomerModal();
    } catch (error) {
      console.error('❌ Error updating customer:', error);
      this.toastr.error('No se pudo actualizar el cliente', 'Error');
    }
  }
}
