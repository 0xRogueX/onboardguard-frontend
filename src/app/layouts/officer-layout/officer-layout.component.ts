import { Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { OfficerService, AlertDetail } from '../../services/officer.service';

@Component({
  selector: 'app-officer-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './officer-layout.component.html',
  styleUrl: './officer-layout.component.css'
})
export class OfficerLayoutComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private officerService = inject(OfficerService);
  private router = inject(Router);

  currentUser = computed(() => this.authService.currentUser());
  displayName = computed(() => this.currentUser()?.fullName || 'Officer');
  roleLabel = computed(() => this.formatRole(this.currentUser()?.role || ''));
  roleSummary = computed(() => this.isL2() ? 'Checker (L2)' : 'Maker (L1)');

  isL1 = computed(() => this.currentUser()?.role === 'L1_OFFICER');
  isL2 = computed(() => this.currentUser()?.role === 'L2_OFFICER');

  // SLA Notifications
  breachedAlerts = signal<AlertDetail[]>([]);
  showBreachedList = signal(false);
  private pollInterval: any;

  ngOnInit() {
    this.checkBreachedAlerts();
    // Poll every 3 minutes (matching backend scheduler)
    this.pollInterval = setInterval(() => this.checkBreachedAlerts(), 180000);
  }

  ngOnDestroy() {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  checkBreachedAlerts() {
    this.officerService.getBreachedAlerts().subscribe({
      next: (res) => {
        if (res.success) {
          this.breachedAlerts.set(res.data);
        }
      }
    });
  }

  toggleBreachedList() {
    this.showBreachedList.update(v => !v);
  }

  goToAlertBoard() {
    this.showBreachedList.set(false);
    this.router.navigate(['/officer/alert-board']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/staff/login']);
  }

  private formatRole(role: string): string {
    switch (role) {
      case 'L1_OFFICER': return 'L1 Maker Officer';
      case 'L2_OFFICER': return 'L2 Checker Officer';
      default: return role.replace(/_/g, ' ');
    }
  }
}
