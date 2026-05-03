import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AuditLogDto } from '../../services/admin.service';

@Component({
  selector: 'app-audit-timeline',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
  
  <!-- Header -->
  <header class="bg-white border-b px-10 py-6 shrink-0 space-y-6 shadow-sm z-10">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-black text-slate-900 tracking-tight">System Audit logs</h1>
        <p class="text-sm text-slate-500 font-medium mt-1">Traceability and audit trail for every action performed across the platform</p>
      </div>
      <div class="flex items-center gap-3">
        <button (click)="loadLogs(0)" class="p-3 bg-slate-100 rounded-2xl text-slate-600 hover:text-indigo-600 transition-all">
          <span class="material-symbols-outlined block" [class.animate-spin]="isLoading()">refresh</span>
        </button>
        <div class="px-4 py-2 bg-slate-900 text-white rounded-2xl">
          <span class="text-xs font-black uppercase tracking-widest">{{totalElements()}} Events</span>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="flex flex-wrap items-center gap-4">
      <!-- Entity Type Filter -->
      <div class="min-w-[200px]">
        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Entity Module</label>
        <select 
          [(ngModel)]="filterEntityType"
          (change)="onFilterChange()"
          class="w-full px-5 py-3 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-indigo-500 outline-none transition-all cursor-pointer">
          <option value="">All Modules</option>
          <option value="CANDIDATE">Candidate</option>
          <option value="OFFICER">Officer</option>
          <option value="WATCHLIST">Watchlist</option>
          <option value="SYSTEM_CONFIG">System Config</option>
          <option value="APPROVAL">Approvals</option>
        </select>
      </div>

      <!-- Action Filter -->
      <div class="min-w-[200px]">
        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Action Type</label>
        <select 
          [(ngModel)]="filterAction"
          (change)="onFilterChange()"
          class="w-full px-5 py-3 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-indigo-500 outline-none transition-all cursor-pointer">
          <option value="">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="LOGIN">Login</option>
          <option value="VERIFY">Verify</option>
          <option value="REJECT">Reject</option>
          <option value="ESCALATE">Escalate</option>
        </select>
      </div>

      <!-- Performed By (User ID) -->
      <div class="min-w-[150px]">
        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Actor ID</label>
        <input type="number" 
          [(ngModel)]="filterPerformedBy"
          (ngModelChange)="onFilterChange()"
          placeholder="e.g. 102"
          class="w-full px-5 py-3 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all shadow-inner">
      </div>

      <div class="ml-auto pt-6">
        <button (click)="resetFilters()" class="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-2">
          <span class="material-symbols-outlined text-sm">filter_alt_off</span>
          Clear Filters
        </button>
      </div>
    </div>
  </header>

  <!-- Content -->
  <main class="flex-1 overflow-y-auto p-10 custom-scrollbar">
    <div *ngIf="isLoading()" class="flex flex-col items-center justify-center py-20 space-y-4">
      <div class="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
      <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Retrieving audit trail...</p>
    </div>

    <div *ngIf="!isLoading()" class="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <th class="p-6">Timestamp</th>
            <th class="p-6">Action</th>
            <th class="p-6">Status Change</th>
            <th class="p-6">Performed By</th>
            <th class="p-6">Remarks</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-50">
          <tr *ngFor="let log of logs()" class="hover:bg-slate-50 transition-all group">
            <td class="p-6 whitespace-nowrap">
              <div class="font-bold text-slate-900 text-xs">{{log.createdAt | date:'MMM d, yyyy'}}</div>
              <div class="text-[10px] text-slate-400 font-medium mt-0.5">{{log.createdAt | date:'h:mm:ss a'}}</div>
            </td>
            <td class="p-6">
              <span class="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all">
                {{log.action}}
              </span>
            </td>
            <td class="p-6">
              <div class="flex items-center gap-2" *ngIf="log.oldStatus || log.newStatus">
                <span class="text-[10px] font-bold text-slate-400">{{log.oldStatus || 'N/A'}}</span>
                <span class="material-symbols-outlined text-xs text-slate-300">arrow_forward</span>
                <span class="text-[10px] font-black text-indigo-600">{{log.newStatus || 'N/A'}}</span>
              </div>
              <span *ngIf="!log.oldStatus && !log.newStatus" class="text-[10px] text-slate-300 italic">No status change</span>
            </td>
            <td class="p-6">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-slate-500 text-[10px]">
                  {{log.performedBy}}
                </div>
                <div>
                  <div class="text-xs font-bold text-slate-700">ID #{{log.performedBy}}</div>
                  <div class="text-[9px] font-black text-slate-400 uppercase tracking-widest">{{log.actorRole}}</div>
                </div>
              </div>
            </td>
            <td class="p-6">
              <p class="text-xs text-slate-500 font-medium max-w-md line-clamp-1 group-hover:line-clamp-none transition-all">
                {{log.remarks || 'No additional remarks'}}
              </p>
            </td>
          </tr>
          <tr *ngIf="logs().length === 0">
            <td colspan="5" class="p-20 text-center">
              <span class="material-symbols-outlined text-slate-200 text-6xl mb-4">history_toggle_off</span>
              <h3 class="text-lg font-black text-slate-900">No logs found</h3>
              <p class="text-slate-400 text-sm mt-1 font-medium">The system hasn't recorded any matching audit events</p>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <footer class="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Displaying <span class="text-slate-900">{{logs().length}}</span> of {{totalElements()}} audit events
        </p>
        
        <div class="flex items-center gap-1">
          <button 
            (click)="loadLogs(currentPage() - 1)" 
            [disabled]="currentPage() === 0"
            class="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-30 transition-all shadow-sm">
            <span class="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          
          <div class="flex items-center px-2 gap-1">
            <button 
              *ngFor="let p of pageNumbers()"
              (click)="loadLogs(p)"
              [class.bg-slate-900]="currentPage() === p"
              [class.text-white]="currentPage() === p"
              [class.text-slate-600]="currentPage() !== p"
              [class.hover:bg-slate-200]="currentPage() !== p"
              class="w-10 h-10 flex items-center justify-center rounded-xl text-[10px] font-black transition-all">
              {{p + 1}}
            </button>
          </div>

          <button 
            (click)="loadLogs(currentPage() + 1)" 
            [disabled]="currentPage() >= totalPages() - 1"
            class="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-30 transition-all shadow-sm">
            <span class="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </footer>
    </div>
  </main>
</div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
  `]
})
export class AuditTimelineComponent implements OnInit {
  private adminService = inject(AdminService);

  logs = signal<AuditLogDto[]>([]);
  isLoading = signal(false);
  totalElements = signal(0);
  totalPages = signal(1);
  currentPage = signal(0);

  // Filters
  filterEntityType = '';
  filterAction = '';
  filterPerformedBy: number | undefined = undefined;

  ngOnInit() {
    this.loadLogs(0);
  }

  loadLogs(page: number) {
    this.isLoading.set(true);
    this.adminService.getAuditLogs(
      page, 
      10, // records per page
      this.filterEntityType || undefined,
      this.filterAction || undefined,
      this.filterPerformedBy
    ).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.logs.set(res.data.content);
          this.totalElements.set(res.data.totalElements);
          this.totalPages.set(res.data.totalPages);
          this.currentPage.set(res.data.number);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onFilterChange() {
    this.loadLogs(0);
  }

  resetFilters() {
    this.filterEntityType = '';
    this.filterAction = '';
    this.filterPerformedBy = undefined;
    this.loadLogs(0);
  }

  pageNumbers() {
    const total = this.totalPages();
    const current = this.currentPage();
    const nums = [];
    let start = Math.max(0, current - 2);
    let end = Math.min(total - 1, start + 4);
    if (end - start < 4) start = Math.max(0, end - 4);
    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  }
}
