import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OfficerService, CandidateQueueItem } from '../../services/officer.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-alert-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert-dashboard.component.html',
  styleUrl: './alert-dashboard.component.css'
})
export class AlertDashboardComponent implements OnInit {
  private officerService = inject(OfficerService);
  private authService = inject(AuthService);
  private router = inject(Router);

  isL1 = computed(() => this.authService.currentUser()?.role === 'L1_OFFICER');

  pendingCandidates = signal<CandidateQueueItem[]>([]);
  isLoading = signal(true);
  isClaiming = signal<number | null>(null);
  errorMessage = signal('');
  successMessage = signal('');

  ngOnInit() {
    if (!this.isL1()) {
      this.router.navigate(['/officer/escalated']);
      return;
    }
    this.loadQueue();
  }

  loadQueue() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.officerService.getPendingCandidates().subscribe({
      next: (res) => {
        this.pendingCandidates.set(res.data ?? []);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Failed to load verification queue.');
        this.isLoading.set(false);
      }
    });
  }

  claimApplication(candidateId: number) {
    this.isClaiming.set(candidateId);
    this.errorMessage.set('');
    this.officerService.claimCandidate(candidateId).subscribe({
      next: () => {
        this.router.navigate(['/officer/investigation', candidateId]);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Failed to claim — it may be locked by another officer.');
        this.isClaiming.set(null);
        this.loadQueue();
      }
    });
  }

  claimNext() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.officerService.claimNextCandidate().subscribe({
      next: (res) => {
        this.router.navigate(['/officer/investigation', res.data.candidateId]);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Queue is empty or no candidates available.');
        this.isLoading.set(false);
      }
    });
  }

  getInitials(c: CandidateQueueItem): string {
    return `${c.firstName?.[0] ?? ''}${c.lastName?.[0] ?? ''}`.toUpperCase();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'FORM_SUBMITTED': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'DOCUMENTS_UPLOADED': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'DOCUMENTS_UNDER_REVIEW': return 'bg-yellow-50 text-yellow-600 border-yellow-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  }

  formatStatus(status: string): string {
    return status?.replace(/_/g, ' ') ?? '';
  }
}
