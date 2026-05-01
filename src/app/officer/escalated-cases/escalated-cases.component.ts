import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OfficerService, CaseDetail } from '../../services/officer.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-escalated-cases',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './escalated-cases.component.html',
  styleUrl: './escalated-cases.component.css'
})
export class EscalatedCasesComponent implements OnInit {
  private officerService = inject(OfficerService);
  private authService = inject(AuthService);
  private router = inject(Router);

  isL2 = computed(() => this.authService.currentUser()?.role === 'L2_OFFICER');

  escalatedCases = signal<CaseDetail[]>([]);
  isLoading = signal(true);
  isClaiming = signal<number | null>(null);
  errorMessage = signal('');
  successMessage = signal('');

  // Resolve modal
  showResolveModal = signal(false);
  selectedCaseId = signal<number | null>(null);
  resolveOutcome = signal<'CLEARED' | 'REJECTED' | ''>('');
  outcomeReason = signal('');
  isProcessing = signal(false);

  // Note modal
  showNoteModal = signal(false);
  noteContent = signal('');

  ngOnInit() {
    if (!this.isL2()) {
      // L1 officers shouldn't access this
      this.router.navigate(['/officer/alerts']);
      return;
    }
    this.loadCases();
  }

  loadCases() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.officerService.getEscalatedCases().subscribe({
      next: (res) => {
        this.escalatedCases.set(res.data ?? []);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Failed to load escalated cases.');
        this.isLoading.set(false);
      }
    });
  }

  claimCase(caseId: number) {
    this.isClaiming.set(caseId);
    this.officerService.claimEscalatedCase(caseId).subscribe({
      next: () => {
        this.successMessage.set(`Case #${caseId} claimed. Conduct your review.`);
        this.isClaiming.set(null);
        this.loadCases();
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Failed to claim case.');
        this.isClaiming.set(null);
      }
    });
  }

  openResolveModal(caseId: number, outcome: 'CLEARED' | 'REJECTED') {
    this.selectedCaseId.set(caseId);
    this.resolveOutcome.set(outcome);
    this.outcomeReason.set('');
    this.showResolveModal.set(true);
  }

  confirmResolve() {
    const reason = this.outcomeReason().trim();
    if (reason.length < 10 || !this.resolveOutcome()) return;
    this.isProcessing.set(true);
    this.officerService.resolveCase(
      this.selectedCaseId()!,
      this.resolveOutcome() as 'CLEARED' | 'REJECTED',
      reason
    ).subscribe({
      next: () => {
        this.showResolveModal.set(false);
        this.isProcessing.set(false);
        const action = this.resolveOutcome() === 'CLEARED' ? 'approved — candidate can onboard!' : 'rejected — candidate will be notified.';
        this.successMessage.set(`Case #${this.selectedCaseId()} ${action}`);
        this.loadCases();
        setTimeout(() => this.successMessage.set(''), 5000);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Failed to resolve case.');
        this.isProcessing.set(false);
      }
    });
  }

  openNoteModal(caseId: number) {
    this.selectedCaseId.set(caseId);
    this.noteContent.set('');
    this.showNoteModal.set(true);
  }

  confirmAddNote() {
    const note = this.noteContent().trim();
    if (!note) return;
    this.isProcessing.set(true);
    this.officerService.addCaseNote(this.selectedCaseId()!, note).subscribe({
      next: () => {
        this.showNoteModal.set(false);
        this.isProcessing.set(false);
        this.successMessage.set('Note added to case.');
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Failed to add note.');
        this.isProcessing.set(false);
      }
    });
  }

  canClaim(c: CaseDetail): boolean {
    return c.status === 'ESCALATED';
  }

  canResolve(c: CaseDetail): boolean {
    return c.status === 'IN_REVIEW' || c.status === 'ESCALATED';
  }

  getRiskLevel(c: CaseDetail): string {
    if (c.isSlaBreached) return 'CRITICAL';
    if (c.status === 'ESCALATED') return 'HIGH';
    return 'MEDIUM';
  }

  getRiskClass(c: CaseDetail): string {
    const level = this.getRiskLevel(c);
    if (level === 'CRITICAL') return 'text-red-600 bg-red-50 border-red-200';
    if (level === 'HIGH') return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-amber-600 bg-amber-50 border-amber-200';
  }

  getRiskStrip(c: CaseDetail): string {
    const level = this.getRiskLevel(c);
    if (level === 'CRITICAL') return 'bg-red-500';
    if (level === 'HIGH') return 'bg-orange-500';
    return 'bg-amber-400';
  }

  getRiskScore(c: CaseDetail): number {
    if (c.isSlaBreached) return 95;
    if (c.status === 'ESCALATED') return 78;
    return 60;
  }
}
