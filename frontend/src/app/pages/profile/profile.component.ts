import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { EditProfileModalComponent } from '../../shared/components/user-profile/edit-profile-modal/edit-profile-modal.component';
import { AuthService } from '../../shared/services/auth.service';
import { UserService } from '../../shared/services/user.service';
import { User } from '../../shared/models/auth.model';

@Component({
  selector: 'app-profile',
  imports: [
    CommonModule,
    PageBreadcrumbComponent,
    EditProfileModalComponent,
  ],
  templateUrl: './profile.component.html',
  styles: ``
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  isLoading = true;
  errorMessage = '';
  isEditModalOpen = false;

  constructor(
    private authService: AuthService,
    public userService: UserService
  ) {}

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    this.isLoading = true;

    // Try to get user from AuthService first (from localStorage)
    this.authService.currentUser$.subscribe({
      next: (user) => {
        if (user) {
          this.currentUser = user;
          this.isLoading = false;
        } else {
          // If not in localStorage, fetch from API
          this.fetchUserProfile();
        }
      },
      error: () => {
        this.fetchUserProfile();
      }
    });
  }

  private fetchUserProfile() {
    this.userService.getCurrentUserProfile().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
        this.errorMessage = 'Failed to load user profile';
        this.isLoading = false;
      }
    });
  }

  openEditModal() {
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
  }

  onProfileUpdated(updatedUser: User) {
    this.currentUser = updatedUser;
    // Update in localStorage and AuthService
    localStorage.setItem('current_user', JSON.stringify(updatedUser));
    // Force reload user profile to ensure consistency
    this.authService.getCurrentUser().subscribe();
  }
}
