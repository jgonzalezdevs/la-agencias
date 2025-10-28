import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { HttpClientModule } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-signin-form',
  imports: [
    CommonModule,
    LabelComponent,
    CheckboxComponent,
    ButtonComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule,
    HttpClientModule,
  ],
  templateUrl: './signin-form.component.html',
  styles: ``
})
export class SigninFormComponent implements OnInit {

  showPassword = false;
  isChecked = false;
  isLoading = false;
  errorMessage = '';
  returnUrl = '/';

  email = '';
  password = '';

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Get return URL from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    this.initGoogleSignIn();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSignIn() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter email and password';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.email, this.password, this.returnUrl).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        this.isLoading = false;
        // AuthService handles navigation to returnUrl
      },
      error: (error) => {
        console.error('Login error:', error);
        this.errorMessage = error.error?.detail || 'Login failed. Please check your credentials.';
        this.isLoading = false;
      }
    });
  }

  initGoogleSignIn() {
    // Initialize Google Sign-In
    if (typeof google !== 'undefined' && google.accounts) {
      google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: (response: any) => this.handleGoogleResponse(response)
      });
    }
  }

  handleGoogleResponse(response: any) {
    if (response.credential) {
      this.isLoading = true;
      this.errorMessage = '';

      // Send the Google token to backend
      this.authService.loginWithGoogle(response.credential).subscribe({
        next: (authResponse) => {
          console.log('Google login successful:', authResponse);
          this.isLoading = false;
          // AuthService handles navigation
        },
        error: (error) => {
          console.error('Google login error:', error);
          this.errorMessage = error.error?.detail || 'Google Sign-In failed. Please try again.';
          this.isLoading = false;
        }
      });
    }
  }

  onGoogleSignIn() {
    // Trigger Google One Tap sign in
    if (typeof google !== 'undefined' && google.accounts) {
      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('Google One Tap was not displayed or was skipped');
        }
      });
    } else {
      this.errorMessage = 'Google Sign-In is not available. Please refresh the page.';
    }
  }
}
