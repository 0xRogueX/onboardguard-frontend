import { Injectable, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface User {
  email: string;
  fullName: string;
  role: string;
  token: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:8080/api/v1/auth';
  private platformId = inject(PLATFORM_ID);
  private userSignal = signal<User | null>(this.loadUserFromStorage());

  currentUser = computed(() => this.userSignal());
  isAuthenticated = computed(() => !!this.userSignal());
  userRole = computed(() => this.userSignal()?.role || '');

  constructor(private http: HttpClient, private router: Router) { }

  loginCandidate(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login/candidate`, credentials).pipe(
      tap(response => {
        if (response.success) {
          const userData: User = {
            email: response.data.email,
            fullName: response.data.fullName,
            role: this.normalizeRole('CANDIDATE'),
            token: response.data.token
          };
          this.setUser(userData);
        }
      })
    );
  }

  registerCandidate(candidateData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register/candidate`, candidateData);
  }

  loginStaff(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login/staff`, credentials).pipe(
      tap(response => {
        if (response.success) {
          const userData: User = {
            email: response.data.email,
            fullName: response.data.fullName,
            role: this.normalizeRole(response.data.roleCode),
            token: response.data.token
          };
          this.setUser(userData);
        }
      })
    );
  }

  logout() {
    const role = this.userRole();
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('onboardguard_user');
    }
    this.userSignal.set(null);

    if (role === 'CANDIDATE') {
      this.router.navigate(['/candidate/login']);
    } else {
      this.router.navigate(['/staff/login']);
    }
  }

  private setUser(user: User) {
    const normalizedUser = {
      ...user,
      role: this.normalizeRole(user.role)
    };
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('onboardguard_user', JSON.stringify(normalizedUser));
    }
    this.userSignal.set(normalizedUser);
    this.redirectBasedOnRole(normalizedUser.role);
  }

  private loadUserFromStorage(): User | null {
    if (isPlatformBrowser(this.platformId)) {
      const data = localStorage.getItem('onboardguard_user');
      if (!data) {
        return null;
      }

      const parsed = JSON.parse(data) as User;
      return {
        ...parsed,
        role: this.normalizeRole(parsed.role)
      };
    }
    return null;
  }

  private redirectBasedOnRole(role: string) {
    const normalizedRole = this.normalizeRole(role);

    if (normalizedRole === 'CANDIDATE') {
      this.router.navigate(['/candidate/dashboard']);
    } else if (normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN') {
      this.router.navigate(['/admin/users']);
    } else if (normalizedRole === 'L1_OFFICER' || normalizedRole === 'L2_OFFICER') {
      this.router.navigate(['/officer/alerts']);
    } else {
      this.router.navigate(['/staff/login']);
    }
  }

  private normalizeRole(role: string): string {
    switch ((role || '').toUpperCase()) {
      case 'ROLE_CANDIDATE':
      case 'CANDIDATE':
        return 'CANDIDATE';
      case 'ROLE_ADMIN':
      case 'ADMIN':
        return 'ADMIN';
      case 'ROLE_SUPER_ADMIN':
      case 'SUPER_ADMIN':
        return 'SUPER_ADMIN';
      case 'ROLE_OFFICER_L1':
      case 'ROLE_L1_OFFICER':
      case 'L1_OFFICER':
        return 'L1_OFFICER';
      case 'ROLE_OFFICER_L2':
      case 'ROLE_L2_OFFICER':
      case 'L2_OFFICER':
        return 'L2_OFFICER';
      default:
        return role?.startsWith('ROLE_') ? role.replace(/^ROLE_/, '') : role;
    }
  }
}
