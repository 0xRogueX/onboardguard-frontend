import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-staff-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class StaffLoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal('');

  credentials = {
    email: '',
    password: ''
  };

  onLogin() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.loginStaff(this.credentials).subscribe({
      next: () => {
        this.isLoading.set(false);
        // AuthService handles redirection
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Invalid enterprise credentials.');
      }
    });
  }
}
