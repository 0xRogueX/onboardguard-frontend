export enum OnboardingStatus {
  REGISTERED = 'REGISTERED',
  PERSONAL_SAVED = 'PERSONAL_SAVED',
  PROFESSIONAL_SAVED = 'PROFESSIONAL_SAVED',
  DOCUMENTS_UPLOADED = 'DOCUMENTS_UPLOADED',
  FORM_SUBMITTED = 'FORM_SUBMITTED',
  DOCUMENTS_UNDER_REVIEW = 'DOCUMENTS_UNDER_REVIEW',
  DOCUMENTS_VERIFIED = 'DOCUMENTS_VERIFIED',
  DOCUMENTS_REJECTED = 'DOCUMENTS_REJECTED',
  SCREENING_PENDING = 'SCREENING_PENDING',
  SCREENING_IN_PROGRESS = 'SCREENING_IN_PROGRESS',
  SCREENING_CLEARED = 'SCREENING_CLEARED',
  CASE_IN_REVIEW = 'CASE_IN_REVIEW',
  FLAGGED = 'FLAGGED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum UserRole {
  CANDIDATE = 'CANDIDATE',
  OFFICER = 'OFFICER',
  ADMIN = 'ADMIN'
}

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  isActive: boolean;
  locked: boolean;
  lastLoginAt?: string;
  createdAt?: string;
}

export interface CandidateStatusDto {
  candidateType: string;
  onboardingStatus: OnboardingStatus;
  isSubmitted: boolean;
}

export interface DocumentDto {
  id: number;
  candidateDocumentType: string;
  originalFilename: string;
  fileSizeBytes: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  uploadedAt: string;
  fileUrl: string; // Cloudinary URL
}

export interface CaseDto {
  id: number;
  alertId?: number;
  candidateId: number;
  assignedOfficerId?: number;
  assignedBy?: number;
  assignedAt?: string;
  slaDueDate?: string;
  slaBreached?: boolean;
  isSlaBreached?: boolean;
  status: 'OPEN' | 'IN_REVIEW' | 'ESCALATED' | 'CLEARED' | 'REJECTED' | string;
  outcome?: string;
  outcomeReason?: string;
  resolvedBy?: number;
  resolvedAt?: string;
  escalatedTo?: number;
  escalatedAt?: string;
  escalationReason?: string;
  createdAt: string;
  updatedAt?: string;
  notes?: any[];
}

export interface AlertDto {
  id: number;
  candidateId: number;
  screeningResultId?: number;
  severity: string;
  status: string;
  matchedCategories: string[];
  slaDeadline?: string;
  slaBreached?: boolean;
  acknowledgedBy?: number;
  acknowledgedAt?: string;
  createdAt: string;
}

export interface DashboardStatsDto {
  candidateStats: {
    totalOnboarded: number;
    pendingScreening: number;
    cleared: number;
    flagged: number;
  };
  alertStats: {
    totalGenerated: number;
    openAlerts: number;
    dismissedFalsePositives: number;
    escalatedToCases: number;
  };
  casePerformanceStats: {
    totalOpenCases: number;
    totalResolvedCases: number;
    averageResolutionTimeHours: number;
    slaBreachedCases: number;
  };
  categoryHitFrequency: Record<string, number>;
  pendingMakerCheckerRequests: number;
}
