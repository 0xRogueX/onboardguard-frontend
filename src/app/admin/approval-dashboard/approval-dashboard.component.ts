import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-approval-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './approval-dashboard.component.html',
  styleUrl: './approval-dashboard.component.css'
})
export class ApprovalDashboardComponent {
  approvals = [
    { 
      org: 'Global Bank', 
      title: 'KYC Policy Update (Q2)', 
      type: 'Configuration', 
      requestedBy: 'Sarah Jenkins', 
      time: '1 hour ago' 
    },
    { 
      org: 'Fintech Solutions', 
      title: 'Officer Access Escalation', 
      type: 'Security', 
      requestedBy: 'Michael Chen', 
      time: '3 hours ago' 
    },
    { 
      org: 'System Core', 
      title: 'Batch Re-screening Trigger', 
      type: 'Automated', 
      requestedBy: 'System Scheduler', 
      time: '5 hours ago' 
    },
  ];

  performance = [
    { name: 'Investigation Team A', load: 78, color: 'bg-indigo-500' },
    { name: 'Compliance L2 Units', load: 42, color: 'bg-green-500' },
    { name: 'Sanctions Processing', load: 91, color: 'bg-red-500' },
    { name: 'Identity QA', load: 15, color: 'bg-orange-400' },
  ];
}
