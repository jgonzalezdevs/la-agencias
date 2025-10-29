import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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

export interface CustomerCreate {
  full_name: string;
  email?: string | null;
  phone_number?: string | null;
  document_id?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface CustomerUpdate {
  full_name?: string;
  email?: string | null;
  phone_number?: string | null;
  document_id?: string | null;
  address?: string | null;
  notes?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class CustomersService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Create a new customer
   */
  createCustomer(customer: CustomerCreate): Observable<Customer> {
    return this.http.post<Customer>(`${this.apiUrl}/customers/`, customer);
  }

  /**
   * Search customers by name, email, or document ID
   */
  searchCustomers(query: string, limit: number = 50): Observable<Customer[]> {
    let params = new HttpParams();
    if (query) {
      params = params.set('q', query);
    }
    params = params.set('limit', limit.toString());

    return this.http.get<Customer[]>(`${this.apiUrl}/customers/search`, { params });
  }

  /**
   * Get a specific customer by ID
   */
  getCustomer(customerId: number): Observable<Customer> {
    return this.http.get<Customer>(`${this.apiUrl}/customers/${customerId}`);
  }

  /**
   * Update customer information
   */
  updateCustomer(customerId: number, customer: CustomerUpdate): Observable<Customer> {
    return this.http.put<Customer>(`${this.apiUrl}/customers/${customerId}`, customer);
  }
}
