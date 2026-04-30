import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { DashboardStatsDto } from '../../models';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-approval-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './approval-dashboard.component.html',
  styleUrl: './approval-dashboard.component.css'
})
export class ApprovalDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);

  approvals = signal<any[]>([]);
  stats = signal<DashboardStatsDto | null>(null);
  isLoading = signal(true);
  displayName = computed(() => this.authService.currentUser()?.fullName || 'Admin');

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.isLoading.set(true);
    this.adminService.getDashboardStats().subscribe({
      next: (response) => this.stats.set(response.data),
      error: () => this.stats.set(null)
    });

    this.adminService.getPendingApprovals().subscribe({
      next: (response) => {
        this.approvals.set(response.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.approvals.set([]);
        this.isLoading.set(false);
      }
    });
  }

  reviewApproval(id: number, decision: 'APPROVE' | 'REJECT') {
    this.adminService.reviewApproval(String(id), decision).subscribe({
      next: () => this.loadDashboard()
    });
  }

  getTitle(approval: any) {
    return `${approval.actionType || 'REQUEST'} ${approval.targetEntityType || 'CHANGE'}`;
  }

  getPayloadSummary(approval: any) {
    return Object.keys(approval.payload || {}).join(', ') || `Target #${approval.targetEntityId || approval.id}`;
  }
}
