import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  constructor(private http: HttpClient) { }

  getProfileStatus(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/status`);
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
    
    // Note: Do NOT set Content-Type header manually when sending FormData,
    // HttpClient will set it to multipart/form-data with the correct boundary automatically.
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/documents`, formData);
  }

  submitProfile(): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/submit`, {});
  }
}
