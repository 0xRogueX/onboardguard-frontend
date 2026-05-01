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
        this.configs.set(response.data);
        this.rebuildForm(response.data);
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
    const payload = {
      configValue: String(control.get('configValue')?.value ?? ''),
      description: String(control.get('description')?.value ?? '')
    };

    this.isSaving.set({ ...this.isSaving(), [config.id]: true });
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
    if (config.configKey.includes('THRESHOLD') || config.configKey.includes('SLA')) return 'range';
    if (config.configType === 'INTEGER' || config.configType === 'DOUBLE' || config.configType === 'BIG_DECIMAL') return 'number';
    return 'text';
  }

  isBooleanValue(value: string): boolean {
    return ['true', 'false', '1', '0'].includes(String(value).toLowerCase());
  }

  getStrategyOptions() {
    return ['BASIC', 'ADVANCED'];
  }

  private rebuildForm(configs: SystemConfigDto[]) {
    const controls = configs.map(config => this.fb.group({
      configValue: [config.configValue],
      description: [config.description]
    }));

    this.form.setControl('configs', this.fb.array(controls) as unknown as FormArray);
  }
}
