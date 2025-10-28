import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService, User, UserCreate, UserUpdate } from '../../shared/services/users.service';
import { ToastrService } from 'ngx-toastr';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  isLoading = false;
  searchQuery = '';

  // Create user modal
  isCreateModalOpen = false;
  newUser: UserCreate = {
    email: '',
    password: '',
    full_name: '',
    role: 'operator'
  };

  // Edit user modal
  isEditModalOpen = false;
  editingUser: User | null = null;
  editUserForm: UserUpdate = {
    email: '',
    full_name: '',
    role: 'operator',
    is_active: true,
    password: ''
  };

  // Delete confirmation modal
  isDeleteModalOpen = false;
  userToDelete: User | null = null;

  availableRoles = [
    { value: 'admin', label: 'Administrador' },
    { value: 'operator', label: 'Operador' }
  ];

  constructor(
    private usersService: UsersService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    this.usersService.listUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.applyFilter();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.toastr.error('No se pudieron cargar los usuarios', 'Error de Carga');
        this.isLoading = false;
      }
    });
  }

  applyFilter() {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredUsers = [...this.users];
      return;
    }

    this.filteredUsers = this.users.filter(user =>
      user.full_name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  }

  onSearchInput(event: any) {
    this.searchQuery = event.target.value;
    this.applyFilter();
  }

  getRoleLabel(role: string): string {
    const roleObj = this.availableRoles.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
  }

  getRoleBadgeClass(role: string): string {
    const classes: { [key: string]: string } = {
      'admin': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      'operator': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
    };
    return classes[role] || classes['operator'];
  }

  getStatusBadgeClass(isActive: boolean): string {
    return isActive
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
      : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
  }

  // Create user modal
  openCreateModal() {
    this.newUser = {
      email: '',
      password: '',
      full_name: '',
      role: 'operator'
    };
    this.isCreateModalOpen = true;
  }

  closeCreateModal() {
    this.isCreateModalOpen = false;
    this.newUser = {
      email: '',
      password: '',
      full_name: '',
      role: 'operator'
    };
  }

  handleCreateUser() {
    // Validation
    if (!this.newUser.email?.trim()) {
      this.toastr.warning('El correo electrónico es obligatorio', 'Validación');
      return;
    }

    if (!this.newUser.full_name?.trim()) {
      this.toastr.warning('El nombre completo es obligatorio', 'Validación');
      return;
    }

    if (!this.newUser.password || this.newUser.password.length < 6) {
      this.toastr.warning('La contraseña debe tener al menos 6 caracteres', 'Validación');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.newUser.email)) {
      this.toastr.warning('El correo electrónico no es válido', 'Validación');
      return;
    }

    this.usersService.createUser(this.newUser).subscribe({
      next: (user) => {
        this.toastr.success('Usuario creado exitosamente', 'Éxito');
        this.loadUsers();
        this.closeCreateModal();
      },
      error: (error) => {
        console.error('Error creating user:', error);
        const message = error.error?.detail || 'No se pudo crear el usuario';
        this.toastr.error(message, 'Error al Crear');
      }
    });
  }

  // Edit user modal
  openEditModal(user: User) {
    this.editingUser = user;
    this.editUserForm = {
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
      password: ''
    };
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.editingUser = null;
    this.editUserForm = {
      email: '',
      full_name: '',
      role: 'operator',
      is_active: true,
      password: ''
    };
  }

  handleUpdateUser() {
    if (!this.editingUser) return;

    // Validation
    if (!this.editUserForm.email?.trim()) {
      this.toastr.warning('El correo electrónico es obligatorio', 'Validación');
      return;
    }

    if (!this.editUserForm.full_name?.trim()) {
      this.toastr.warning('El nombre completo es obligatorio', 'Validación');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.editUserForm.email)) {
      this.toastr.warning('El correo electrónico no es válido', 'Validación');
      return;
    }

    // Validate password if provided
    if (this.editUserForm.password && this.editUserForm.password.length < 6) {
      this.toastr.warning('La contraseña debe tener al menos 6 caracteres', 'Validación');
      return;
    }

    // Remove password from update if empty
    const updateData = { ...this.editUserForm };
    if (!updateData.password) {
      delete updateData.password;
    }

    this.usersService.updateUser(this.editingUser.id, updateData).subscribe({
      next: (user) => {
        this.toastr.success('Usuario actualizado exitosamente', 'Éxito');
        this.loadUsers();
        this.closeEditModal();
      },
      error: (error) => {
        console.error('Error updating user:', error);
        const message = error.error?.detail || 'No se pudo actualizar el usuario';
        this.toastr.error(message, 'Error al Actualizar');
      }
    });
  }

  // Delete user
  openDeleteModal(user: User) {
    this.userToDelete = user;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal() {
    this.isDeleteModalOpen = false;
    this.userToDelete = null;
  }

  handleDeleteUser() {
    if (!this.userToDelete) return;

    this.usersService.deleteUser(this.userToDelete.id).subscribe({
      next: () => {
        this.toastr.success('Usuario eliminado exitosamente', 'Éxito');
        this.loadUsers();
        this.closeDeleteModal();
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        const message = error.error?.detail || 'No se pudo eliminar el usuario';
        this.toastr.error(message, 'Error al Eliminar');
      }
    });
  }
}
