import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-case-review',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './case-review.component.html',
  styleUrl: './case-review.component.css'
})
export class CaseReviewComponent {
  caseList = [
    { id: '88294', name: 'Alex Thompson', risk: 'High', reason: 'Identity confidence mismatch' },
    { id: '88295', name: 'Maria Santos', risk: 'Medium', reason: 'Address history gap' },
    { id: '88296', name: 'Igor Volkov', risk: 'Critical', reason: 'PEP Match identified' },
  ];

  currentCase = {
    id: '88294',
    name: 'Alex Thompson',
    escalationDate: 'Apr 26, 2026',
    score: 82,
    notes: 'Candidate submitted a utility bill that is over 3 months old. When asked for re-upload, the new document has a different font for the address line. Needs manual verification of the document authenticity.',
    documents: [
      { title: 'National ID (Front)', date: 'Apr 24, 2026' },
      { title: 'National ID (Back)', date: 'Apr 24, 2026' },
      { title: 'Proof of Address', date: 'Apr 26, 2026' }
    ],
    checks: [
      { name: 'OCR Match', passed: true, result: '98.5% confidence' },
      { name: 'Sanction List', passed: true, result: 'Clear' },
      { name: 'Forgery Detection', passed: false, result: 'Inconsistent typography' },
      { name: 'Blacklist', passed: true, result: 'Clear' }
    ]
  };
}
