import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-screening-config',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './screening-config.component.html',
  styleUrl: './screening-config.component.css'
})
export class ScreeningConfigComponent {
  allowedDocs = ['Passport', 'National ID', 'Driving License', 'Work Permit'];
  
  riskRules = [
    { name: 'Negative News Matches', weight: 40 },
    { name: 'PEP Identification', weight: 30 },
    { name: 'Sanction List Hits', weight: 80 },
    { name: 'Jurisdiction Risk', weight: 20 },
    { name: 'Source of Wealth Ambiguity', weight: 50 },
  ];
}
