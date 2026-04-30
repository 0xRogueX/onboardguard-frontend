import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CandidateService } from '../../services/candidate.service';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CandidateStatusDto, OnboardingStatus } from '../../models';

@Component({
  selector: 'app-onboarding-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './onboarding-form.component.html',
  styleUrl: './onboarding-form.component.css'
})
export class CandidateOnboardingFormComponent implements OnInit {
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
  private readonly maxUploadBytes = 10 * 1024 * 1024;
  private readonly allowedUploadTypes = ['application/pdf', 'image/jpeg', 'image/png'];

  currentStep = 1;
  profileStatus: CandidateStatusDto | null = null;
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

  async ngOnInit() {
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

    await this.syncProgressFromBackend();
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0] ?? null;
    this.errorMessage = '';

    if (file && !this.allowedUploadTypes.includes(file.type)) {
      this.selectedFile = null;
      this.errorMessage = 'Only PDF, JPG, and PNG files are accepted.';
      if (event.target) {
        event.target.value = '';
      }
      return;
    }

    if (file && file.size > this.maxUploadBytes) {
      this.selectedFile = null;
      this.errorMessage = 'File exceeds the 10MB maximum size limit.';
      if (event.target) {
        event.target.value = '';
      }
      return;
    }

    this.selectedFile = file;
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
      await this.savePersonalDetails();
    } else if (this.currentStep === 2) {
      if (this.professionalForm.invalid) {
        this.professionalForm.markAllAsTouched();
        this.errorMessage = 'Please fill all required fields correctly.';
        return;
      }
      await this.saveProfessionalDetails();
    } else if (this.currentStep === 3) {
      if (!this.selectedFile) {
        this.errorMessage = 'Please choose a document from your system before continuing.';
        return;
      }
      await this.uploadSelectedDocument();
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.errorMessage = '';
      this.successMessage = '';
    }
  }

  async submitApplication() {
    this.isLoading = true;
    try {
      await firstValueFrom(this.candidateService.submitProfile());
      this.currentStep = 4;
      this.candidateService.notifyProfileUpdated();
      void this.syncProgressFromBackend(4);
      this.successMessage = 'Application submitted successfully!';
      setTimeout(() => this.router.navigate(['/candidate/dashboard']), 2000);
    } catch (err: any) {
      this.errorMessage = this.getRequestErrorMessage(err, 'Failed to submit application.');
    } finally {
      this.isLoading = false;
    }
  }

  triggerFilePicker(fileInput: HTMLInputElement) {
    fileInput.click();
  }

  getUploadButtonLabel() {
    return this.selectedFile ? `Upload ${this.selectedFile.name}` : 'Choose file from system';
  }

  private async savePersonalDetails() {
    this.isLoading = true;
    try {
      await firstValueFrom(this.candidateService.updatePersonalDetails(this.buildPersonalDetailsPayload()));
      this.currentStep = Math.max(this.currentStep, 2);
      this.successMessage = 'Personal details saved successfully.';
      this.candidateService.notifyProfileUpdated();
      void this.syncProgressFromBackend(2);
    } catch (err: any) {
      this.errorMessage = this.getRequestErrorMessage(err, 'Failed to save personal details.');
    } finally {
      this.isLoading = false;
    }
  }

  private async saveProfessionalDetails() {
    this.isLoading = true;
    try {
      const payload = this.buildProfessionalDetailsPayload();
      await firstValueFrom(this.candidateService.updateProfessionalDetails(payload));
      this.currentStep = Math.max(this.currentStep, 3);
      this.successMessage = 'Professional details saved successfully.';
      this.candidateService.notifyProfileUpdated();
      void this.syncProgressFromBackend(3);
    } catch (err: any) {
      this.errorMessage = this.getRequestErrorMessage(err, 'Failed to save professional details.');
    } finally {
      this.isLoading = false;
    }
  }

  private async uploadSelectedDocument() {
    this.isLoading = true;
    try {
      await firstValueFrom(this.candidateService.uploadDocument(this.selectedFile!, this.documentType));
      this.selectedFile = null;
      if (this.fileInput?.nativeElement) {
        this.fileInput.nativeElement.value = '';
      }
      this.currentStep = Math.max(this.currentStep, 4);
      this.successMessage = 'Document uploaded successfully.';
      this.candidateService.notifyProfileUpdated();
      void this.syncProgressFromBackend(4);
    } catch (err: any) {
      this.errorMessage = this.getRequestErrorMessage(err, 'Failed to upload document.');
    } finally {
      this.isLoading = false;
    }
  }

  private async syncProgressFromBackend(fallbackStep?: number) {
    try {
      const response = await firstValueFrom(this.candidateService.getProfileStatus());
      this.profileStatus = response.data;
      const backendStep = this.getStepFromStatus(response.data.onboardingStatus, response.data.isSubmitted);
      if (fallbackStep) {
        this.currentStep = Math.max(fallbackStep, backendStep);
      } else {
        this.currentStep = backendStep;
      }
    } catch {
      if (fallbackStep) {
        this.currentStep = Math.max(this.currentStep, fallbackStep);
      }
    }
  }

  private getStepFromStatus(status: OnboardingStatus, isSubmitted: boolean) {
    switch (status) {
      case OnboardingStatus.REGISTERED:
        return 1;
      case OnboardingStatus.PERSONAL_SAVED:
        return 2;
      case OnboardingStatus.PROFESSIONAL_SAVED:
        return 3;
      case OnboardingStatus.DOCUMENTS_UPLOADED:
      case OnboardingStatus.FORM_SUBMITTED:
      case OnboardingStatus.SCREENING_PENDING:
      case OnboardingStatus.SCREENING_IN_PROGRESS:
      case OnboardingStatus.DOCUMENTS_UNDER_REVIEW:
      case OnboardingStatus.CASE_IN_REVIEW:
      case OnboardingStatus.SCREENING_CLEARED:
      case OnboardingStatus.FLAGGED:
      case OnboardingStatus.REJECTED:
      case OnboardingStatus.APPROVED:
        return 4;
      case OnboardingStatus.DOCUMENTS_REJECTED:
        return isSubmitted ? 4 : 3;
      default:
        return isSubmitted ? 4 : 1;
    }
  }

  private buildPersonalDetailsPayload() {
    const value = this.personalForm.value;
    return {
      firstName: this.normalizeRequiredText(value.firstName),
      middleName: this.normalizeOptionalText(value.middleName),
      lastName: this.normalizeRequiredText(value.lastName),
      dateOfBirth: value.dateOfBirth,
      gender: this.normalizeRequiredText(value.gender),
      nationality: this.normalizeRequiredText(value.nationality),
      panNumber: this.normalizeOptionalText(value.panNumber),
      adhaarNumber: this.normalizeOptionalText(value.adhaarNumber),
      passportNumber: this.normalizeOptionalText(value.passportNumber),
      addressLine1: this.normalizeRequiredText(value.addressLine1),
      addressCity: this.normalizeRequiredText(value.addressCity),
      addressState: this.normalizeRequiredText(value.addressState),
      addressPincode: this.normalizeRequiredText(value.addressPincode),
      addressCountry: this.normalizeOptionalText(value.addressCountry)
    };
  }

  private normalizeRequiredText(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private normalizeOptionalText(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private buildProfessionalDetailsPayload() {
    const value = this.professionalForm.value;
    return {
      currentOrganization: this.normalizeOptionalText(value.currentOrganization),
      cinNumber: this.normalizeOptionalText(value.cinNumber),
      dinNumber: this.normalizeOptionalText(value.dinNumber),
      currentDesignation: this.normalizeOptionalText(value.currentDesignation),
      totalExperienceYears: value.totalExperienceYears === '' || value.totalExperienceYears === null ? null : Number(value.totalExperienceYears),
      previousOrganization: this.normalizeOptionalText(value.previousOrganization),
      previousDesignation: this.normalizeOptionalText(value.previousDesignation),
      vendorCompanyName: this.normalizeOptionalText(value.vendorCompanyName),
      vendorGstNumber: this.normalizeOptionalText(value.vendorGstNumber),
      highestQualification: this.normalizeOptionalText(value.highestQualification),
      universityName: this.normalizeOptionalText(value.universityName),
      graduationYear: value.graduationYear === '' || value.graduationYear === null ? null : Number(value.graduationYear)
    };
  }

  clearSelectedFile() {
    this.selectedFile = null;
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  private getRequestErrorMessage(err: any, fallback: string): string {
    if (err?.name === 'TimeoutError') {
      return 'The server is taking too long to respond. Please try again.';
    }

    return err?.error?.message || fallback;
  }
}
