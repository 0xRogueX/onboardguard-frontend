import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  logout() {
    this.authService.logout();
    this.router.navigate(['/staff/login']);
  }

  currentUser = computed(() => this.authService.currentUser());
  displayName = computed(() => this.currentUser()?.fullName || 'Admin');
  roleLabel = computed(() => this.formatRole(this.currentUser()?.role || 'ADMIN'));
  canManageConfigs = computed(() => ['ADMIN', 'SUPER_ADMIN'].includes(this.currentUser()?.role || ''));
  canReviewApprovals = computed(() => (this.currentUser()?.role || '') === 'SUPER_ADMIN');
  canManageUsers = computed(() => ['ADMIN', 'SUPER_ADMIN'].includes(this.currentUser()?.role || ''));
  roleSummary = computed(() => this.canReviewApprovals() ? 'Checker' : 'Maker');
  canViewAudit = computed(() => ['ADMIN', 'SUPER_ADMIN'].includes(this.currentUser()?.role || ''));

  private formatRole(role: string): string {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'ADMIN':
        return 'Admin';
      default:
        return role.replace(/_/g, ' ');
    }
  }
}
