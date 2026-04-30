import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  private http = inject(HttpClient);

  getProfileStatus(): Observable<ApiResponse<CandidateStatusDto>> {
    return this.http.get<ApiResponse<CandidateStatusDto>>(`${this.apiUrl}/status`);
  }

  updatePersonalDetails(data: any): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/personal`, data);
  }

  updateProfessionalDetails(data: any): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/professional`, data);
  }

  uploadDocument(file: File, documentType: string): Observable<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('candidateDocumentType', documentType);
    
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/documents`, formData);
  }

  getRejectedDocuments(): Observable<ApiResponse<DocumentDto[]>> {
    return this.http.get<ApiResponse<DocumentDto[]>>(`${this.apiUrl}/documents?status=REJECTED`);
  }

  submitProfile(): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/submit`, {});
  }
}
