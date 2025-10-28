import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, switchMap, BehaviorSubject, filter, take, Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);
  const token = authService.getToken();

  // Clone the request and add authorization header if token exists
  let clonedRequest = req;
  if (token) {
    clonedRequest = addTokenToRequest(req, token);
  }

  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized errors
      if (error.status === 401 && token) {
        return handle401Error(req, next, authService, router, toastService, error);
      }

      return throwError(() => error);
    })
  );
};

/**
 * Add token to request headers
 */
function addTokenToRequest(request: HttpRequest<any>, token: string): HttpRequest<any> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

/**
 * Handle 401 errors with token refresh logic
 */
function handle401Error(
  req: HttpRequest<any>,
  next: (req: HttpRequest<any>) => Observable<HttpEvent<any>>,
  authService: AuthService,
  router: Router,
  toastService: ToastService,
  error: HttpErrorResponse
): Observable<HttpEvent<any>> {
  // Don't attempt refresh on auth endpoints
  if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh')) {
    return throwError(() => error);
  }

  // If already refreshing, wait for the new token
  if (isRefreshing) {
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => {
        return next(addTokenToRequest(req, token!));
      })
    );
  }

  // Start token refresh process
  isRefreshing = true;
  refreshTokenSubject.next(null);

  console.log('Token expired, attempting to refresh...');

  return authService.refreshToken().pipe(
    switchMap(tokenResponse => {
      // Refresh successful
      isRefreshing = false;
      const newToken = tokenResponse.access_token;
      refreshTokenSubject.next(newToken);

      console.log('Token refreshed successfully');

      // Retry the original request with new token
      return next(addTokenToRequest(req, newToken));
    }),
    catchError(refreshError => {
      // Refresh failed - logout user
      isRefreshing = false;
      refreshTokenSubject.next(null);

      console.warn('Token refresh failed. Logging out...');

      // Show notification to user
      toastService.warning('Your session has expired. Please log in again.', 5000);

      // Store current URL for redirect after login
      const currentUrl = router.url;

      // Clear authentication state (without navigation)
      authService.clearAuthState();

      // Redirect to login with return URL (if not already on auth pages)
      if (!currentUrl.includes('/signin') && !currentUrl.includes('/signup')) {
        router.navigate(['/signin'], {
          queryParams: { returnUrl: currentUrl },
          replaceUrl: true
        });
      }

      return throwError(() => refreshError);
    })
  );
}
