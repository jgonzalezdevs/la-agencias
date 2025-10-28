import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-signup-form',
  imports: [
    CommonModule,
    LabelComponent,
    CheckboxComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule,
    HttpClientModule,
  ],
  templateUrl: './signup-form.component.html',
  styles: ``
})
export class SignupFormComponent {

  showPassword = false;
  isChecked = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  fname = '';
  lname = '';
  email = '';
  password = '';

  constructor(private authService: AuthService) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSignUp() {
    if (!this.fname || !this.lname || !this.email || !this.password) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    if (!this.isChecked) {
      this.errorMessage = 'Please accept the Terms and Conditions';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const fullName = `${this.fname} ${this.lname}`;

    this.authService.register({
      email: this.email,
      full_name: fullName,
      password: this.password
    }).subscribe({
      next: (user) => {
        console.log('Registration successful:', user);
        this.successMessage = 'Account created successfully! Logging you in...';
        this.isLoading = false;
        // AuthService handles automatic login and navigation
      },
      error: (error) => {
        console.error('Registration error:', error);
        this.errorMessage = error.error?.detail || 'Registration failed. Please try again.';
        this.isLoading = false;
      }
    });
  }

  onGoogleSignUp() {
    // This will be implemented after backend Google OAuth endpoint is ready
    console.log('Google Sign-Up clicked - Backend endpoint needed');
    this.errorMessage = 'Google Sign-Up will be available soon';
  }
}
