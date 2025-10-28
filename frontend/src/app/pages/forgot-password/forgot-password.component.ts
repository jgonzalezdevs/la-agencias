import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { LabelComponent } from '../../shared/components/form/label/label.component';
import { InputFieldComponent } from '../../shared/components/form/input/input-field.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LabelComponent,
    InputFieldComponent,
    ButtonComponent
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  email = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email) {
      this.errorMessage = 'Please enter your email address';
      return;
    }

    this.isLoading = true;

    this.authService.forgotPassword(this.email).subscribe({
      next: (response) => {
        this.successMessage = 'If your email is registered, you will receive a password reset link shortly. Check your email inbox.';
        this.isLoading = false;
        this.email = '';
      },
      error: (error) => {
        console.error('Forgot password error:', error);
        // Always show success message to prevent email enumeration
        this.successMessage = 'If your email is registered, you will receive a password reset link shortly. Check your email inbox.';
        this.isLoading = false;
      }
    });
  }
}
