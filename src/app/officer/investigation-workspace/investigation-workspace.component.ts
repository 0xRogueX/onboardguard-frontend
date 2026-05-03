import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OfficerService, DocumentVerificationDashboard, ScreeningResult } from '../../services/officer.service';
import { AuthService } from '../../services/auth.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-investigation-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './investigation-workspace.component.html',
  styleUrl: './investigation-workspace.component.css'
})
export class InvestigationWorkspaceComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private officerService = inject(OfficerService);
  private authService = inject(AuthService);

  isL1 = computed(() => this.authService.currentUser()?.role === 'L1_OFFICER');
  backLink = computed(() => this.isL1() ? '/officer/alerts' : '/officer/escalated');
  backLabel = computed(() => this.isL1() ? 'Queue' : 'Escalated');

  candidate = signal<DocumentVerificationDashboard | null>(null);
  screeningResult = signal<ScreeningResult | null>(null);
  isLoading = signal(true);
  errorMessage = signal('');
  successMessage = signal('');

  // Rejection modal
  showRejectModal = signal(false);
  selectedDocId = signal<number | null>(null);
  rejectionReason = signal('');
  isProcessing = signal(false);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCandidateDetails(+id);
    } else {
      this.router.navigate([this.backLink()]);
    }
  }

  loadCandidateDetails(id: number) {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.officerService.getCandidateDetails(id).subscribe({
      next: (res) => {
        this.candidate.set(res.data);
        
        // Screening only relevant for Acknowledged Alerts, Cases, or Post-Verification stages
        const status = res.data.status;
        const skipScreening = ['DOCUMENTS_UPLOADED', 'DOCUMENTS_UNDER_REVIEW', 'DOCUMENTS_REJECTED'].includes(status);
        
        if (!skipScreening || !this.isL1()) {
          this.fetchScreeningResult(id);
        } else {
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Failed to load investigation data.');
        this.isLoading.set(false);
      }
    });
  }

  private fetchScreeningResult(id: number) {
    this.officerService.getLatestScreeningResult(id).subscribe({
      next: (res) => {
        this.screeningResult.set(res.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.screeningResult.set(null);
        this.isLoading.set(false);
      }
    });
  }

  approveDoc(docId: number) {
    if (this.isProcessing()) return;
    this.isProcessing.set(true);
    this.errorMessage.set('');
    this.officerService.approveDocument(docId).subscribe({
      next: () => {
        this.updateDocStatus(docId, 'APPROVED');
        this.successMessage.set('Document approved successfully.');
        this.isProcessing.set(false);
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Failed to approve document.');
        this.isProcessing.set(false);
      }
    });
  }

  openRejectModal(docId: number) {
    this.selectedDocId.set(docId);
    this.rejectionReason.set('');
    this.showRejectModal.set(true);
  }

  confirmReject() {
    const reason = this.rejectionReason().trim();
    if (!reason) return;
    this.isProcessing.set(true);
    this.officerService.rejectDocument(this.selectedDocId()!, reason).subscribe({
      next: () => {
        this.updateDocStatus(this.selectedDocId()!, 'REJECTED');
        this.showRejectModal.set(false);
        this.isProcessing.set(false);
        this.successMessage.set('Document rejected. Candidate will be notified to re-upload.');
        setTimeout(() => this.successMessage.set(''), 4000);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Failed to reject document.');
        this.isProcessing.set(false);
      }
    });
  }

  closeModal() {
    this.showRejectModal.set(false);
    this.rejectionReason.set('');
  }

  private updateDocStatus(docId: number, status: string) {
    const current = this.candidate();
    if (!current) return;
    const updatedDocs = current.documents.map(d =>
      d.id === docId ? { ...d, status } : d
    );
    this.candidate.set({ ...current, documents: updatedDocs });
  }

  getDocStatusClass(status: string): string {
    switch (status) {
      case 'APPROVED': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'REJECTED': return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-amber-600 bg-amber-50 border-amber-100';
    }
  }

  formatDocType(type: string): string {
    return type?.replace(/_/g, ' ') ?? '';
  }

  pendingDocsCount(): number {
    return this.candidate()?.documents?.filter(d => d.status === 'PENDING').length ?? 0;
  }

  approvedDocsCount(): number {
    return this.candidate()?.documents?.filter(d => d.status === 'APPROVED').length ?? 0;
  }

  getRiskBadgeClass(level: string): string {
    switch (level?.toUpperCase()) {
      case 'CRITICAL': return 'bg-red-600 text-white shadow-red-200';
      case 'HIGH': return 'bg-rose-500 text-white shadow-rose-200';
      case 'MEDIUM': return 'bg-amber-500 text-white shadow-amber-200';
      case 'LOW': return 'bg-emerald-500 text-white shadow-emerald-200';
      default: return 'bg-slate-400 text-white';
    }
  }

  getMatchScoreColor(score: number): string {
    if (score >= 80) return 'text-rose-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-emerald-600';
  }
}
