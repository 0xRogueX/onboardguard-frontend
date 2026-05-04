import { Component, ElementRef, OnInit, ViewChild, inject, signal, ChangeDetectionStrategy, viewChild, computed } from '@angular/core';
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
  styleUrl: './onboarding-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CandidateOnboardingFormComponent implements OnInit {
  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  private readonly maxUploadBytes = 10 * 1024 * 1024;
  private readonly allowedUploadTypes = ['application/pdf', 'image/jpeg', 'image/png'];

  currentStep = signal(1);
  profileStatus = signal<CandidateStatusDto | null>(null);
  stepTitles = [
    'Personal Details',
    'Professional Details',
    'Document Upload',
    'Review & Submit'
  ];

  personalForm!: FormGroup;
  professionalForm!: FormGroup;

  selectedFile = signal<File | null>(null);
  documentType = signal<string>('AADHAAR_CARD');

  isLoading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  todayDate = new Date().toISOString().split('T')[0];

  isPersonalSaved = signal(false);
  isProfessionalSaved = signal(false);
  existingDob: string | null = null;

  // Uploaded documents tracking
  uploadedDocTypes = signal<string[]>([]);
  uploadedFilenames = signal<Record<string, string>>({});

  private fb = inject(FormBuilder);
  private candidateService = inject(CandidateService);
  private router = inject(Router);

  async ngOnInit() {
    this.personalForm = this.fb.group({
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required],
      dateOfBirth: ['', [Validators.required, this.ageValidator]],
      gender: ['', Validators.required],
      nationality: ['', Validators.required],
      panNumber: ['', [Validators.required, Validators.pattern('^[A-Z]{5}[0-9]{4}[A-Z]{1}$')]],
      adhaarNumber: ['', [Validators.required, Validators.pattern('^[0-9]{12}$')]],
      addressLine1: ['', Validators.required],
      addressCity: ['', Validators.required],
      addressState: ['', Validators.required],
      addressPincode: ['', Validators.required],
      addressCountry: ['']
    });

    this.professionalForm = this.fb.group({
      currentOrganization: ['', Validators.required],
      cinNumber: [''],
      dinNumber: [''],
      currentDesignation: ['', Validators.required],
      totalExperienceYears: [0, [Validators.required, Validators.min(0)]],
      previousOrganization: [''],
      previousDesignation: [''],
      vendorCompanyName: [''],
      vendorGstNumber: [''],
      highestQualification: ['', Validators.required],
      universityName: ['', Validators.required],
      graduationYear: [null, Validators.required]
    });

    await this.loadProfileDetails();
    await this.loadUploadedDocuments();
    await this.syncProgressFromBackend();

    // Reset saved state on value changes
    this.personalForm.valueChanges.subscribe(() => {
      this.isPersonalSaved.set(false);
    });
    this.professionalForm.valueChanges.subscribe(() => {
      this.isProfessionalSaved.set(false);
    });
  }

  async loadUploadedDocuments() {
    try {
      const res = await firstValueFrom(this.candidateService.getProfileStatus());
      if (res.success && res.data.documentStatuses) {
        // Fetch all documents to get filenames
        this.candidateService.getDocuments().subscribe(docRes => {
           if (docRes.success) {
              const nameMap: Record<string, string> = {};
              docRes.data.forEach(d => {
                 nameMap[d.candidateDocumentType] = d.originalFilename;
              });
              this.uploadedFilenames.update(prev => ({ ...prev, ...nameMap }));
           }
        });

        const uploaded = Object.entries(res.data.documentStatuses)
          .filter(([_, status]) => status === 'APPROVED' || status === 'PENDING')
          .map(([type, _]) => type);
        this.uploadedDocTypes.set(uploaded);
      }
    } catch (err) {
      console.error('Failed to load uploaded documents', err);
    }
  }

  availableDocuments = computed(() => {
    const docs = [{ type: 'PASSPORT_SIZE_PHOTO', label: 'Recent Photograph', mandatory: false }];
    docs.push({ type: 'AADHAAR_CARD', label: 'Aadhaar Card', mandatory: true });

    if (this.personalForm.get('panNumber')?.value) {
      docs.push({ type: 'PAN_CARD', label: 'PAN Card', mandatory: true });
    }
    if (this.professionalForm.get('highestQualification')?.value) {
      docs.push({ type: 'HIGHEST_DEGREE_CERTIFICATE', label: 'Degree Certificate', mandatory: false });
    }
    if (this.professionalForm.get('totalExperienceYears')?.value > 0) {
      docs.push({ type: 'LAST_EXPERIENCE_LETTER', label: 'Experience Letter', mandatory: false });
    }
    return docs;
  });

  isDocUploaded(type: string): boolean {
    return this.uploadedDocTypes().includes(type);
  }

  allMandatoryDocsUploaded = computed(() => {
    return this.availableDocuments()
      .filter((d: { mandatory: boolean }) => d.mandatory)
      .every((d: { type: string }) => this.isDocUploaded(d.type));
  });

  async loadProfileDetails() {
    try {
      const res = await firstValueFrom(this.candidateService.getProfileDetails());
      if (res.success && res.data) {
        if (res.data.personalDetails) {
          this.existingDob = res.data.personalDetails.dateOfBirth;
          this.personalForm.patchValue(res.data.personalDetails);
          this.isPersonalSaved.set(true);
        }
        if (res.data.professionalDetails) {
          this.professionalForm.patchValue(res.data.professionalDetails);
          this.isProfessionalSaved.set(true);
        }
      }
    } catch (err) {
      console.error('Failed to load profile details', err);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0] ?? null;
    this.errorMessage.set('');

    if (file && !this.allowedUploadTypes.includes(file.type)) {
      this.selectedFile.set(null);
      this.errorMessage.set('Only PDF, JPG, and PNG files are accepted.');
      if (event.target) {
        event.target.value = '';
      }
      return;
    }

    if (file && file.size > this.maxUploadBytes) {
      this.selectedFile.set(null);
      this.errorMessage.set('File exceeds the 10MB maximum size limit.');
      if (event.target) {
        event.target.value = '';
      }
      return;
    }

    this.selectedFile.set(file);
  }

  async nextStep() {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.currentStep() === 1) {
      if (this.personalForm.invalid) {
        this.personalForm.markAllAsTouched();
        this.errorMessage.set('Please fill all required fields correctly.');
        return;
      }
      if (!this.isPersonalSaved()) {
        const saved = await this.savePersonalDetails(false);
        if (!saved) return;
      }
      this.currentStep.set(2);
    } else if (this.currentStep() === 2) {
      if (this.professionalForm.invalid) {
        this.professionalForm.markAllAsTouched();
        this.errorMessage.set('Please fill all required fields correctly.');
        return;
      }
      if (!this.isProfessionalSaved()) {
        const saved = await this.saveProfessionalDetails(false);
        if (!saved) return;
      }
      this.currentStep.set(3);
    } else if (this.currentStep() === 3) {
      if (!this.allMandatoryDocsUploaded()) {
        this.errorMessage.set('Please upload the mandatory Aadhaar Card before continuing.');
        return;
      }
      this.currentStep.set(4);
    }
  }

  async saveStep() {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.currentStep() === 1) {
      await this.savePersonalDetails(true);
    } else if (this.currentStep() === 2) {
      await this.saveProfessionalDetails(true);
    } else if (this.currentStep() === 3) {
      if (!this.selectedFile()) {
        this.errorMessage.set('Please select a file first.');
        return;
      }
      await this.uploadSelectedDocument(true);
    }
  }

  prevStep() {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
      this.errorMessage.set('');
      this.successMessage.set('');
    }
  }

  async submitApplication() {
    this.isLoading.set(true);
    try {
      await firstValueFrom(this.candidateService.submitProfile());
      this.currentStep.set(4);
      this.candidateService.notifyProfileUpdated();
      void this.syncProgressFromBackend(4);
      this.successMessage.set('Application submitted successfully!');
      setTimeout(() => this.router.navigate(['/candidate/dashboard']), 2000);
    } catch (err: any) {
      this.errorMessage.set(this.getRequestErrorMessage(err, 'Failed to submit application.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  triggerFilePicker(fileInput: HTMLInputElement) {
    fileInput.click();
  }

  getUploadButtonLabel() {
    const file = this.selectedFile();
    return file ? `Upload ${file.name}` : 'Choose file from system';
  }

  private async savePersonalDetails(showSuccess = true): Promise<boolean> {
    this.isLoading.set(true);
    try {
      await firstValueFrom(this.candidateService.updatePersonalDetails(this.buildPersonalDetailsPayload()));
      this.isPersonalSaved.set(true);
      if (showSuccess) this.successMessage.set('Personal details saved successfully.');
      this.candidateService.notifyProfileUpdated();
      void this.syncProgressFromBackend(this.currentStep());
      return true;
    } catch (err: any) {
      this.errorMessage.set(this.getRequestErrorMessage(err, 'Failed to save personal details.'));
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  private async saveProfessionalDetails(showSuccess = true): Promise<boolean> {
    this.isLoading.set(true);
    try {
      const payload = this.buildProfessionalDetailsPayload();
      await firstValueFrom(this.candidateService.updateProfessionalDetails(payload));
      this.isProfessionalSaved.set(true);
      if (showSuccess) this.successMessage.set('Professional details saved successfully.');
      this.candidateService.notifyProfileUpdated();
      void this.syncProgressFromBackend(this.currentStep());
      return true;
    } catch (err: any) {
      this.errorMessage.set(this.getRequestErrorMessage(err, 'Failed to save professional details.'));
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  private async uploadSelectedDocument(showSuccess = true): Promise<boolean> {
    this.isLoading.set(true);
    try {
      await firstValueFrom(this.candidateService.uploadDocument(this.selectedFile()!, this.documentType()));
      this.selectedFile.set(null);
      const input = this.fileInput();
      if (input?.nativeElement) {
        input.nativeElement.value = '';
      }
      await this.loadUploadedDocuments();
      if (showSuccess) this.successMessage.set('Document uploaded successfully.');
      this.candidateService.notifyProfileUpdated();
      void this.syncProgressFromBackend(this.currentStep());
      return true;
    } catch (err: any) {
      this.errorMessage.set(this.getRequestErrorMessage(err, 'Failed to upload document.'));
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  async uploadDoc(type: string, file: File) {
    if (!file) return;
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    
    try {
      await firstValueFrom(this.candidateService.uploadDocument(file, type));
      this.successMessage.set(`${type.replace(/_/g, ' ')} uploaded successfully.`);
      this.uploadedFilenames.update(prev => ({ ...prev, [type]: file.name }));
      await this.loadUploadedDocuments();
      this.candidateService.notifyProfileUpdated();
    } catch (err: any) {
      this.errorMessage.set(this.getRequestErrorMessage(err, 'Upload failed.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  private async syncProgressFromBackend(fallbackStep?: number) {
    try {
      const response = await firstValueFrom(this.candidateService.getProfileStatus());
      this.profileStatus.set(response.data);
      const backendStep = this.getStepFromStatus(response.data.onboardingStatus, response.data.isSubmitted);
      if (fallbackStep) {
        this.currentStep.update(s => Math.max(fallbackStep, backendStep));
      } else {
        this.currentStep.set(backendStep);
      }
    } catch {
      if (fallbackStep) {
        this.currentStep.update(s => Math.max(this.currentStep(), fallbackStep));
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
      case OnboardingStatus.DOCUMENTS_UNDER_REVIEW:
      case OnboardingStatus.DOCUMENTS_VERIFIED:
      case OnboardingStatus.SCREENING_PENDING:
      case OnboardingStatus.SCREENING_IN_PROGRESS:
      case OnboardingStatus.CASE_IN_REVIEW:
      case OnboardingStatus.SCREENING_CLEARED:
      case OnboardingStatus.FLAGGED:
      case OnboardingStatus.REJECTED:
      case OnboardingStatus.APPROVED:
        return 4;
      case OnboardingStatus.DOCUMENTS_REJECTED:
        return 3; // Force back to doc upload step
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
      panNumber: this.normalizeRequiredText(value.panNumber),
      adhaarNumber: this.normalizeRequiredText(value.adhaarNumber),
      addressLine1: this.normalizeRequiredText(value.addressLine1),
      addressCity: this.normalizeRequiredText(value.addressCity),
      addressState: this.normalizeRequiredText(value.addressState),
      addressPincode: this.normalizeRequiredText(value.addressPincode),
      addressCountry: this.normalizeOptionalText(value.addressCountry)
    };
  }

  private ageValidator(control: any) {
    if (!control.value) return null;
    const dob = new Date(control.value);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age >= 18 ? null : { underage: true };
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
    this.selectedFile.set(null);
    const input = this.fileInput();
    if (input?.nativeElement) {
      input.nativeElement.value = '';
    }
  }

  private getRequestErrorMessage(err: any, fallback: string): string {
    if (err?.name === 'TimeoutError') {
      return 'The server is taking too long to respond. Please try again.';
    }

    return err?.error?.message || fallback;
  }
}
