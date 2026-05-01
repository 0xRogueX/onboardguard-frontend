import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OfficerService, AlertDetail } from '../../services/officer.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-alert-board',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alert-board.component.html',
  styleUrl: './alert-board.component.css'
})
export class AlertBoardComponent implements OnInit {
  private officerService = inject(OfficerService);
  private authService = inject(AuthService);
  private router = inject(Router);

  isL1 = computed(() => this.authService.currentUser()?.role === 'L1_OFFICER');

  alerts = signal<AlertDetail[]>([]);
  isLoading = signal(true);
  isAcknowledging = signal<number | null>(null);
  errorMessage = signal('');
  successMessage = signal('');

  // Dismiss modal
  showDismissModal = signal(false);
  selectedAlertId = signal<number | null>(null);
  dismissReason = signal('');
  isProcessing = signal(false);

  ngOnInit() {
    if (!this.isL1()) {
      this.router.navigate(['/officer/escalated']);
      return;
    }
    this.loadAlerts();
  }

  loadAlerts() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.officerService.getAlerts().subscribe({
      next: (res) => {
        this.alerts.set(res.data ?? []);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Failed to load alerts.');
        this.isLoading.set(false);
      }
    });
  }

  acknowledgeAlert(alertId: number) {
    this.isAcknowledging.set(alertId);
    this.officerService.acknowledgeAlert(alertId).subscribe({
      next: (res) => {
        this.isAcknowledging.set(null);
        this.successMessage.set(`Alert #${alertId} claimed. You can now convert it to a case.`);
        this.loadAlerts();
        setTimeout(() => this.successMessage.set(''), 4000);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Failed to acknowledge alert.');
        this.isAcknowledging.set(null);
      }
    });
  }

  convertToCase(alertId: number) {
    this.isProcessing.set(true);
    this.officerService.convertAlertToCase(alertId).subscribe({
      next: (res) => {
        this.isProcessing.set(false);
        this.successMessage.set(`Alert converted to Case #${res.data}. View in Open Cases.`);
        this.loadAlerts();
        setTimeout(() => this.successMessage.set(''), 5000);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Failed to convert alert to case.');
        this.isProcessing.set(false);
      }
    });
  }

  openDismissModal(alertId: number) {
    this.selectedAlertId.set(alertId);
    this.dismissReason.set('');
    this.showDismissModal.set(true);
  }

  confirmDismiss() {
    const reason = this.dismissReason().trim();
    if (!reason) return;
    this.isProcessing.set(true);
    this.officerService.dismissAlert(this.selectedAlertId()!, reason).subscribe({
      next: () => {
        this.showDismissModal.set(false);
        this.isProcessing.set(false);
        this.successMessage.set('Alert dismissed as false positive.');
        this.loadAlerts();
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Failed to dismiss alert.');
        this.isProcessing.set(false);
      }
    });
  }

  getSeverityClass(severity: string): string {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'bg-red-50 text-red-600 border-red-200';
      case 'HIGH': return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'MEDIUM': return 'bg-amber-50 text-amber-600 border-amber-200';
      default: return 'bg-blue-50 text-blue-600 border-blue-200';
    }
  }

  getSeverityStrip(severity: string): string {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-amber-400';
      default: return 'bg-blue-400';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'ACKNOWLEDGED': return 'text-indigo-600 bg-indigo-50 border-indigo-100';
      case 'OPEN': return 'text-slate-600 bg-slate-50 border-slate-200';
      default: return 'text-slate-400 bg-slate-50 border-slate-100';
    }
  }
}
