import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AdminService, SystemConfigDto } from '../../services/admin.service';

type ConfigPresentation = 'toggle' | 'range' | 'select' | 'text' | 'number';

@Component({
  selector: 'app-screening-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './screening-config.component.html',
  styleUrl: './screening-config.component.css'
})
export class ScreeningConfigComponent implements OnInit {
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);

  configs = signal<SystemConfigDto[]>([]);
  isLoading = signal(true);
  isSaving = signal<Record<number, boolean>>({});
  errorMessage = signal('');
  successMessage = signal('');
  configErrors = signal<Record<number, string>>({});
  totalConfigs = computed(() => this.configs().length);
  sensitiveConfigs = computed(() => this.configs().filter(config => config.isSensitive).length);
  screeningConfigs = computed(() => this.configs().filter(config => config.category === 'SCREENING').length);
  storageConfigs = computed(() => this.configs().filter(config => config.category === 'STORAGE').length);

  form: FormGroup = this.fb.group({
    configs: this.fb.array([])
  });

  groupedConfigs = computed(() => {
    const groups: Record<string, SystemConfigDto[]> = {};
    for (const config of this.configs()) {
      const category = config.category || 'SYSTEM';
      groups[category] = groups[category] || [];
      groups[category].push(config);
    }
    return groups;
  });

  ngOnInit() {
    this.loadConfigs();
  }

  get configArray(): FormArray {
    return this.form.get('configs') as FormArray;
  }

  getConfigGroup(index: number): FormGroup {
    return this.configArray.at(index) as FormGroup;
  }

  loadConfigs() {
    this.isLoading.set(true);
    this.adminService.getSystemConfigs().subscribe({
      next: (response) => {
        const excludedKeys = [
          'STORAGE_PRESIGNED_URL_TTL_MINUTES',
          'AUTH_JWT_EXPIRATION_MS',
          'JWT_EXPIRATION_MS',
          'SCREENING_AUTO_REJECT_ENABLED'
        ];
        const filteredConfigs = response.data.filter(c => !excludedKeys.includes(c.configKey));
        this.configs.set(filteredConfigs);
        this.rebuildForm(filteredConfigs);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Unable to load system configs.');
        this.isLoading.set(false);
      }
    });
  }

  saveConfig(config: SystemConfigDto, index: number) {
    const control = this.configArray.at(index);
    const valueStr = String(control.get('configValue')?.value ?? '');
    const value = parseFloat(valueStr);
    // Clear previous errors
    this.configErrors.set({ ...this.configErrors(), [config.id]: '' });
    this.errorMessage.set('');

    // Range Validation (0.0 to 1.0)
    const rangeKeys = [
      'SCREENING_THRESHOLD_FUZZY',
      'SCREENING_MULT_NAME_ONLY',
      'SCREENING_MULT_NAME_ONE_ID',
      'SCREENING_MULT_NAME_TWO_IDS',
      'SCREENING_MULT_NAME_ORG',
      'SCREENING_MULT_NAME_ORG_DESIGNATION',
      'SCREENING_THRESHOLD_MEDIUM',
      'SCREENING_THRESHOLD_HIGH'
    ];

    if (rangeKeys.includes(config.configKey)) {
      if (isNaN(value) || value < 0.0 || value > 1.0) {
        this.configErrors.set({ ...this.configErrors(), [config.id]: 'Value must be between 0.0 and 1.0' });
        return;
      }
    }

    // Bonus Validation (0 to 30)
    if (config.configKey.includes('BONUS')) {
      if (isNaN(value) || value < 0 || value > 30) {
        this.configErrors.set({ ...this.configErrors(), [config.id]: 'Bonus must be between 0 and 30' });
        return;
      }
    }

    // SLA Validation (0 to 100)
    if (config.configKey.includes('SLA')) {
      if (isNaN(value) || value < 0 || value > 100) {
        this.configErrors.set({ ...this.configErrors(), [config.id]: 'SLA must be between 0 and 100 hours' });
        return;
      }
    }

    // High > Medium relationship check
    if (config.configKey === 'SCREENING_THRESHOLD_MEDIUM' || config.configKey === 'SCREENING_THRESHOLD_HIGH') {
      const mediumIdx = this.configs().findIndex(c => c.configKey === 'SCREENING_THRESHOLD_MEDIUM');
      const highIdx = this.configs().findIndex(c => c.configKey === 'SCREENING_THRESHOLD_HIGH');

      if (mediumIdx !== -1 && highIdx !== -1) {
        const mediumVal = config.configKey === 'SCREENING_THRESHOLD_MEDIUM' ? value : parseFloat(this.configArray.at(mediumIdx).get('configValue')?.value);
        const highVal = config.configKey === 'SCREENING_THRESHOLD_HIGH' ? value : parseFloat(this.configArray.at(highIdx).get('configValue')?.value);

        if (highVal <= mediumVal) {
          this.configErrors.set({ ...this.configErrors(), [config.id]: 'High Threshold must be > Medium Threshold' });
          return;
        }
      }
    }

    const payload = {
      configValue: valueStr,
      description: String(control.get('description')?.value ?? '')
    };

    this.isSaving.set({ ...this.isSaving(), [config.id]: true });
    this.errorMessage.set('');
    this.successMessage.set('');

    this.adminService.updateSystemConfig(config.id, payload).subscribe({
      next: (response) => {
        this.successMessage.set(response.message || 'Configuration change submitted for approval.');
        this.isSaving.set({ ...this.isSaving(), [config.id]: false });
        this.loadConfigs();
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Unable to submit config change.');
        this.isSaving.set({ ...this.isSaving(), [config.id]: false });
      }
    });
  }

  resetConfig(index: number) {
    const config = this.configs()[index];
    if (!config) return;
    const control = this.getConfigGroup(index);
    control.patchValue({
      configValue: config.configValue,
      description: config.description
    });
  }

  getPresentation(config: SystemConfigDto): ConfigPresentation {
    if (config.configKey === 'ACTIVE_SCREENING_STRATEGY') return 'select';
    if (config.configKey === 'SCREENING_AUTO_REJECT_ENABLED') return 'toggle';
    if (config.configType === 'BOOLEAN') return 'toggle';
    if (config.configKey.includes('THRESHOLD') || config.configKey.includes('MULT_NAME') || config.configKey.includes('BONUS') || config.configKey.includes('SLA')) return 'range';
    if (config.configType === 'INTEGER' || config.configType === 'DOUBLE' || config.configType === 'BIG_DECIMAL') return 'number';
    return 'text';
  }

  isBooleanValue(value: string): boolean {
    return ['true', 'false', '1', '0'].includes(String(value).toLowerCase());
  }

  getStrategyOptions() {
    return ['ADVANCED', 'BASIC'];
  }

  private rebuildForm(configs: SystemConfigDto[]) {
    const controls = configs.map(config => this.fb.group({
      configValue: [config.configValue],
      description: [config.description]
    }));

    this.form.setControl('configs', this.fb.array(controls) as unknown as FormArray);
  }
}
