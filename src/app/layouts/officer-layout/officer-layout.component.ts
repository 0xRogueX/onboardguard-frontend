import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-officer-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './officer-layout.component.html',
  styleUrl: './officer-layout.component.css'
})
export class OfficerLayoutComponent {
  private authService = inject(AuthService);

  currentUser = computed(() => this.authService.currentUser());
  displayName = computed(() => this.currentUser()?.fullName || 'Officer');
  roleLabel = computed(() => this.formatRole(this.currentUser()?.role || 'L1_OFFICER'));

  private formatRole(role: string): string {
    switch (role) {
      case 'L1_OFFICER':
        return 'L1 Officer';
      case 'L2_OFFICER':
        return 'L2 Officer';
      default:
        return role.replace(/_/g, ' ');
    }
  }
}
