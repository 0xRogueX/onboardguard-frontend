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
            role: 'CANDIDATE',
            token: response.data.token
          };
          this.setUser(userData);
        }
      })
    );
  }

  loginStaff(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login/staff`, credentials).pipe(
      tap(response => {
        if (response.success) {
          const userData: User = {
            email: response.data.email,
            fullName: response.data.fullName,
            role: response.data.roleCode, // e.g., ADMIN, SUPER_ADMIN, L1_OFFICER, L2_OFFICER
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
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('onboardguard_user', JSON.stringify(user));
    }
    this.userSignal.set(user);
    this.redirectBasedOnRole(user.role);
  }

  private loadUserFromStorage(): User | null {
    if (isPlatformBrowser(this.platformId)) {
      const data = localStorage.getItem('onboardguard_user');
      return data ? JSON.parse(data) : null;
    }
    return null;
  }

  private redirectBasedOnRole(role: string) {
    if (role === 'CANDIDATE') {
      this.router.navigate(['/candidate/dashboard']);
    } else if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      this.router.navigate(['/admin/users']);
    } else if (role === 'L1_OFFICER' || role === 'L2_OFFICER') {
      this.router.navigate(['/officer/alerts']);
    }
  }
}
