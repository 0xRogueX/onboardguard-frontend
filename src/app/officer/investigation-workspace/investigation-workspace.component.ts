import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OfficerService, DocumentVerificationDashboard } from '../../services/officer.service';

@Component({
  selector: 'app-investigation-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './investigation-workspace.component.html',
  styleUrl: './investigation-workspace.component.css'
})
export class InvestigationWorkspaceComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private officerService = inject(OfficerService);

  candidate = signal<DocumentVerificationDashboard | null>(null);
  isLoading = signal(true);
  
  // Rejection modal state
  showRejectModal = signal(false);
  selectedDocId = signal<number | null>(null);
  rejectionReason = signal('');
  isProcessing = signal(false);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCandidateDetails(+id);
    }
  }

  loadCandidateDetails(id: number) {
    this.isLoading.set(true);
    this.officerService.getCandidateDetails(id).subscribe({
      next: (res) => {
        this.candidate.set(res.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to load details');
        this.router.navigate(['/officer/alerts']);
      }
    });
  }

  approveDoc(docId: number) {
    this.isProcessing.set(true);
    this.officerService.approveDocument(docId).subscribe({
      next: () => {
        this.updateDocStatus(docId, 'APPROVED');
        this.isProcessing.set(false);
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to approve document');
        this.isProcessing.set(false);
      }
    });
  }

  openRejectModal(docId: number) {
    this.selectedDocId.set(docId);
    this.rejectionReason.set('');
    this.showRejectModal.set(true);
  }

  confirmReject() {
    if (!this.rejectionReason().trim()) return;
    
    this.isProcessing.set(true);
    this.officerService.rejectDocument(this.selectedDocId()!, this.rejectionReason()).subscribe({
      next: () => {
        this.updateDocStatus(this.selectedDocId()!, 'REJECTED');
        this.showRejectModal.set(false);
        this.isProcessing.set(false);
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to reject document');
        this.isProcessing.set(false);
      }
    });
  }

  private updateDocStatus(docId: number, status: string) {
    const current = this.candidate();
    if (current) {
      const updatedDocs = current.documents.map(d => 
        d.id === docId ? { ...d, status } : d
      );
      this.candidate.set({ ...current, documents: updatedDocs });
    }
  }

  getDocStatusClass(status: string) {
    switch (status) {
      case 'APPROVED': return 'text-green-600 bg-green-50 border-green-100';
      case 'REJECTED': return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-100';
    }
  }
}
