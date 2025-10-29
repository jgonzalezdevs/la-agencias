import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';
import {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  User,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  GoogleAuthResponse
} from '../models/auth.model';
import { JwtService } from './jwt.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'access_token';
  private refreshTokenKey = 'refresh_token';
  private userKey = 'current_user';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private jwtService: JwtService
  ) {}

  /**
   * Traditional email/password login
   */
  login(email: string, password: string, returnUrl?: string): Observable<TokenResponse> {
    // Backend expects form data with 'username' field
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    return this.http.post<TokenResponse>(`${this.apiUrl}/auth/login`, formData)
      .pipe(
        tap(response => this.handleAuthSuccess(response, returnUrl))
      );
  }

  /**
   * Register new user
   */
  register(data: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/auth/register`, data)
      .pipe(
        tap(user => {
          // After registration, automatically log in
          this.login(data.email, data.password).subscribe();
        })
      );
  }

  /**
   * Google OAuth login
   */
  loginWithGoogle(googleToken: string): Observable<GoogleAuthResponse> {
    return this.http.post<GoogleAuthResponse>(`${this.apiUrl}/auth/google`, {
      token: googleToken
    }).pipe(
      tap(response => this.handleAuthSuccess(response))
    );
  }

  /**
   * Request password reset email
   */
  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/forgot-password`, {
      email
    });
  }

  /**
   * Reset password with token
   */
  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/reset-password`, {
      token,
      new_password: newPassword
    });
  }

  /**
   * Get current user profile
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/me`)
      .pipe(
        tap(user => {
          this.setUser(user);
        })
      );
  }

  /**
   * Logout user
   * @param navigate - Whether to navigate to signin page (default: true)
   */
  logout(navigate: boolean = true): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);

    if (navigate) {
      this.router.navigate(['/signin']);
    }
  }

  /**
   * Clear authentication state without navigation
   * Used by interceptor to clear state before it handles navigation
   */
  clearAuthState(): void {
    this.logout(false);
  }

  /**
   * Refresh access token using refresh token
   * Returns new access_token and refresh_token
   */
  refreshToken(): Observable<TokenResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    return this.http.post<TokenResponse>(`${this.apiUrl}/auth/refresh`, {
      refresh_token: refreshToken
    }).pipe(
      tap(response => {
        // Update both tokens in storage
        localStorage.setItem(this.tokenKey, response.access_token);
        localStorage.setItem(this.refreshTokenKey, response.refresh_token);
        console.log('Token refreshed successfully');
      })
    );
  }

  /**
   * Get stored access token
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  /**
   * Check if user has valid token
   */
  hasToken(): boolean {
    return !!this.getToken();
  }

  /**
   * Check if token is expired or will expire soon
   * @param offsetSeconds Number of seconds before expiry to consider token expired (default: 60)
   */
  isTokenExpired(offsetSeconds: number = 60): boolean {
    const token = this.getToken();
    return this.jwtService.isTokenExpired(token, offsetSeconds);
  }

  /**
   * Get token expiration date
   */
  getTokenExpirationDate(): Date | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }
    return this.jwtService.getTokenExpirationDate(token);
  }

  /**
   * Get remaining time until token expires (in seconds)
   */
  getTokenRemainingTime(): number {
    const token = this.getToken();
    if (!token) {
      return 0;
    }
    return this.jwtService.getTokenRemainingTime(token);
  }

  /**
   * Get authorization headers
   */
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Handle successful authentication
   */
  private handleAuthSuccess(response: TokenResponse | GoogleAuthResponse, returnUrl?: string): void {
    localStorage.setItem(this.tokenKey, response.access_token);
    localStorage.setItem(this.refreshTokenKey, response.refresh_token);
    this.isAuthenticatedSubject.next(true);

    // Fetch user profile after login
    this.getCurrentUser().subscribe({
      next: (user) => {
        // Navigate based on user role (check the user object directly)
        let url: string;
        if (returnUrl) {
          url = returnUrl;
        } else {
          // Redirect operators to calendar, admins to dashboard
          url = (user.role === 'operador') ? '/calendar' : '/';
        }
        this.router.navigateByUrl(url);
      },
      error: (err) => {
        console.error('Failed to fetch user profile:', err);
        // Still navigate to dashboard even if profile fetch fails
        const url = returnUrl || '/';
        this.router.navigateByUrl(url);
      }
    });
  }

  /**
   * Store user in localStorage
   */
  private setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  /**
   * Get user from localStorage
   */
  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Check if current user is admin or superuser
   */
  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user ? (user.is_superuser || user.role === 'admin') : false;
  }

  /**
   * Check if current user is operator
   */
  isOperator(): boolean {
    const user = this.currentUserSubject.value;
    return user ? user.role === 'operador' : false;
  }

  /**
   * Get current user value (synchronous)
   */
  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }
}
