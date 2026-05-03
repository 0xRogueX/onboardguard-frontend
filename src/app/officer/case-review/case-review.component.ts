import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OfficerService, CaseDetail } from '../../services/officer.service';
import { ScreeningResultModalComponent } from '../screening-result-modal/screening-result-modal.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-case-review',
  standalone: true,
  imports: [CommonModule, FormsModule, ScreeningResultModalComponent],
  templateUrl: './case-review.component.html',
  styleUrl: './case-review.component.css'
})
export class CaseReviewComponent implements OnInit {
  private officerService = inject(OfficerService);
  private authService = inject(AuthService);
  private router = inject(Router);

  isL1 = computed(() => this.authService.currentUser()?.role === 'L1_OFFICER');

  cases = signal<CaseDetail[]>([]);
  isLoading = signal(true);
  isClaiming = signal<number | null>(null);
  errorMessage = signal('');
  successMessage = signal('');

  // Escalate modal
  showEscalateModal = signal(false);
  selectedCaseId = signal<number | null>(null);
  escalationReason = '';
  isProcessing = signal(false);

  // Screening modal
  showScreeningModal = signal(false);
  screeningCandidateId = signal<number | null>(null);

  // Note modal
  showNoteModal = signal(false);
  noteContent = '';

  ngOnInit() {
    if (!this.isL1()) {
      this.router.navigate(['/officer/escalated']);
      return;
    }
    this.loadCases();
  }

  loadCases() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.officerService.getAvailableCases().subscribe({
      next: (res) => {
        this.cases.set(res.data ?? []);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Failed to load cases.');
        this.isLoading.set(false);
      }
    });
  }

  claimCase(caseId: number) {
    this.isClaiming.set(caseId);
    this.officerService.claimOpenCase(caseId).subscribe({
      next: () => {
        this.successMessage.set(`Case #${caseId} claimed. You can now investigate.`);
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

  openEscalateModal(caseId: number) {
    this.selectedCaseId.set(caseId);
    this.escalationReason = '';
    this.showEscalateModal.set(true);
  }

  confirmEscalate() {
    const reason = this.escalationReason.trim();
    if (reason.length < 10) return;
    this.isProcessing.set(true);
    this.officerService.escalateCase(this.selectedCaseId()!, null, reason).subscribe({
      next: () => {
        this.showEscalateModal.set(false);
        this.isProcessing.set(false);
        this.successMessage.set('Case escalated to L2 Checker successfully.');
        this.loadCases();
        setTimeout(() => this.successMessage.set(''), 4000);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Failed to escalate case.');
        this.isProcessing.set(false);
      }
    });
  }

  openNoteModal(caseId: number) {
    this.selectedCaseId.set(caseId);
    this.noteContent = '';
    this.showNoteModal.set(true);
  }

  openScreeningModal(candidateId: number) {
    this.screeningCandidateId.set(candidateId);
    this.showScreeningModal.set(true);
  }

  confirmAddNote() {
    const note = this.noteContent.trim();
    if (!note) return;
    this.isProcessing.set(true);
    this.officerService.addCaseNote(this.selectedCaseId()!, note).subscribe({
      next: () => {
        this.showNoteModal.set(false);
        this.isProcessing.set(false);
        this.successMessage.set('Investigation note added.');
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Failed to add note.');
        this.isProcessing.set(false);
      }
    });
  }

  getPriorityLabel(c: CaseDetail): string {
    if (c.isSlaBreached) return 'SLA BREACHED';
    if (c.status === 'IN_REVIEW') return 'IN REVIEW';
    return 'OPEN';
  }

  getPriorityClass(c: CaseDetail): string {
    if (c.isSlaBreached) return 'bg-red-50 text-red-600 border-red-100';
    if (c.status === 'IN_REVIEW') return 'bg-amber-50 text-amber-600 border-amber-100';
    return 'bg-indigo-50 text-indigo-600 border-indigo-100';
  }

  canEscalate(c: CaseDetail): boolean {
    return c.status === 'IN_REVIEW';
  }

  canClaim(c: CaseDetail): boolean {
    return c.status === 'OPEN';
  }
}
