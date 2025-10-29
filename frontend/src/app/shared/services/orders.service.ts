import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Service Status (for individual tickets/services)
export type ServiceStatus = 'activo' | 'cancelado' | 'postpuesto';

// Service Types
export type ServiceType = 'FLIGHT' | 'BUS' | 'HOTEL' | 'LUGGAGE' | 'CAR' | 'OTHER';

// User (seller/operator)
export interface User {
  id: number;
  email: string;
  full_name: string;
  role?: string;
  sales_count?: number;
}

// Customer (buyer)
export interface Customer {
  id: number;
  full_name: string;
  email: string | null;
  phone_number: string | null;
  document_id: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Location
export interface Location {
  id: number;
  country: string;
  state?: string;
  city: string;
  airport_code?: string;
  latitude?: number;
  longitude?: number;
}

// Service (ticket, hotel, luggage, etc.)
export interface Service {
  id: number;
  order_id: number;
  service_type: ServiceType;
  status: ServiceStatus;
  name: string;
  description?: string;
  cost_price: string;
  sale_price: string;

  // Calendar fields
  event_start_date?: string;
  event_end_date?: string;
  calendar_color?: string;
  calendar_icon?: string;

  // FLIGHT/BUS fields
  origin_location_id?: number;
  destination_location_id?: number;
  origin_location?: Location;
  destination_location?: Location;
  pnr_code?: string;
  company?: string;
  route_guide?: string;
  departure_datetime?: string;
  arrival_datetime?: string;

  // HOTEL fields
  hotel_name?: string;
  reservation_number?: string;
  check_in_datetime?: string;
  check_out_datetime?: string;

  // LUGGAGE fields
  weight_kg?: string;
  associated_service_id?: number;

  // Service images/attachments
  images?: ServiceImage[];
}

// Service Image
export interface ServiceImage {
  id: number;
  service_id: number;
  image_url: string;
}

// Order (all orders are considered paid, status is tracked per service)
export interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  user_id?: number;
  total_cost_price: string;
  total_sale_price: string;
  total_profit: string;
  created_at: string;
}

// Order with full details
export interface OrderWithDetails extends Order {
  user?: User;
  customer: Customer;
  services: Service[];
}

// Order Create
export interface OrderCreate {
  customer_id: number;
}

// Service Create
export interface ServiceCreate {
  order_id: number;
  service_type: ServiceType;
  status?: ServiceStatus;
  name: string;
  description?: string;
  cost_price: string;
  sale_price: string;

  // Calendar fields
  event_start_date?: string | null;
  event_end_date?: string | null;
  calendar_color?: string | null;
  calendar_icon?: string | null;

  // FLIGHT/BUS fields
  origin_location_id?: number | null;
  destination_location_id?: number | null;
  pnr_code?: string | null;
  company?: string | null;
  route_guide?: string | null;
  departure_datetime?: string | null;
  arrival_datetime?: string | null;

  // HOTEL fields
  hotel_name?: string | null;
  reservation_number?: string | null;
  check_in_datetime?: string | null;
  check_out_datetime?: string | null;

  // LUGGAGE fields
  weight_kg?: string | null;
  associated_service_id?: number | null;
}

// Order filters for list endpoint
export interface OrderFilters {
  user_id?: number;
  customer_id?: number;
  start_date?: string;
  end_date?: string;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Create a new order
   */
  createOrder(orderData: OrderCreate): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/orders/`, orderData);
  }

  /**
   * List orders with optional filters
   */
  listOrders(filters?: OrderFilters): Observable<Order[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.user_id !== undefined) {
        params = params.set('user_id', filters.user_id.toString());
      }
      if (filters.customer_id !== undefined) {
        params = params.set('customer_id', filters.customer_id.toString());
      }
      if (filters.start_date) {
        params = params.set('start_date', filters.start_date);
      }
      if (filters.end_date) {
        params = params.set('end_date', filters.end_date);
      }
      if (filters.limit !== undefined) {
        params = params.set('limit', filters.limit.toString());
      }
    }

    return this.http.get<Order[]>(`${this.apiUrl}/orders/`, { params });
  }

  /**
   * List orders with complete details (services, customer, user)
   * Use this when you need all nested data in a single request
   */
  listOrdersWithDetails(filters?: OrderFilters): Observable<OrderWithDetails[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.user_id !== undefined) {
        params = params.set('user_id', filters.user_id.toString());
      }
      if (filters.customer_id !== undefined) {
        params = params.set('customer_id', filters.customer_id.toString());
      }
      if (filters.start_date) {
        params = params.set('start_date', filters.start_date);
      }
      if (filters.end_date) {
        params = params.set('end_date', filters.end_date);
      }
      if (filters.limit !== undefined) {
        params = params.set('limit', filters.limit.toString());
      }
    }

    return this.http.get<OrderWithDetails[]>(`${this.apiUrl}/orders/with-details/list`, { params });
  }

  /**
   * Get order details with services and customer info
   */
  getOrderDetails(orderId: number): Observable<OrderWithDetails> {
    return this.http.get<OrderWithDetails>(`${this.apiUrl}/orders/${orderId}`);
  }

  /**
   * Add service to an order
   */
  addService(orderId: number, serviceData: Partial<Service>): Observable<Service> {
    return this.http.post<Service>(`${this.apiUrl}/orders/${orderId}/services`, serviceData);
  }

  /**
   * Add service to an order (alias for addService with ServiceCreate type)
   */
  addServiceToOrder(orderId: number, serviceData: ServiceCreate): Observable<Service> {
    return this.http.post<Service>(`${this.apiUrl}/orders/${orderId}/services`, serviceData);
  }

  /**
   * Update a service
   */
  updateService(serviceId: number, serviceData: Partial<Service>): Observable<Service> {
    return this.http.put<Service>(`${this.apiUrl}/orders/services/${serviceId}`, serviceData);
  }

  /**
   * Delete a service
   */
  deleteService(serviceId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/orders/services/${serviceId}`);
  }

  /**
   * Add images to a service
   */
  addServiceImages(serviceId: number, imageUrls: string[]): Observable<ServiceImage[]> {
    return this.http.post<ServiceImage[]>(`${this.apiUrl}/orders/services/${serviceId}/images`, imageUrls);
  }

  /**
   * Get available years from FLIGHT/BUS services
   */
  getAvailableYears(): Observable<{years: number[]}> {
    return this.http.get<{years: number[]}>(`${this.apiUrl}/stats/available-years`);
  }
}
