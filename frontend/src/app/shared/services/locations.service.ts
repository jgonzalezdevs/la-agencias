import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Location {
  id: number;
  city: string;
  state: string;
  country: string;
  airport_code: string | null;
  terminal_name: string | null;
  sales_counter: number;
  created_at: string;
  updated_at: string;
}

export interface LocationCreate {
  city: string;
  state: string;
  country: string;
  airport_code?: string | null;
  terminal_name?: string | null;
}

export interface LocationUpdate {
  city?: string;
  state?: string;
  country?: string;
  airport_code?: string | null;
  terminal_name?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class LocationsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get all locations
   */
  listLocations(limit: number = 500): Observable<Location[]> {
    let params = new HttpParams();
    params = params.set('limit', limit.toString());

    return this.http.get<Location[]>(`${this.apiUrl}/locations/`, { params });
  }

  /**
   * Search locations by city, state, or airport code
   */
  searchLocations(query: string, limit: number = 100): Observable<Location[]> {
    let params = new HttpParams();
    if (query) {
      params = params.set('q', query);
    }
    params = params.set('limit', limit.toString());

    return this.http.get<Location[]>(`${this.apiUrl}/locations/search`, { params });
  }

  /**
   * Get a specific location by ID
   */
  getLocation(locationId: number): Observable<Location> {
    return this.http.get<Location>(`${this.apiUrl}/locations/${locationId}`);
  }

  /**
   * Create a new location
   */
  createLocation(location: LocationCreate): Observable<Location> {
    return this.http.post<Location>(`${this.apiUrl}/locations/`, location);
  }

  /**
   * Update location information
   */
  updateLocation(locationId: number, location: LocationUpdate): Observable<Location> {
    return this.http.put<Location>(`${this.apiUrl}/locations/${locationId}`, location);
  }
}
