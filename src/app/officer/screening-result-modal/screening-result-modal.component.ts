import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfficerService, ScreeningResult } from '../../services/officer.service';

@Component({
  selector: 'app-screening-result-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="show" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6" (click)="close()">
      <div class="bg-white rounded-[32px] max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h2 class="text-2xl font-black text-slate-900 tracking-tight">Screening Analysis</h2>
            <p class="text-slate-500 text-sm font-medium">Detailed watchlist match results for Candidate #{{candidateId}}</p>
          </div>
          <button (click)="close()" class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all flex items-center justify-center">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div *ngIf="isLoading()" class="py-20 flex flex-col items-center justify-center space-y-4">
            <div class="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Fetching screening data...</p>
          </div>

          <div *ngIf="!isLoading() && result()" class="space-y-8 animate-in fade-in duration-500">
            <!-- Risk Overview -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="p-6 rounded-[24px] bg-slate-50 border border-slate-100">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Overall Risk Score</p>
                <div class="flex items-end gap-2">
                  <span class="text-4xl font-black text-slate-900">{{formatValue(result()?.riskScore)}}</span>
                  <span class="text-xs font-bold mb-1" [ngClass]="getRiskLevelClass(result()?.riskLevel || '')">
                    {{result()?.riskLevel}}
                  </span>
                </div>
              </div>
              <div class="p-6 rounded-[24px] bg-slate-50 border border-slate-100">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Matches Found</p>
                <span class="text-4xl font-black text-slate-900">{{result()?.matches?.length || 0}}</span>
              </div>
              <div class="p-6 rounded-[24px] bg-slate-50 border border-slate-100">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Entries Checked</p>
                <span class="text-4xl font-black text-slate-900">{{result()?.totalEntriesChecked}}</span>
              </div>
            </div>

            <!-- Matches List -->
            <div class="space-y-4">
              <h3 class="text-sm font-black text-slate-900 uppercase tracking-widest">Matching Entities</h3>
              
              <div *ngIf="!result()?.matches?.length" class="py-12 text-center bg-emerald-50 border-2 border-dashed border-emerald-100 rounded-[28px]">
                <span class="material-symbols-outlined text-emerald-300 text-4xl mb-2">verified</span>
                <p class="text-emerald-700 font-bold">No Watchlist Matches Found</p>
                <p class="text-emerald-600/60 text-xs">This candidate is clear of any sanctions or PEP flags.</p>
              </div>

              <div *ngFor="let match of result()?.matches" class="p-6 bg-white border border-slate-100 rounded-[24px] hover:border-indigo-200 transition-all shadow-sm">
                <div class="flex items-start justify-between gap-4 mb-4">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" 
                      [ngClass]="match.watchlistSeverity === 'CRITICAL' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'">
                      <span class="material-symbols-outlined">{{match.watchlistSeverity === 'CRITICAL' ? 'gavel' : 'warning'}}</span>
                    </div>
                    <div>
                      <h4 class="font-black text-slate-900">{{match.watchlistPrimaryName}}</h4>
                      <div class="flex items-center gap-2 mt-1">
                        <span class="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase tracking-widest">{{match.watchlistCategory}}</span>
                        <span class="text-[10px] text-slate-400 font-medium">Source: {{match.watchlistSourceName}}</span>
                      </div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-lg font-black text-slate-900">{{formatPercent(match.similarityScore)}}</div>
                    <div class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Match Score</div>
                  </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                  <div>
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Candidate Data</p>
                    <p class="text-xs font-bold text-slate-700">{{match.candidateFieldValue}}</p>
                  </div>
                  <div>
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Watchlist Record</p>
                    <p class="text-xs font-bold text-slate-700">{{match.watchlistFieldValue}}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
          <button (click)="close()" class="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all shadow-lg shadow-slate-900/10">
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
  `]
})
export class ScreeningResultModalComponent {
  @Input() show = false;
  @Input() candidateId: number | null = null;
  @Output() closed = new EventEmitter<void>();

  private officerService = inject(OfficerService);
  
  result = signal<ScreeningResult | null>(null);
  isLoading = signal(false);

  ngOnChanges() {
    if (this.show && this.candidateId) {
      this.loadResult();
    }
  }

  loadResult() {
    if (!this.candidateId) return;
    this.isLoading.set(true);
    this.officerService.getLatestScreeningResult(this.candidateId).subscribe({
      next: (res) => {
        this.result.set(res.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.result.set(null);
        this.isLoading.set(false);
      }
    });
  }

  close() {
    this.show = false;
    this.closed.emit();
  }

  formatPercent(val: any): string {
    if (val === undefined || val === null) return '0%';
    const num = parseFloat(val);
    if (isNaN(num)) return '0%';
    // If val is <= 1, assume it's a decimal (0.93), so multiply by 100
    const percent = num <= 1 ? num * 100 : num;
    return percent.toFixed(2) + '%';
  }

  formatValue(val: any): string {
    if (val === undefined || val === null) return '0';
    const num = parseFloat(val);
    return isNaN(num) ? '0' : num.toFixed(1);
  }

  getRiskLevelClass(level: string): string {
    switch (level.toUpperCase()) {
      case 'CRITICAL': return 'text-red-600';
      case 'HIGH': return 'text-orange-600';
      case 'MEDIUM': return 'text-amber-600';
      default: return 'text-emerald-600';
    }
  }
}
