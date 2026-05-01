import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { DashboardStatsDto } from '../../models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  private adminService = inject(AdminService);

  stats = signal<DashboardStatsDto | null>(null);
  isLoading = signal(true);
  errorMessage = signal('');

  candidateBars = computed(() => {
    const s = this.stats()?.candidateStats;
    if (!s) return [];
    return [
      { label: 'Onboarded', value: s.totalOnboarded },
      { label: 'Pending Screening', value: s.pendingScreening },
      { label: 'Cleared', value: s.cleared },
      { label: 'Flagged', value: s.flagged }
    ];
  });

  alertBars = computed(() => {
    const s = this.stats()?.alertStats;
    if (!s) return [];
    return [
      { label: 'Generated', value: s.totalGenerated },
      { label: 'Open', value: s.openAlerts },
      { label: 'Dismissed', value: s.dismissedFalsePositives },
      { label: 'Escalated', value: s.escalatedToCases }
    ];
  });

  ngOnInit() {
    this.load();
  }

  load() {
    this.isLoading.set(true);
    this.adminService.getDashboardStats().subscribe({
      next: (response) => {
        this.stats.set(response.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Unable to load reporting dashboard.');
        this.isLoading.set(false);
      }
    });
  }

  maxValue(items: Array<{ value: number }>) {
    return Math.max(...items.map(item => item.value), 1);
  }
}
