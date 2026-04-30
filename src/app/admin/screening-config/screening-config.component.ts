import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, SystemConfigDto } from '../../services/admin.service';

@Component({
  selector: 'app-screening-config',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './screening-config.component.html',
  styleUrl: './screening-config.component.css'
})
export class ScreeningConfigComponent implements OnInit {
  private adminService = inject(AdminService);

  configs = signal<SystemConfigDto[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.adminService.getSystemConfigs().subscribe({
      next: (response) => {
        this.configs.set(response.data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  displayValue(config: SystemConfigDto) {
    return config.isSensitive ? '********' : config.configValue;
  }
}
