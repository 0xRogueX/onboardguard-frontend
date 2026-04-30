import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardStatsDto, UserProfile } from '../models';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: any;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface SystemConfigDto {
  id: number;
  configKey: string;
  configValue: string;
  configType: string;
  description: string;
  isSensitive: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/v1/admin';

  getDashboardStats(): Observable<ApiResponse<DashboardStatsDto>> {
    return this.http.get<ApiResponse<DashboardStatsDto>>(`${this.baseUrl}/dashboard`);
  }

  getUsers(page = 0, size = 20): Observable<ApiResponse<PageResponse<UserProfile>>> {
    return this.http.get<ApiResponse<PageResponse<UserProfile>>>(`${this.baseUrl}/users`, {
      params: { page, size }
    });
  }

  addOfficer(officerData: any): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/users/officers`, officerData);
  }

  toggleUserStatus(userId: number, isActive: boolean): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.baseUrl}/users/${userId}/status`, null, {
      params: { isActive }
    });
  }

  getPendingApprovals(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/approvals/pending`);
  }

  reviewApproval(approvalId: string, decision: 'APPROVE' | 'REJECT'): Observable<ApiResponse<void>> {
    const status = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/approvals/${approvalId}/review`, { status });
  }

  getSystemConfigs(): Observable<ApiResponse<SystemConfigDto[]>> {
    return this.http.get<ApiResponse<SystemConfigDto[]>>(`${this.baseUrl}/system-configs`);
  }
}
