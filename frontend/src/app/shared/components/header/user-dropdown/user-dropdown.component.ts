import { Component, OnInit } from '@angular/core';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DropdownItemTwoComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component-two';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/auth.model';

@Component({
  selector: 'app-user-dropdown',
  templateUrl: './user-dropdown.component.html',
  imports:[CommonModule,RouterModule,DropdownComponent,DropdownItemTwoComponent]
})
export class UserDropdownComponent implements OnInit {
  isOpen = false;
  currentUser: User | null = null;
  avatarUrl: string | null = null;

  constructor(
    public authService: AuthService,
    private router: Router,
    public userService: UserService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe({
      next: (user) => {
        this.currentUser = user;
        // Cache avatar URL to avoid repeated calculations in template
        this.avatarUrl = this.userService.getAvatarUrl(user?.avatar);
      }
    });
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  closeDropdown() {
    this.isOpen = false;
  }

  logout() {
    this.authService.logout();
    this.closeDropdown();
  }
}