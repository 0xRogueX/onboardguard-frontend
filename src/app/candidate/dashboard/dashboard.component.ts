import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CandidateService } from '../../services/candidate.service';
import { CandidateStatusDto, DocumentDto, OnboardingStatus } from '../../models';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface Step {
  title: string;
  description: string;
  icon: string;
  status: 'completed' | 'in-progress' | 'error' | 'pending';
}

interface Update {
  title: string;
  time: string;
}

interface StepBlueprint {
  title: string;
  description: string;
  icon: string;
}

const DASHBOARD_STEPS: StepBlueprint[] = [
  {
    title: 'Personal Details',
    description: 'Basic profile and contact details',
    icon: 'person'
  },
  {
    title: 'Documents Uploaded',
    description: 'Identity and supporting documents',
    icon: 'upload_file'
  },
  {
    title: 'Submitted for Review',
    description: 'Application submitted — in officer queue',
    icon: 'send'
  },
  {
    title: 'Documents Verified',
    description: 'Officer completed document verification',
    icon: 'verified'
  },
  {
    title: 'Screening',
    description: 'Background and compliance screening',
    icon: 'manage_search'
  },
  {
    title: 'Final Decision',
    description: 'Approved or action required',
    icon: 'gavel'
  }
];


@Component({
  selector: 'app-candidate-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class CandidateDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private candidateService = inject(CandidateService);
  private destroyRef = inject(DestroyRef);
  private dashboardRequestId = 0;

  profileStatus = signal<CandidateStatusDto | null>(null);
  rejectedDocuments = signal<DocumentDto[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');

  candidateName = computed(() => this.authService.currentUser()?.fullName || 'Candidate');
  candidateInitials = computed(() => this.getInitials(this.candidateName()));
  statusLabel = computed(() => this.getStatusLabel(this.profileStatus()?.onboardingStatus));
  progressLabel = computed(() => `${this.getProgressPercent()}% Complete`);
  steps = computed<Step[]>(() => this.buildSteps(this.profileStatus()?.onboardingStatus || null));
  updates = computed<Update[]>(() => this.buildUpdates());

  ngOnInit() {
    this.candidateService.profileUpdated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadDashboardData());
    this.loadDashboardData();
  }

  loadDashboardData() {
    const requestId = ++this.dashboardRequestId;
    this.isLoading.set(true);
    this.errorMessage.set('');

    let remainingRequests = 2;
    const complete = () => {
      if (requestId !== this.dashboardRequestId) {
        return;
      }
      remainingRequests -= 1;
      if (remainingRequests <= 0) {
        this.isLoading.set(false);
      }
    };

    this.candidateService.getProfileStatus().subscribe({
      next: (response) => {
        if (requestId !== this.dashboardRequestId) {
          return;
        }
        this.profileStatus.set(response.data);
        complete();
      },
      error: (err) => {
        if (requestId !== this.dashboardRequestId) {
          return;
        }
        this.errorMessage.set(err.error?.message || 'Unable to load your onboarding status.');
        complete();
      }
    });

    this.candidateService.getRejectedDocuments().subscribe({
      next: (response) => {
        if (requestId !== this.dashboardRequestId) {
          return;
        }
        this.rejectedDocuments.set(response.data);
        complete();
      },
      error: () => {
        if (requestId !== this.dashboardRequestId) {
          return;
        }
        complete();
      }
    });
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

  private buildSteps(status: OnboardingStatus | null): Step[] {
    const stageIndex = this.getStageIndex(status);
    const issueStepIndex = this.getIssueStepIndex(status);
    const finalSuccess = this.isFinalSuccess(status);

    return DASHBOARD_STEPS.map((step, index) => {
      let stepStatus: Step['status'] = 'pending';

      if (issueStepIndex !== null && index === issueStepIndex) {
        stepStatus = 'error';
      } else if (finalSuccess) {
        stepStatus = 'completed';
      } else if (index < stageIndex) {
        stepStatus = 'completed';
      } else if (index === stageIndex) {
        // Only show 'in-progress' if we've actually started (moved past REGISTERED)
        // or if it's a later stage.
        if (status === OnboardingStatus.REGISTERED && index === 0) {
          stepStatus = 'pending';
        } else {
          stepStatus = 'in-progress';
        }
      }

      return {
        ...step,
        status: stepStatus
      };
    });
  }

  private buildUpdates(): Update[] {
    const documents = [...this.rejectedDocuments()].sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    if (documents.length > 0) {
      return documents.slice(0, 4).map(doc => ({
        title: `${this.formatDocumentName(doc.candidateDocumentType)} review required${doc.rejectionReason ? `: ${doc.rejectionReason}` : ''}`,
        time: this.formatDateTime(doc.uploadedAt)
      }));
    }

    const status = this.profileStatus()?.onboardingStatus;
    if (!status) {
      return [
        { title: 'Loading latest status from backend', time: 'Live data' }
      ];
    }

    return [
      { title: `Current onboarding status: ${this.getStatusLabel(status)}`, time: 'Live data' },
      { title: this.getTimelineMessage(status), time: 'Updated by backend' }
    ];
  }

  private getProgressPercent(): number {
    const status = this.profileStatus()?.onboardingStatus;
    if (!status) {
      return 0;
    }

    if (this.isFinalSuccess(status)) {
      return 100;
    }

    if (status === OnboardingStatus.DOCUMENTS_REJECTED) {
      return 60;
    }

    const stageIndex = this.getStageIndex(status);
    return Math.min(100, Math.round(((stageIndex + 1) / DASHBOARD_STEPS.length) * 100));
  }

  private getStageIndex(status: OnboardingStatus | null | undefined): number {
    switch (status) {
      case OnboardingStatus.REGISTERED:
        return 0;
      case OnboardingStatus.PERSONAL_SAVED:
      case OnboardingStatus.PROFESSIONAL_SAVED:
        return 1;
      case OnboardingStatus.DOCUMENTS_UPLOADED:
      case OnboardingStatus.DOCUMENTS_REJECTED:
        return 2;
      case OnboardingStatus.FORM_SUBMITTED:
      case OnboardingStatus.DOCUMENTS_UNDER_REVIEW:
        return 3; // Under officer review
      case OnboardingStatus.DOCUMENTS_VERIFIED:
      case OnboardingStatus.SCREENING_PENDING:
      case OnboardingStatus.SCREENING_IN_PROGRESS:
        return 4; // Screening stage
      case OnboardingStatus.SCREENING_CLEARED:
      case OnboardingStatus.CASE_IN_REVIEW:
      case OnboardingStatus.FLAGGED:
      case OnboardingStatus.REJECTED:
      case OnboardingStatus.APPROVED:
        return 5; // Final decision
      default:
        return 0;
    }
  }

  private getIssueStepIndex(status: OnboardingStatus | null | undefined): number | null {
    switch (status) {
      case OnboardingStatus.DOCUMENTS_REJECTED:
        return 2;
      case OnboardingStatus.FLAGGED:
      case OnboardingStatus.REJECTED:
        return 4; // step 4 = Screening
      default:
        return null;
    }
  }

  private isFinalSuccess(status: OnboardingStatus | null | undefined): boolean {
    return status === OnboardingStatus.APPROVED;
  }

  private isFinalIssue(status: OnboardingStatus | null | undefined): boolean {
    return status === OnboardingStatus.FLAGGED
      || status === OnboardingStatus.DOCUMENTS_REJECTED
      || status === OnboardingStatus.REJECTED;
  }

  private getStatusLabel(status: OnboardingStatus | null | undefined): string {
    if (!status) {
      return 'Loading';
    }

    if (this.isFinalSuccess(status)) {
      return 'Approved';
    }

    if (this.isFinalIssue(status)) {
      return 'Action Required';
    }

    if (status === OnboardingStatus.REGISTERED) {
      return 'Pending';
    }

    if (status === OnboardingStatus.PERSONAL_SAVED || status === OnboardingStatus.PROFESSIONAL_SAVED) {
      return 'In Progress';
    }

    return this.formatStatus(status);
  }

  private getTimelineMessage(status: OnboardingStatus): string {
    switch (status) {
      case OnboardingStatus.REGISTERED:
        return 'Your profile has been created and is ready for details.';
      case OnboardingStatus.PERSONAL_SAVED:
        return 'Personal details were saved successfully.';
      case OnboardingStatus.PROFESSIONAL_SAVED:
        return 'Professional details were saved successfully.';
      case OnboardingStatus.DOCUMENTS_UPLOADED:
        return 'Documents have been uploaded. Please submit your application.';
      case OnboardingStatus.FORM_SUBMITTED:
        return 'Your application has been submitted and is in the officer queue.';
      case OnboardingStatus.DOCUMENTS_UNDER_REVIEW:
        return 'An officer is actively reviewing your documents.';
      case OnboardingStatus.DOCUMENTS_VERIFIED:
        return '✅ All your documents have been verified by an officer!';
      case OnboardingStatus.SCREENING_PENDING:
        return 'Background screening has been queued.';
      case OnboardingStatus.SCREENING_IN_PROGRESS:
        return 'Background and compliance screening is in progress.';
      case OnboardingStatus.SCREENING_CLEARED:
        return 'Background screening cleared. Awaiting final decision.';
      case OnboardingStatus.CASE_IN_REVIEW:
        return 'A compliance case is being reviewed by the officer team.';
      case OnboardingStatus.APPROVED:
        return '🎉 Your onboarding has been approved. Welcome aboard!';
      case OnboardingStatus.FLAGGED:
        return 'Your profile has been flagged for manual compliance review.';
      case OnboardingStatus.DOCUMENTS_REJECTED:
        return 'One or more documents were rejected. Please re-upload the highlighted documents.';
      case OnboardingStatus.REJECTED:
        return 'Your onboarding application was rejected. Please contact HR.';
      default:
        return 'Your onboarding status has been updated.';
    }
  }

  private formatDocumentName(value: string): string {
    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, ch => ch.toUpperCase());
  }

  private formatDateTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Recently';
    }

    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  private formatStatus(value: string): string {
    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, ch => ch.toUpperCase());
  }

  private getInitials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('') || 'C';
  }
}
