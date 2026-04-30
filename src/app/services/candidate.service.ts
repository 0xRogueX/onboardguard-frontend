import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, timeout } from 'rxjs';
import { CandidateStatusDto, DocumentDto } from '../models';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: any;
}

@Injectable({
  providedIn: 'root'
})
export class CandidateService {
  private readonly apiUrl = 'http://localhost:8080/api/v1/candidates/profile';
  private readonly defaultRequestTimeoutMs = 15000;
  private readonly uploadRequestTimeoutMs = 45000;
  private http = inject(HttpClient);
  private profileUpdatedSubject = new Subject<void>();

  profileUpdated$ = this.profileUpdatedSubject.asObservable();

  getProfileStatus(): Observable<ApiResponse<CandidateStatusDto>> {
    return this.http.get<ApiResponse<CandidateStatusDto>>(`${this.apiUrl}/status`)
      .pipe(timeout(this.defaultRequestTimeoutMs));
  }

  updatePersonalDetails(data: any): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/personal`, data)
      .pipe(timeout(this.defaultRequestTimeoutMs));
  }

  updateProfessionalDetails(data: any): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/professional`, data)
      .pipe(timeout(this.defaultRequestTimeoutMs));
  }

  uploadDocument(file: File, documentType: string): Observable<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('candidateDocumentType', documentType);
    
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/documents`, formData)
      .pipe(timeout(this.uploadRequestTimeoutMs));
  }

  getRejectedDocuments(): Observable<ApiResponse<DocumentDto[]>> {
    return this.http.get<ApiResponse<DocumentDto[]>>(`${this.apiUrl}/documents?status=REJECTED`)
      .pipe(timeout(this.defaultRequestTimeoutMs));
  }

  submitProfile(): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/submit`, {})
      .pipe(timeout(this.defaultRequestTimeoutMs));
  }

  notifyProfileUpdated(): void {
    this.profileUpdatedSubject.next();
  }
}
