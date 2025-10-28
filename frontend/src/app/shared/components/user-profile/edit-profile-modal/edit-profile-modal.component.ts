import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../../models/auth.model';
import { UserService, UpdateUserProfile } from '../../../services/user.service';
import { LabelComponent } from '../../form/label/label.component';
import { InputFieldComponent } from '../../form/input/input-field.component';

@Component({
  selector: 'app-edit-profile-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LabelComponent,
    InputFieldComponent
  ],
  templateUrl: './edit-profile-modal.component.html',
  styleUrl: './edit-profile-modal.component.css'
})
export class EditProfileModalComponent implements OnInit {
  @Input() user: User | null = null;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() profileUpdated = new EventEmitter<User>();

  fullName = '';
  email = '';
  newPassword = '';
  confirmPassword = '';
  showPassword = false;
  selectedFile: File | null = null;
  avatarPreview: string | null = null;

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private userService: UserService) {}

  ngOnInit() {
    if (this.user) {
      this.fullName = this.user.full_name;
      this.email = this.user.email;
      this.avatarPreview = this.userService.getAvatarUrl(this.user.avatar);
    }
  }

  ngOnChanges() {
    if (this.user) {
      this.fullName = this.user.full_name;
      this.email = this.user.email;
      this.avatarPreview = this.userService.getAvatarUrl(this.user.avatar);
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onClose() {
    this.close.emit();
    this.resetForm();
  }

  resetForm() {
    this.newPassword = '';
    this.confirmPassword = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.selectedFile = null;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        this.errorMessage = 'Only image files (JPEG, PNG, GIF) are allowed';
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        this.errorMessage = 'File size must be less than 5MB';
        return;
      }

      this.selectedFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.avatarPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeAvatar() {
    this.selectedFile = null;
    this.avatarPreview = this.userService.getAvatarUrl(this.user?.avatar);
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    // Validations
    if (!this.fullName || !this.email) {
      this.errorMessage = 'Full name and email are required';
      return;
    }

    // Password cannot be changed through this form
    if (this.newPassword || this.confirmPassword) {
      this.errorMessage = 'Password cannot be changed through this form. Please use a separate password change feature.';
      return;
    }

    this.isLoading = true;

    // Create FormData for multipart/form-data submission
    const formData = new FormData();
    formData.append('full_name', this.fullName);
    formData.append('email', this.email);

    if (this.selectedFile) {
      formData.append('avatar', this.selectedFile);
    }

    this.userService.updateCurrentUserProfileWithAvatar(formData).subscribe({
      next: (updatedUser) => {
        this.successMessage = 'Profile updated successfully!';
        this.isLoading = false;

        // Emit the updated user
        this.profileUpdated.emit(updatedUser);

        // Close modal after 1 second
        setTimeout(() => {
          this.onClose();
        }, 1000);
      },
      error: (error) => {
        console.error('Update profile error:', error);
        this.errorMessage = error.error?.detail || 'Failed to update profile';
        this.isLoading = false;
      }
    });
  }
}
