import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/auth.model';

export interface UpdateUserProfile {
  email?: string;
  full_name?: string;
  password?: string;
}

export interface TopSeller {
  id: number;
  email: string;
  full_name: string;
  sales_count: number;
  role: string;
  is_active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:5050/api/v1';
  private baseUrl = 'http://localhost:5050';

  constructor(private http: HttpClient) {}

  /**
   * Get full avatar URL from backend path
   * This is a pure function - safe to call in templates
   */
  getAvatarUrl(avatarPath: string | null | undefined): string | null {
    if (!avatarPath) {
      return null;
    }
    // If it's already a full URL, return it
    if (avatarPath.startsWith('http')) {
      return avatarPath;
    }
    // Otherwise, prepend the base URL
    return `${this.baseUrl}${avatarPath}`;
  }

  /**
   * Get current user profile
   */
  getCurrentUserProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/me`);
  }

  /**
   * Update current user profile
   */
  updateCurrentUserProfile(data: UpdateUserProfile): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/me`, data);
  }

  /**
   * Update current user profile with avatar (multipart/form-data)
   */
  updateCurrentUserProfileWithAvatar(formData: FormData): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/me`, formData);
  }

  /**
   * Get list of all users (superuser only)
   */
  getAllUsers(skip: number = 0, limit: number = 100): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/`, {
      params: { skip: skip.toString(), limit: limit.toString() }
    });
  }

  /**
   * Get top sellers ranking
   */
  getTopSellers(limit: number = 10): Observable<TopSeller[]> {
    return this.http.get<TopSeller[]>(`${this.apiUrl}/users/top-sellers`, {
      params: { limit: limit.toString() }
    });
  }

  /**
   * Get user by ID (superuser only)
   */
  getUserById(userId: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${userId}`);
  }
}
