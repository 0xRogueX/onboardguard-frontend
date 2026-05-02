import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService, CreateOfficerRequest } from '../../services/admin.service';
import { UserProfile } from '../../models';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class UserManagementComponent implements OnInit {
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);

  users = signal<UserProfile[]>([]);
  totalUsers = signal(0);
  totalPages = signal(0);
  isLoading = signal(true);
  errorMessage = signal('');
  successMessage = signal('');
  actionBusyId = signal<number | null>(null);
  showAddOfficer = signal(false);

  activeOfficers = computed(() => this.users().filter(user => user.isActive && ['ROLE_OFFICER_L1', 'ROLE_OFFICER_L2', 'L1_OFFICER', 'L2_OFFICER'].includes(user.role)).length);

  officerForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    role: ['ROLE_OFFICER_L1' as 'ROLE_OFFICER_L1' | 'ROLE_OFFICER_L2', Validators.required]
  });

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminService.getUsers().subscribe({
      next: (response) => {
        // Robust mapping: handle both 'isActive' and 'active' from backend, defaulting to true
        const normalized = response.data.content.map(u => ({
          ...u,
          isActive: u.isActive ?? (u as any).active ?? true
        }));
        this.users.set(normalized);
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

  submitOfficer() {
    if (this.officerForm.invalid) {
      this.officerForm.markAllAsTouched();
      this.errorMessage.set('Please complete the officer form.');
      return;
    }

    const payload: CreateOfficerRequest = {
      fullName: this.officerForm.value.fullName!.trim(),
      email: this.officerForm.value.email!.trim(),
      phone: this.officerForm.value.phone?.trim() || null,
      role: this.officerForm.value.role as 'ROLE_OFFICER_L1' | 'ROLE_OFFICER_L2'
    };

    this.actionBusyId.set(-1);
    this.adminService.addOfficer(payload).subscribe({
      next: (response) => {
        this.successMessage.set(response.message || 'Officer created successfully.');
        this.errorMessage.set('');
        this.actionBusyId.set(null);
        this.officerForm.reset({ role: 'ROLE_OFFICER_L1' });
        this.showAddOfficer.set(false);
        this.loadUsers();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Unable to create officer.');
        this.actionBusyId.set(null);
      }
    });
  }

  toggleStatus(user: UserProfile) {
    const newStatus = !user.isActive;
    this.actionBusyId.set(user.id);
    this.adminService.toggleUserStatus(user.id, newStatus).subscribe({
      next: () => {
        this.actionBusyId.set(null);
        // Force state update to bypass backend Hibernate cache issue
        this.users.update(users => users.map(u => u.id === user.id ? { ...u, isActive: newStatus } : u));
        this.successMessage.set(`User successfully ${newStatus ? 'activated' : 'deactivated'}.`);
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (err) => {
        this.actionBusyId.set(null);
        this.errorMessage.set(err.error?.message || 'Unable to update user status.');
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
    return user.isActive ? 'Active' : 'Deactivated';
  }

  isSuperAdmin(user: UserProfile) {
    return user.role === 'ROLE_SUPER_ADMIN' || user.role === 'SUPER_ADMIN';
  }

  getClearance(user: UserProfile) {
    return user.isActive && !user.locked ? 100 : user.locked ? 0 : 50;
  }

  getStatusClass(status: string) {
    switch (status) {
      case 'Active': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Pending': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Suspended': return 'bg-rose-50 text-rose-700 border border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  }
}
