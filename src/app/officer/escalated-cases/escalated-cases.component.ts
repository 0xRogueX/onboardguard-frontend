import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OfficerService } from '../../services/officer.service';
import { CaseDto } from '../../models';

@Component({
  selector: 'app-escalated-cases',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './escalated-cases.component.html',
  styleUrl: './escalated-cases.component.css'
})
export class EscalatedCasesComponent implements OnInit {
  private officerService = inject(OfficerService);

  escalatedCases = signal<CaseDto[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.officerService.getEscalatedCases().subscribe({
      next: (response) => {
        this.escalatedCases.set(response.data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  getRiskScore(caseItem: CaseDto) {
    if (caseItem.slaBreached || caseItem.isSlaBreached) return 95;
    return caseItem.status === 'ESCALATED' ? 80 : 60;
  }
}
