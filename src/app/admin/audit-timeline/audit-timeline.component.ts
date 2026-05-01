import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AuditLogDto } from '../../services/admin.service';

@Component({
  selector: 'app-audit-timeline',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-timeline.component.html',
  styleUrl: './audit-timeline.component.css'
})
export class AuditTimelineComponent implements OnInit {
  private adminService = inject(AdminService);

  entityType = signal('SYSTEM_CONFIG');
  entityId = signal<number | null>(1);
  timeline = signal<AuditLogDto[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');

  ngOnInit() {
    this.loadTimeline();
  }

  loadTimeline() {
    if (!this.entityId()) {
      this.errorMessage.set('Please enter an entity ID.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.adminService.getAuditTimeline(this.entityType(), this.entityId()!).subscribe({
      next: (response) => {
        this.timeline.set(response.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.timeline.set([]);
        this.errorMessage.set(err?.error?.message || 'Unable to load timeline.');
        this.isLoading.set(false);
      }
    });
  }
}
