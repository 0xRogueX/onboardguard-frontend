import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OfficerService, CandidateQueueItem } from '../../services/officer.service';

@Component({
  selector: 'app-alert-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert-dashboard.component.html',
  styleUrl: './alert-dashboard.component.css'
})
export class AlertDashboardComponent implements OnInit {
  private officerService = inject(OfficerService);
  private router = inject(Router);

  pendingCandidates = signal<CandidateQueueItem[]>([]);
  isLoading = signal(true);
  isClaiming = signal<number | null>(null);

  ngOnInit() {
    this.loadQueue();
  }

  loadQueue() {
    this.isLoading.set(true);
    this.officerService.getPendingCandidates().subscribe({
      next: (res) => {
        this.pendingCandidates.set(res.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load queue', err);
        this.isLoading.set(false);
      }
    });
  }

  claimApplication(candidateId: number) {
    this.isClaiming.set(candidateId);
    this.officerService.claimCandidate(candidateId).subscribe({
      next: () => {
        this.router.navigate(['/officer/investigation', candidateId]);
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to claim application. It might be locked by another officer.');
        this.isClaiming.set(null);
        this.loadQueue(); // Refresh list
      }
    });
  }
}
