import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, PageResponse } from './admin.service';

export interface WatchlistCategoryDto {
  categoryCode: string;
  categoryName: string;
  description: string;
}

export interface AliasDto {
  id: number;
  aliasName: string;
  aliasType: string;
}

export interface EvidenceDto {
  id: number;
  documentTitle: string;
  documentType: string;
  cloudStorageKey: string;
  uploadedAt: string;
}

export interface WatchlistEntryResponseDto {
  id: number;
  categoryCode: string;
  categoryName: string;
  primaryName: string;
  severity: string;
  sourceName: string;
  sourceCredibilityWeight: number;
  panNumber: string;
  aadhaarNumber: string;
  dinNumber: string;
  cinNumber: string;
  categorySpecificData: Record<string, any>;
  organizationName: string;
  designation: string;
  dateOfBirth: string;
  nationality: string;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
  notes: string;
  approvedBy: string;
  approvedAt: string;
  createdBy: string;
  createdAt: string;
  aliases: AliasDto[];
  evidenceDocuments: EvidenceDto[];
}

@Injectable({ providedIn: 'root' })
export class WatchlistService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/v1/watchlist';

  getAllActiveEntries(page = 0, size = 20, category?: string): Observable<ApiResponse<PageResponse<WatchlistEntryResponseDto>>> {
    let params: any = { page, size };
    if (category) {
      params.category = category;
    }
    return this.http.get<ApiResponse<PageResponse<WatchlistEntryResponseDto>>>(this.baseUrl, { params });
  }

  getCategories(): Observable<ApiResponse<WatchlistCategoryDto[]>> {
    return this.http.get<ApiResponse<WatchlistCategoryDto[]>>(`${this.baseUrl}/categories`);
  }

  getEntryDetails(entryId: number): Observable<ApiResponse<WatchlistEntryResponseDto>> {
    return this.http.get<ApiResponse<WatchlistEntryResponseDto>>(`${this.baseUrl}/${entryId}`);
  }
}
