import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-emergency-control',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './emergency-control.component.html',
  styleUrl: './emergency-control.component.css'
})
export class EmergencyControlComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);

  activeCandidates = signal(0);
  displayName = computed(() => this.authService.currentUser()?.fullName || 'Admin');
  roleLabel = computed(() => this.formatRole(this.authService.currentUser()?.role || 'ADMIN'));

  ngOnInit() {
    this.adminService.getDashboardStats().subscribe({
      next: (response) => this.activeCandidates.set(response.data.candidateStats.totalOnboarded),
      error: () => this.activeCandidates.set(0)
    });
  }

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
