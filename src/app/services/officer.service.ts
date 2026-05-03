import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentDto, CaseDto, AlertDto } from '../models';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: any;
}

export interface CandidateQueueItem {
  candidateId: number;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  formSubmittedAt: string;
}

export interface DocumentVerificationDashboard {
  candidateId: number;
  email: string;
  status: string;
  formSubmittedAt: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    panNumber: string;
    adhaarNumber: string;
    passportNumber: string;
  };
  addressInfo: {
    addressLine1: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  professionalInfo: {
    currentOrganization: string;
    currentDesignation: string;
    totalExperienceYears: number;
    highestQualification: string;
  };
  documents: Array<{
    id: number;
    candidateDocumentType: string;
    originalFilename: string;
    fileSizeBytes: number;
    status: string;
    rejectionReason?: string;
    uploadedAt: string;
    fileUrl: string;
  }>;
}

export interface AlertDetail {
  id: number;
  candidateId: number;
  screeningResultId?: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'DISMISSED' | 'CONVERTED' | string;
  matchedCategories: string[];
  slaDeadline?: string;
  isSlaBreached?: boolean;
  acknowledgedBy?: number;
  acknowledgedAt?: string;
  createdAt: string;
}

export interface CaseDetail {
  id: number;
  alertId?: number;
  candidateId: number;
  assignedOfficerId?: number;
  assignedBy?: number;
  assignedAt?: string;
  slaDueDate?: string;
  isSlaBreached?: boolean;
  status: 'OPEN' | 'IN_REVIEW' | 'ESCALATED' | 'CLEARED' | 'REJECTED' | string;
  outcome?: 'CLEARED' | 'REJECTED' | string;
  outcomeReason?: string;
  resolvedBy?: number;
  resolvedAt?: string;
  escalatedBy?: number;
  escalatedTo?: number;
  escalatedAt?: string;
  escalationReason?: string;
  notes?: CaseNote[];
  createdAt: string;
  updatedAt?: string;
}

export interface CaseNote {
  id?: number;
  content: string;
  authorId?: number;
  createdAt?: string;
}

export interface MatchDetail {
  watchlistEntryId: number;
  watchlistPrimaryName: string;
  watchlistCategory: string;
  watchlistSeverity: string;
  watchlistSourceName: string;
  matchType: string;
  candidateFieldValue: string;
  watchlistFieldValue: string;
  similarityScore?: number;
  scoreContribution: number;
}

export interface ScreeningResult {
  screeningResultId: number;
  candidateId: number;
  riskScore: number;
  riskLevel: string;
  status: string;
  matches: MatchDetail[];
  totalEntriesChecked: number;
  screeningStartedAt: string;
  screeningCompletedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class OfficerService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/officer';

  // ─── DOCUMENT VERIFICATION (L1) ───────────────────────────────────────────

  /** Get all candidates pending document review */
  getPendingCandidates(): Observable<ApiResponse<CandidateQueueItem[]>> {
    return this.http.get<ApiResponse<CandidateQueueItem[]>>(`${this.apiUrl}/documents/candidates/pending`);
  }

  /** Claim a specific candidate for review (locks it) */
  claimCandidate(candidateId: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/documents/candidates/${candidateId}/claim`, {});
  }

  /** Auto-assign next waiting candidate (FIFO) */
  claimNextCandidate(): Observable<ApiResponse<DocumentVerificationDashboard>> {
    return this.http.post<ApiResponse<DocumentVerificationDashboard>>(`${this.apiUrl}/documents/candidates/assign-next`, {});
  }

  /** Get full candidate verification dashboard */
  getCandidateDetails(candidateId: number): Observable<ApiResponse<DocumentVerificationDashboard>> {
    return this.http.get<ApiResponse<DocumentVerificationDashboard>>(`${this.apiUrl}/documents/candidates/${candidateId}`);
  }

  /** Approve a document */
  approveDocument(docId: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/documents/${docId}/approve`, {});
  }

  /** Reject a document with a reason */
  rejectDocument(docId: number, reason: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/documents/${docId}/reject`, { reason });
  }

  // ─── ALERTS (L1) ───────────────────────────────────────────────────────────

  /** Get all OPEN alerts (L1 dashboard) */
  getAlerts(): Observable<ApiResponse<AlertDetail[]>> {
    return this.http.get<ApiResponse<AlertDetail[]>>(`${this.apiUrl}/alerts`);
  }

  /** Claim / acknowledge a specific alert */
  acknowledgeAlert(alertId: number): Observable<ApiResponse<AlertDetail>> {
    return this.http.post<ApiResponse<AlertDetail>>(`${this.apiUrl}/alerts/${alertId}/acknowledge`, {});
  }

  /** Auto-assign next OPEN alert (FIFO) */
  claimNextAlert(): Observable<ApiResponse<AlertDetail>> {
    return this.http.post<ApiResponse<AlertDetail>>(`${this.apiUrl}/alerts/assign-next`, {});
  }

  /** Dismiss an alert as false-positive */
  dismissAlert(alertId: number, reason: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/alerts/${alertId}/dismiss`, null, {
      params: { reason }
    });
  }

  /** Convert a claimed alert into a full case */
  convertAlertToCase(alertId: number): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.apiUrl}/alerts/${alertId}/convert`, {});
  }

  /** Get all alerts that have breached SLA */
  getBreachedAlerts(): Observable<ApiResponse<AlertDetail[]>> {
    return this.http.get<ApiResponse<AlertDetail[]>>(`${this.apiUrl}/alerts/breached`);
  }

  // ─── CASES – L1 (OPEN QUEUE) ───────────────────────────────────────────────

  /** Get all OPEN cases available for L1 */
  getAvailableCases(): Observable<ApiResponse<CaseDetail[]>> {
    return this.http.get<ApiResponse<CaseDetail[]>>(`${this.apiUrl}/cases/available`);
  }

  /** Manually claim a specific OPEN case */
  claimOpenCase(caseId: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/cases/available/${caseId}/claim`, {});
  }

  /** Auto-assign next OPEN case (FIFO) */
  claimNextOpenCase(): Observable<ApiResponse<CaseDetail>> {
    return this.http.post<ApiResponse<CaseDetail>>(`${this.apiUrl}/cases/available/assign-next`, {});
  }

  /** Escalate an IN_REVIEW case to L2 */
  escalateCase(caseId: number, escalatedTo: number | null, escalationReason: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/cases/${caseId}/escalate`, {
      escalatedTo,
      escalationReason
    });
  }

  // ─── CASES – L2 (ESCALATED QUEUE) ─────────────────────────────────────────

  /** Get all ESCALATED cases for L2 */
  getEscalatedCases(): Observable<ApiResponse<CaseDetail[]>> {
    return this.http.get<ApiResponse<CaseDetail[]>>(`${this.apiUrl}/cases/escalated`);
  }

  /** Manually claim a specific ESCALATED case */
  claimEscalatedCase(caseId: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/cases/escalated/${caseId}/claim`, {});
  }

  /** Auto-assign next ESCALATED case (FIFO) */
  claimNextEscalatedCase(): Observable<ApiResponse<CaseDetail>> {
    return this.http.post<ApiResponse<CaseDetail>>(`${this.apiUrl}/cases/escalated/assign-next`, {});
  }

  /** Resolve a case (CLEARED or REJECTED) – L2 final decision */
  resolveCase(caseId: number, outcome: 'CLEARED' | 'REJECTED', outcomeReason: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/cases/${caseId}/resolve`, {
      outcome,
      outcomeReason
    });
  }

  /** Get full details of a specific case */
  getCaseDetails(caseId: number): Observable<ApiResponse<CaseDetail>> {
    return this.http.get<ApiResponse<CaseDetail>>(`${this.apiUrl}/cases/${caseId}`);
  }

  /** Add an investigation note to a case */
  addCaseNote(caseId: number, content: string): Observable<ApiResponse<CaseNote>> {
    return this.http.post<ApiResponse<CaseNote>>(`${this.apiUrl}/cases/${caseId}/notes`, { content });
  }

  // ─── SCREENING RESULTS ──────────────────────────────────────────────────
  
  /** Get latest screening result for a candidate */
  getLatestScreeningResult(candidateId: number): Observable<ApiResponse<ScreeningResult>> {
    return this.http.get<ApiResponse<ScreeningResult>>(`http://localhost:8080/api/v1/screening/candidates/${candidateId}/latest`);
  }
}
