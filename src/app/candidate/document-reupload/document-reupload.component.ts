import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CandidateService } from '../../services/candidate.service';
import { DocumentDto } from '../../models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-document-reupload',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './document-reupload.component.html',
  styleUrl: './document-reupload.component.css'
})
export class DocumentReuploadComponent implements OnInit {
  private candidateService = inject(CandidateService);
  private router = inject(Router);

  rejectedDocs = signal<DocumentDto[]>([]);
  selectedFiles = signal<Map<string, File>>(new Map());
  isUploading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  ngOnInit() {
    this.loadRejectedDocuments();
  }

  loadRejectedDocuments() {
    this.candidateService.getRejectedDocuments().subscribe({
      next: (response) => {
        this.rejectedDocs.set(response.data);
        if (response.data.length === 0) {
          // If no rejected documents, send back to dashboard
          this.router.navigate(['/candidate/dashboard']);
        }
      },
      error: (err) => {
        this.errorMessage.set('Failed to load rejected documents.');
      }
    });
  }

  onFileSelected(event: any, docType: string) {
    const file = event.target.files[0];
    if (file) {
      const currentMap = new Map(this.selectedFiles());
      currentMap.set(docType, file);
      this.selectedFiles.set(currentMap);
    }
  }

  getFileName(docType: string): string {
    return this.selectedFiles().get(docType)?.name || '';
  }

  formatDocType(type: string): string {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  onSubmit() {
    if (this.selectedFiles().size === 0) {
      this.errorMessage.set('Please select at least one document to re-upload.');
      return;
    }

    this.isUploading.set(true);
    this.errorMessage.set('');
    
    const uploadRequests = Array.from(this.selectedFiles().entries()).map(([type, file]) => 
      this.candidateService.reUploadDocument(file, type)
    );

    forkJoin(uploadRequests).subscribe({
      next: () => {
        this.isUploading.set(false);
        this.successMessage.set('Documents re-uploaded successfully! Returning to dashboard...');
        this.candidateService.notifyProfileUpdated();
        setTimeout(() => {
          this.router.navigate(['/candidate/dashboard']);
        }, 2000);
      },
      error: (err) => {
        this.isUploading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to re-upload documents. Please try again.');
      }
    });
  }
}
