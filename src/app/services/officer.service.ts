import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../services/auth.service'; // Reuse ApiResponse interface if possible or define locally

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
  private apiUrl = 'http://localhost:8080/api/v1/officer/documents';

  getPendingCandidates(): Observable<ApiResponse<CandidateQueueItem[]>> {
    return this.http.get<ApiResponse<CandidateQueueItem[]>>(`${this.apiUrl}/candidates/pending`);
  }

  claimCandidate(candidateId: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/candidates/${candidateId}/claim`, {});
  }

  getCandidateDetails(candidateId: number): Observable<ApiResponse<DocumentVerificationDashboard>> {
    return this.http.get<ApiResponse<DocumentVerificationDashboard>>(`${this.apiUrl}/candidates/${candidateId}`);
  }

  approveDocument(documentId: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/${documentId}/approve`, {});
  }

  rejectDocument(documentId: number, reason: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/${documentId}/reject`, { reason });
  }

  assignNextCandidate(): Observable<ApiResponse<DocumentVerificationDashboard>> {
    return this.http.post<ApiResponse<DocumentVerificationDashboard>>(`${this.apiUrl}/candidates/assign-next`, {});
  }
}
