import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-escalated-cases',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './escalated-cases.component.html',
  styleUrl: './escalated-cases.component.css'
})
export class EscalatedCasesComponent {
  escalatedCases = [
    { id: '#EX-9901', name: 'James Wilson', reason: 'Sanction list partial hit', l1Officer: 'Sarah J.', score: 92 },
    { id: '#EX-9904', name: 'Maria Santos', reason: 'Multiple ID discrepancy', l1Officer: 'Michael C.', score: 85 },
    { id: '#EX-9908', name: 'Igor Volkov', reason: 'High-value PEP match', l1Officer: 'Sarah J.', score: 98 },
    { id: '#EX-9912', name: 'Emma Thompson', reason: 'Address forgery suspected', l1Officer: 'Elena R.', score: 76 },
  ];
}
