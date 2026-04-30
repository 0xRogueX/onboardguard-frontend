import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CandidateService } from '../../services/candidate.service';
import { OnboardingStatus } from '../../models';

@Component({
  selector: 'app-application-tracking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './application-tracking.component.html',
  styleUrl: './application-tracking.component.css'
})
export class ApplicationTrackingComponent implements OnInit {
  private candidateService = inject(CandidateService);

  currentStatus = signal('');
  steps = signal([
    { title: 'Profile Started', description: 'Basic profile and contact details', icon: 'person', status: 'pending' },
    { title: 'Documents Uploaded', description: 'Identity and supporting documents', icon: 'fingerprint', status: 'pending' },
    { title: 'Submitted', description: 'Application submitted for verification', icon: 'upload_file', status: 'pending' },
    { title: 'Under Review', description: 'Officer and screening review', icon: 'work', status: 'pending' },
    { title: 'Decision', description: 'Final onboarding result', icon: 'search_check', status: 'pending' },
  ]);

  ngOnInit() {
    this.candidateService.getProfileStatus().subscribe({
      next: (response) => this.applyStatus(response.data.onboardingStatus, response.data.isSubmitted),
      error: () => this.currentStatus.set('Unable to load status')
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
        return 1;
      case OnboardingStatus.PROFESSIONAL_SAVED:
        return 2;
      case OnboardingStatus.DOCUMENTS_UPLOADED:
        return 3;
      case OnboardingStatus.DOCUMENTS_REJECTED:
        return 2;
      case OnboardingStatus.FORM_SUBMITTED:
      case OnboardingStatus.SCREENING_PENDING:
      case OnboardingStatus.SCREENING_IN_PROGRESS:
      case OnboardingStatus.DOCUMENTS_UNDER_REVIEW:
      case OnboardingStatus.CASE_IN_REVIEW:
      case OnboardingStatus.SCREENING_CLEARED:
      case OnboardingStatus.FLAGGED:
      case OnboardingStatus.REJECTED:
      case OnboardingStatus.APPROVED:
        return 4;
      default:
        return isSubmitted ? 4 : 0;
    }
  }

  private getIssueStep(status: OnboardingStatus): number | null {
    switch (status) {
      case OnboardingStatus.DOCUMENTS_REJECTED:
        return 2;
      case OnboardingStatus.FLAGGED:
      case OnboardingStatus.REJECTED:
        return 4;
      default:
        return null;
    }
  }

  private isFinalSuccess(status: OnboardingStatus) {
    return status === OnboardingStatus.APPROVED || status === OnboardingStatus.SCREENING_CLEARED;
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
