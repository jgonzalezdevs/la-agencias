import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  sales_count?: number;
}

export interface UserCreate {
  email: string;
  password: string;
  full_name: string;
  role?: string;
}

export interface UserUpdate {
  email?: string;
  full_name?: string;
  role?: string;
  is_active?: boolean;
  password?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * List all users
   */
  listUsers(limit: number = 100): Observable<User[]> {
    let params = new HttpParams();
    params = params.set('limit', limit.toString());
    return this.http.get<User[]>(`${this.apiUrl}/users/`, { params });
  }

  /**
   * Get a specific user by ID
   */
  getUser(userId: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${userId}`);
  }

  /**
   * Create a new user
   */
  createUser(user: UserCreate): Observable<User> {
    const formData = new FormData();
    formData.append('email', user.email);
    formData.append('password', user.password);
    formData.append('full_name', user.full_name);
    if (user.role) {
      formData.append('role', user.role);
    }
    return this.http.post<User>(`${this.apiUrl}/users/`, formData);
  }

  /**
   * Update user information
   */
  updateUser(userId: number, user: UserUpdate): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${userId}`, user);
  }

  /**
   * Delete a user
   */
  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${userId}`);
  }
}
