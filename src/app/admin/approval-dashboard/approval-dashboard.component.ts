import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, PendingApprovalDto } from '../../services/admin.service';
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

  approvals = signal<PendingApprovalDto[]>([]);
  stats = signal<DashboardStatsDto | null>(null);
  isLoading = signal(true);
  actionBusyId = signal<number | null>(null);
  errorMessage = signal('');
  displayName = computed(() => this.authService.currentUser()?.fullName || 'Admin');
  isChecker = computed(() => (this.authService.currentUser()?.role || '') === 'SUPER_ADMIN');

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.adminService.getDashboardStats().subscribe({
      next: (response) => this.stats.set(response.data),
      error: () => this.stats.set(null)
    });

    this.adminService.getPendingApprovals().subscribe({
      next: (response) => {
        this.approvals.set(response.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.approvals.set([]);
        this.errorMessage.set(err?.error?.message || 'Unable to load approvals.');
        this.isLoading.set(false);
      }
    });
  }

  reviewApproval(id: number, decision: 'APPROVED' | 'REJECTED') {
    this.actionBusyId.set(id);
    const review = {
      status: decision,
      rejectionReason: decision === 'REJECTED' ? 'Rejected by checker review.' : null,
      isBypass: false
    };

    this.adminService.reviewApproval(id, review).subscribe({
      next: () => {
        this.actionBusyId.set(null);
        this.loadDashboard();
      },
      error: (err) => {
        this.actionBusyId.set(null);
        this.errorMessage.set(err?.error?.message || 'Unable to process approval.');
      }
    });
  }

  getTitle(approval: PendingApprovalDto) {
    return `${approval.actionType || 'REQUEST'} ${approval.targetEntityType || 'CHANGE'}`;
  }

  getPayloadSummary(approval: PendingApprovalDto) {
    const payload = approval.payload || {};
    return Object.entries(payload).map(([key, value]) => `${key}: ${String(value)}`).slice(0, 3).join(' • ') || `Target #${approval.targetEntityId || approval.id}`;
  }

  getStatusTone(status: string) {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'REJECTED': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  }
}
