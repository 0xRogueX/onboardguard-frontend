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

@Injectable({
  providedIn: 'root'
})
export class OfficerService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/officer';

  // L1 Verification (Legacy methods added back to fix compilation)
  getPendingCandidates(): Observable<ApiResponse<CandidateQueueItem[]>> {
    return this.http.get<ApiResponse<CandidateQueueItem[]>>(`${this.apiUrl}/documents/candidates/pending`);
  }

  claimCandidate(candidateId: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/documents/candidates/${candidateId}/claim`, {});
  }

  getCandidateDetails(candidateId: number): Observable<ApiResponse<DocumentVerificationDashboard>> {
    return this.http.get<ApiResponse<DocumentVerificationDashboard>>(`${this.apiUrl}/documents/candidates/${candidateId}`);
  }


  // L1 Verification
  getPendingDocuments(): Observable<ApiResponse<DocumentDto[]>> {
    return this.http.get<ApiResponse<DocumentDto[]>>(`${this.apiUrl}/documents/candidates/pending`);
  }

  assignNextDocument(): Observable<ApiResponse<DocumentDto>> {
    return this.http.post<ApiResponse<DocumentDto>>(`${this.apiUrl}/documents/assign-next`, {});
  }

  approveDocument(docId: string | number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/documents/${docId}/approve`, {});
  }

  rejectDocument(docId: string | number, reason: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/documents/${docId}/reject`, { reason });
  }

  // Alerts
  getAlerts(): Observable<ApiResponse<AlertDto[]>> {
    return this.http.get<ApiResponse<AlertDto[]>>(`${this.apiUrl}/alerts`);
  }

  // Cases (L1/L2)
  getAvailableCases(): Observable<ApiResponse<CaseDto[]>> {
    return this.http.get<ApiResponse<CaseDto[]>>(`${this.apiUrl}/cases/available`);
  }

  getEscalatedCases(): Observable<ApiResponse<CaseDto[]>> {
    return this.http.get<ApiResponse<CaseDto[]>>(`${this.apiUrl}/cases/escalated`);
  }

  resolveCase(caseId: string | number, resolution: 'CLEARED' | 'REJECTED'): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/cases/${caseId}/resolve`, {
      outcome: resolution,
      reason: resolution === 'CLEARED' ? 'Cleared from officer review' : 'Rejected from officer review'
    });
  }

  addCaseNote(caseId: string | number, note: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/cases/${caseId}/notes`, { content: note });
  }
}
