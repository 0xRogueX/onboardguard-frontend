import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';
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
  category?: string;
  description: string;
  isSensitive: boolean;
}

export interface PendingApprovalDto {
  id: number;
  actionType: string;
  targetEntityType: string;
  targetEntityId?: number | null;
  payload: Record<string, any>;
  requestedById: number;
  requestedByName: string;
  requestedAt: string;
  reviewedById?: number | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
  status: string;
  rejectionReason?: string | null;
  isBypass?: boolean | null;
}

export interface ReviewApprovalRequest {
  status: 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
  isBypass?: boolean;
}

export interface UpdateSystemConfigRequest {
  configValue: string;
  description?: string | null;
}

export interface CreateOfficerRequest {
  fullName: string;
  email: string;
  phone?: string | null;
  role: 'ROLE_OFFICER_L1' | 'ROLE_OFFICER_L2';
}

export interface AuditLogDto {
  id: number;
  action: string;
  oldStatus: string;
  newStatus: string;
  performedBy: number;
  actorRole: string;
  remarks: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/v1/admin';
  private readonly timeoutMs = 20000;

  getDashboardStats(): Observable<ApiResponse<DashboardStatsDto>> {
    return this.http.get<ApiResponse<DashboardStatsDto>>(`${this.baseUrl}/dashboard`)
      .pipe(timeout(this.timeoutMs));
  }

  getUsers(page = 0, size = 20): Observable<ApiResponse<PageResponse<UserProfile>>> {
    return this.http.get<ApiResponse<PageResponse<UserProfile>>>(`${this.baseUrl}/users`, {
      params: { page, size }
    }).pipe(timeout(this.timeoutMs));
  }

  addOfficer(officerData: any): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/users/officers`, officerData)
      .pipe(timeout(this.timeoutMs));
  }

  toggleUserStatus(userId: number, isActive: boolean): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.baseUrl}/users/${userId}/status`, null, {
      params: { isActive }
    }).pipe(timeout(this.timeoutMs));
  }

  getPendingApprovals(): Observable<ApiResponse<PendingApprovalDto[]>> {
    return this.http.get<ApiResponse<PendingApprovalDto[]>>(`${this.baseUrl}/approvals/pending`)
      .pipe(timeout(this.timeoutMs));
  }

  reviewApproval(approvalId: number, review: ReviewApprovalRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/approvals/${approvalId}/review`, review)
      .pipe(timeout(this.timeoutMs));
  }

  getSystemConfigs(): Observable<ApiResponse<SystemConfigDto[]>> {
    return this.http.get<ApiResponse<SystemConfigDto[]>>(`${this.baseUrl}/system-configs`)
      .pipe(timeout(this.timeoutMs));
  }

  updateSystemConfig(configId: number, payload: UpdateSystemConfigRequest): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.baseUrl}/system-configs/${configId}`, payload)
      .pipe(timeout(this.timeoutMs));
  }

  getAuditTimeline(entityType: string, entityId: number): Observable<ApiResponse<AuditLogDto[]>> {
    return this.http.get<ApiResponse<AuditLogDto[]>>(`${this.baseUrl}/audit-logs/timeline`, {
      params: { entityType, entityId }
    }).pipe(timeout(this.timeoutMs));
  }
}
