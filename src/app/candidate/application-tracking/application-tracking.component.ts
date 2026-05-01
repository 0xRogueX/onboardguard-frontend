import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CandidateService } from '../../services/candidate.service';
import { OnboardingStatus } from '../../models';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-application-tracking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './application-tracking.component.html',
  styleUrl: './application-tracking.component.css'
})
export class ApplicationTrackingComponent implements OnInit {
  private candidateService = inject(CandidateService);
  private destroyRef = inject(DestroyRef);
  private statusRequestId = 0;

  currentStatus = signal('');
  steps = signal([
    { title: 'Profile Started', description: 'Personal & professional details saved', icon: 'person', status: 'pending' },
    { title: 'Documents Uploaded', description: 'Identity and supporting documents uploaded', icon: 'upload_file', status: 'pending' },
    { title: 'Application Submitted', description: 'Form submitted and awaiting officer review', icon: 'send', status: 'pending' },
    { title: 'Documents Verified', description: 'Officer has verified all submitted documents', icon: 'verified', status: 'pending' },
    { title: 'Screening', description: 'Background and compliance screening in progress', icon: 'manage_search', status: 'pending' },
    { title: 'Final Decision', description: 'Final onboarding approval or rejection', icon: 'gavel', status: 'pending' },
  ]);

  ngOnInit() {
    this.candidateService.profileUpdated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadStatus());
    this.loadStatus();
  }

  private loadStatus() {
    const requestId = ++this.statusRequestId;
    this.candidateService.getProfileStatus().subscribe({
      next: (response) => {
        if (requestId !== this.statusRequestId) {
          return;
        }
        this.applyStatus(response.data.onboardingStatus, response.data.isSubmitted);
      },
      error: () => {
        if (requestId !== this.statusRequestId) {
          return;
        }
        this.currentStatus.set('Unable to load status');
      }
    });
  }

  private applyStatus(status: OnboardingStatus, isSubmitted: boolean) {
    this.currentStatus.set(this.formatStatus(status));
    const completedThrough = this.getCompletedStep(status, isSubmitted);
    const issueStep = this.getIssueStep(status);
    this.steps.update(steps => steps.map((step, index) => ({
      ...step,
      status: issueStep !== null && index === issueStep
        ? 'error'
        : this.isFinalSuccess(status)
          ? 'completed'
        : index < completedThrough
          ? 'completed'
          : index === completedThrough
            ? 'in-progress'
            : 'pending'
    })));
  }

  private getCompletedStep(status: OnboardingStatus, isSubmitted: boolean) {
    switch (status) {
      case OnboardingStatus.REGISTERED:
        return 0;
      case OnboardingStatus.PERSONAL_SAVED:
      case OnboardingStatus.PROFESSIONAL_SAVED:
        return 1;
      case OnboardingStatus.DOCUMENTS_UPLOADED:
        return 2;
      case OnboardingStatus.DOCUMENTS_REJECTED:
        return 2; // back to doc upload step (shown as error)
      case OnboardingStatus.FORM_SUBMITTED:
      case OnboardingStatus.DOCUMENTS_UNDER_REVIEW:
        return 3; // Submitted — officer is reviewing
      case OnboardingStatus.DOCUMENTS_VERIFIED:
        return 4; // ✅ All docs approved — show step 4 complete
      case OnboardingStatus.SCREENING_PENDING:
      case OnboardingStatus.SCREENING_IN_PROGRESS:
        return 4; // Screening running
      case OnboardingStatus.SCREENING_CLEARED:
      case OnboardingStatus.CASE_IN_REVIEW:
      case OnboardingStatus.FLAGGED:
        return 5; // Screening done, final decision pending
      case OnboardingStatus.REJECTED:
      case OnboardingStatus.APPROVED:
        return 6; // Final
      default:
        return isSubmitted ? 5 : 0;
    }
  }

  private getIssueStep(status: OnboardingStatus): number | null {
    switch (status) {
      case OnboardingStatus.DOCUMENTS_REJECTED:
        return 2;
      case OnboardingStatus.FLAGGED:
      case OnboardingStatus.REJECTED:
        return 5;
      default:
        return null;
    }
  }

  private isFinalSuccess(status: OnboardingStatus) {
    return status === OnboardingStatus.APPROVED;
  }

  private formatStatus(status: OnboardingStatus) {
    return status
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, ch => ch.toUpperCase());
  }

  getStatusBg(status: string): string {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-600';
      case 'in-progress': return 'bg-indigo-100 text-indigo-600';
      case 'error': return 'bg-rose-100 text-rose-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'completed': return 'text-emerald-700 bg-emerald-50 border border-emerald-200';
      case 'in-progress': return 'text-indigo-700 bg-indigo-50 border border-indigo-200';
      case 'error': return 'text-rose-700 bg-rose-50 border border-rose-200';
      default: return 'text-slate-600 bg-slate-50 border border-slate-200';
    }
  }
}
