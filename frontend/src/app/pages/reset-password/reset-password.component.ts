import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  newPassword = '';
  confirmPassword = '';
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // Get token from URL query params
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      if (!this.token) {
        this.errorMessage = 'Invalid reset link. Please request a new password reset.';
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onResetPassword() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    if (this.newPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long';
      return;
    }

    if (!this.token) {
      this.errorMessage = 'Invalid reset token';
      return;
    }

    this.isLoading = true;

    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: (response) => {
        this.successMessage = 'Password reset successfully! Redirecting to login...';
        setTimeout(() => {
          this.router.navigate(['/signin']);
        }, 2000);
      },
      error: (error) => {
        console.error('Reset password error:', error);
        this.errorMessage = error.error?.detail || 'Failed to reset password. The link may be invalid or expired.';
        this.isLoading = false;
      }
    });
  }
}
