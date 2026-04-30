import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfficerService } from '../../services/officer.service';
import { CaseDto } from '../../models';

@Component({
  selector: 'app-case-review',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './case-review.component.html',
  styleUrl: './case-review.component.css'
})
export class CaseReviewComponent implements OnInit {
  private officerService = inject(OfficerService);

  cases = signal<CaseDto[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit() {
    this.loadCases();
  }

  loadCases() {
    this.isLoading.set(true);
    this.officerService.getAvailableCases().subscribe({
      next: (res) => {
        this.cases.set(res.data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  resolveCase(caseId: string | number, resolution: 'CLEARED' | 'REJECTED') {
    this.officerService.resolveCase(caseId, resolution).subscribe({
      next: () => {
        alert(`Case ${resolution}`);
        this.loadCases(); // Refresh list
      }
    });
  }

  getPriority(c: CaseDto) {
    if (c.slaBreached || c.isSlaBreached) return 'HIGH';
    if (c.status === 'ESCALATED') return 'MEDIUM';
    return 'LOW';
  }
}
