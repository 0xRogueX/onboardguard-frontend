import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CandidateService } from '../../services/candidate.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-onboarding-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './onboarding-form.component.html',
  styleUrl: './onboarding-form.component.css'
})
export class CandidateOnboardingFormComponent implements OnInit {
  currentStep = 1;
  stepTitles = [
    'Personal Details',
    'Professional Details',
    'Document Upload',
    'Review & Submit'
  ];

  personalForm!: FormGroup;
  professionalForm!: FormGroup;

  selectedFile: File | null = null;
  documentType: string = 'AADHAAR_CARD';
  
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  private fb = inject(FormBuilder);
  private candidateService = inject(CandidateService);
  private router = inject(Router);

  ngOnInit() {
    this.personalForm = this.fb.group({
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      gender: ['', Validators.required],
      nationality: ['', Validators.required],
      panNumber: [''],
      adhaarNumber: [''],
      passportNumber: [''],
      addressLine1: ['', Validators.required],
      addressCity: ['', Validators.required],
      addressState: ['', Validators.required],
      addressPincode: ['', Validators.required],
      addressCountry: ['']
    });

    this.professionalForm = this.fb.group({
      currentOrganization: [''],
      cinNumber: [''],
      dinNumber: [''],
      currentDesignation: [''],
      totalExperienceYears: [0],
      previousOrganization: [''],
      previousDesignation: [''],
      vendorCompanyName: [''],
      vendorGstNumber: [''],
      highestQualification: [''],
      universityName: [''],
      graduationYear: [null]
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  async nextStep() {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.currentStep === 1) {
      if (this.personalForm.invalid) {
        this.personalForm.markAllAsTouched();
        this.errorMessage = 'Please fill all required fields correctly.';
        return;
      }
      this.isLoading = true;
      this.candidateService.updatePersonalDetails(this.personalForm.value).subscribe({
        next: () => {
          this.isLoading = false;
          this.currentStep++;
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Failed to save personal details.';
        }
      });
    } else if (this.currentStep === 2) {
      if (this.professionalForm.invalid) {
        this.professionalForm.markAllAsTouched();
        this.errorMessage = 'Please fill all required fields correctly.';
        return;
      }
      this.isLoading = true;
      this.candidateService.updateProfessionalDetails(this.professionalForm.value).subscribe({
        next: () => {
          this.isLoading = false;
          this.currentStep++;
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Failed to save professional details.';
        }
      });
    } else if (this.currentStep === 3) {
      if (!this.selectedFile) {
        this.currentStep++;
        return;
      }
      this.isLoading = true;
      this.candidateService.uploadDocument(this.selectedFile, this.documentType).subscribe({
        next: () => {
          this.isLoading = false;
          this.currentStep++;
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Failed to upload document.';
        }
      });
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.errorMessage = '';
      this.successMessage = '';
    }
  }

  submitApplication() {
    this.isLoading = true;
    this.candidateService.submitProfile().subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Application submitted successfully!';
        setTimeout(() => this.router.navigate(['/candidate/dashboard']), 2000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to submit application.';
      }
    });
  }
}
