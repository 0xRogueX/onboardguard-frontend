import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Step {
  title: string;
  description: string;
  icon: string;
  status: 'completed' | 'in-progress' | 'error' | 'pending';
}

interface Update {
  title: string;
  time: string;
}

@Component({
  selector: 'app-candidate-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class CandidateDashboardComponent {
  candidateName = 'Alex';

  steps = signal<Step[]>([
    { title: 'Personal Information', description: 'Basic profile and contact details', icon: 'person', status: 'completed' },
    { title: 'Identity Verification', description: 'Passport or National ID upload', icon: 'fingerprint', status: 'completed' },
    { title: 'Address Proof', description: 'Utility bill or bank statement', icon: 'home', status: 'error' },
    { title: 'Employment History', description: 'Past 5 years of experience', icon: 'work', status: 'in-progress' },
    { title: 'Background Check', description: 'Criminal and credit history', icon: 'search_check', status: 'pending' },
  ]);

  updates = signal<Update[]>([
    { title: 'Address proof rejected', time: '2 hours ago' },
    { title: 'Identity verification approved', time: 'Yesterday, 4:30 PM' },
    { title: 'Application submitted', time: '2 days ago' },
    { title: 'Welcome to OnboardGuard', time: '3 days ago' },
  ]);

  getStatusBg(status: string): string {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-600';
      case 'in-progress': return 'bg-indigo-100 text-indigo-600';
      case 'error': return 'bg-rose-100 text-rose-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'completed': return 'text-emerald-700 bg-emerald-50 border border-emerald-200';
      case 'in-progress': return 'text-indigo-700 bg-indigo-50 border border-indigo-200';
      case 'error': return 'text-rose-700 bg-rose-50 border border-rose-200';
      default: return 'text-slate-600 bg-slate-50 border border-slate-200';
    }
  }
}
