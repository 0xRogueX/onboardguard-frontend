import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { UserProfile } from '../../models';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class UserManagementComponent implements OnInit {
  private adminService = inject(AdminService);

  users = signal<UserProfile[]>([]);
  totalUsers = signal(0);
  totalPages = signal(0);
  isLoading = signal(true);
  errorMessage = signal('');
  activeOfficers = computed(() => this.users().filter(user => user.isActive && ['ROLE_OFFICER_L1', 'ROLE_OFFICER_L2', 'L1_OFFICER', 'L2_OFFICER'].includes(user.role)).length);

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminService.getUsers().subscribe({
      next: (response) => {
        this.users.set(response.data.content);
        this.totalUsers.set(response.data.totalElements);
        this.totalPages.set(response.data.totalPages);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Unable to load users from backend.');
        this.isLoading.set(false);
      }
    });
  }

  getDisplayName(user: UserProfile) {
    return user.fullName || user.email;
  }

  getRoleLabel(role: string) {
    switch (role) {
      case 'ROLE_OFFICER_L1':
      case 'L1_OFFICER':
        return 'L1 Officer';
      case 'ROLE_OFFICER_L2':
      case 'L2_OFFICER':
        return 'L2 Officer';
      case 'ROLE_SUPER_ADMIN':
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'ROLE_ADMIN':
      case 'ADMIN':
        return 'Admin';
      case 'ROLE_CANDIDATE':
      case 'CANDIDATE':
        return 'Candidate';
      default:
        return role.replace(/_/g, ' ');
    }
  }

  getUserStatus(user: UserProfile) {
    if (user.locked) return 'Suspended';
    return user.isActive ? 'Active' : 'Pending';
  }

  getClearance(user: UserProfile) {
    return user.isActive && !user.locked ? 100 : user.locked ? 0 : 50;
  }

  getStatusClass(status: string) {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700 border border-green-200 shadow-sm';
      case 'Pending': return 'bg-yellow-100 text-yellow-700 border border-yellow-200 shadow-sm';
      case 'Suspended': return 'bg-red-100 text-red-700 border border-red-200 shadow-sm';
      default: return 'bg-gray-100 text-gray-700 border border-gray-200 shadow-sm';
    }
  }
}
