import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WatchlistService, WatchlistEntryResponseDto, WatchlistCategoryDto } from '../../services/watchlist.service';

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
  
  <!-- Header with Search & Filters -->
  <header class="bg-white border-b px-10 py-6 shrink-0 space-y-6 shadow-sm z-10">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-black text-slate-900 tracking-tight">Watchlist Database</h1>
        <p class="text-sm text-slate-500 font-medium mt-1">Manage and audit global restricted entities and flagged profiles</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-2xl">
          <span class="text-xs font-black text-indigo-600 uppercase tracking-widest">{{totalElements()}} Records</span>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-4">
      <!-- Search Bar -->
      <div class="flex-1 min-w-[300px] relative">
        <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
        <input type="text" 
          [(ngModel)]="searchQuery"
          (ngModelChange)="onSearchChange()"
          placeholder="Search by name, organization or ID number..."
          class="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-inner">
      </div>

      <!-- Category Filter -->
      <select 
        [(ngModel)]="selectedCategory"
        (change)="onFilterChange()"
        class="px-5 py-3 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-indigo-500 outline-none transition-all cursor-pointer">
        <option value="">All Categories</option>
        <option *ngFor="let cat of categories()" [value]="cat.categoryCode">{{cat.categoryName}}</option>
      </select>

      <!-- Severity Filter -->
      <div class="flex items-center p-1 bg-slate-100 rounded-2xl shrink-0">
        <button 
          *ngFor="let s of ['HIGH', 'MEDIUM', 'LOW']"
          (click)="toggleSeverity(s)"
          [class.bg-white]="selectedSeverity() === s"
          [class.text-indigo-600]="selectedSeverity() === s"
          [class.shadow-sm]="selectedSeverity() === s"
          class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:text-indigo-500">
          {{s}}
        </button>
        <button 
          (click)="selectedSeverity.set('')"
          *ngIf="selectedSeverity()"
          class="p-2 text-slate-400 hover:text-rose-500 transition-colors">
          <span class="material-symbols-outlined text-sm">close</span>
        </button>
      </div>

      <button (click)="resetFilters()" class="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all" title="Reset Filters">
        <span class="material-symbols-outlined">filter_alt_off</span>
      </button>
    </div>
  </header>

  <!-- Table Content -->
  <main class="flex-1 overflow-y-auto p-10 custom-scrollbar">
    <div *ngIf="isLoading()" class="flex flex-col items-center justify-center py-20 space-y-4">
      <div class="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing with database...</p>
    </div>

    <div *ngIf="!isLoading()" class="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <th class="p-6">Identity Details</th>
            <th class="p-6 text-center">Category</th>
            <th class="p-6">Source Info</th>
            <th class="p-6">Severity</th>
            <th class="p-6 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-50">
          <tr *ngFor="let entry of entries()" class="hover:bg-indigo-50/30 transition-all group">
            <td class="p-6">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors shrink-0">
                  {{(entry.primaryName || entry.organizationName || '?').charAt(0)}}
                </div>
                <div>
                  <div class="font-black text-slate-900 group-hover:text-indigo-900 transition-colors">{{entry.primaryName || entry.organizationName}}</div>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest" *ngIf="entry.panNumber">PAN: {{entry.panNumber}}</span>
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest" *ngIf="entry.aadhaarNumber">AADHAAR: {{entry.aadhaarNumber}}</span>
                  </div>
                </div>
              </div>
            </td>
            <td class="p-6 text-center">
              <span class="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] border border-slate-200">
                {{entry.categoryName}}
              </span>
            </td>
            <td class="p-6">
              <div class="text-xs font-bold text-slate-700">{{entry.sourceName}}</div>
              <div class="text-[10px] text-slate-400 font-medium mt-1">Credibility: {{entry.sourceCredibilityWeight}}/10</div>
            </td>
            <td class="p-6">
              <span class="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm" 
                [ngClass]="{
                  'bg-rose-50 text-rose-600 border-rose-200': entry.severity === 'CRITICAL' || entry.severity === 'HIGH',
                  'bg-orange-50 text-orange-600 border-orange-200': entry.severity === 'MEDIUM',
                  'bg-emerald-50 text-emerald-600 border-emerald-200': entry.severity === 'LOW'
                }">
                {{entry.severity}}
              </span>
            </td>
            <td class="p-6 text-right">
              <button (click)="viewDetails(entry)" class="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-slate-900/10 active:scale-95">
                View Evidence
              </button>
            </td>
          </tr>
          <tr *ngIf="entries().length === 0">
            <td colspan="5" class="p-20 text-center">
              <span class="material-symbols-outlined text-slate-200 text-6xl mb-4">search_off</span>
              <h3 class="text-lg font-black text-slate-900">No matches found</h3>
              <p class="text-slate-400 text-sm mt-1 font-medium">Try adjusting your filters or search query</p>
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- Numbered Pagination -->
      <footer class="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Showing <span class="text-slate-900">{{entries().length}}</span> of {{totalElements()}} entities
        </p>
        
        <div class="flex items-center gap-1">
          <button 
            (click)="loadEntries(currentPage() - 1)" 
            [disabled]="currentPage() === 0"
            class="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-30 transition-all">
            <span class="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          
          <div class="flex items-center px-2 gap-1">
            <button 
              *ngFor="let p of pageNumbers()"
              (click)="loadEntries(p)"
              [class.bg-indigo-600]="currentPage() === p"
              [class.text-white]="currentPage() === p"
              [class.shadow-indigo-900/20]="currentPage() === p"
              [class.shadow-lg]="currentPage() === p"
              [class.text-slate-600]="currentPage() !== p"
              [class.hover:bg-slate-200]="currentPage() !== p"
              class="w-10 h-10 flex items-center justify-center rounded-xl text-[10px] font-black transition-all">
              {{p + 1}}
            </button>
          </div>

          <button 
            (click)="loadEntries(currentPage() + 1)" 
            [disabled]="currentPage() >= totalPages() - 1"
            class="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-30 transition-all">
            <span class="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </footer>
    </div>
  </main>

  <!-- Evidence Modal (Same as before but refined) -->
  <div *ngIf="selectedEntry()" class="fixed inset-0 z-[100] flex items-center justify-center p-6">
    <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-md" (click)="closeModal()"></div>
    <div class="relative bg-white rounded-[40px] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
      <header class="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div>
          <h2 class="text-2xl font-black text-slate-900 tracking-tight">{{selectedEntry()?.primaryName || selectedEntry()?.organizationName}}</h2>
          <div class="flex items-center gap-3 mt-1">
            <span class="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest border">{{selectedEntry()?.categoryName}}</span>
            <span class="text-xs font-bold text-slate-400">ID: {{selectedEntry()?.panNumber || selectedEntry()?.aadhaarNumber || 'N/A'}}</span>
          </div>
        </div>
        <button (click)="closeModal()" class="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-90">
          <span class="material-symbols-outlined">close</span>
        </button>
      </header>
      
      <div class="p-8 overflow-y-auto flex-1 custom-scrollbar space-y-10">
        
        <!-- Summary Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="p-5 rounded-3xl bg-slate-50 border border-slate-100">
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Source Risk</p>
            <p class="text-lg font-black text-slate-900">{{selectedEntry()?.severity}}</p>
          </div>
          <div class="p-5 rounded-3xl bg-slate-50 border border-slate-100">
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Source Origin</p>
            <p class="text-lg font-black text-slate-900 truncate">{{selectedEntry()?.sourceName}}</p>
          </div>
          <div class="p-5 rounded-3xl bg-slate-50 border border-slate-100">
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nationality</p>
            <p class="text-lg font-black text-slate-900">{{selectedEntry()?.nationality || 'Global'}}</p>
          </div>
          <div class="p-5 rounded-3xl bg-slate-50 border border-slate-100">
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Since</p>
            <p class="text-lg font-black text-slate-900">{{selectedEntry()?.effectiveFrom | date:'mediumDate'}}</p>
          </div>
        </div>

        <!-- Evidence Docs -->
        <section>
          <h3 class="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
            <span class="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm">
              <span class="material-symbols-outlined text-sm">history_edu</span>
            </span>
            Official Evidence & Evidence Files
          </h3>
          <div class="grid grid-cols-1 gap-4">
            <div *ngIf="!selectedEntry()?.evidenceDocuments?.length" class="p-12 text-center rounded-[32px] border-2 border-dashed border-slate-100 bg-slate-50/50">
              <span class="material-symbols-outlined text-slate-200 text-4xl mb-2">inventory_2</span>
              <p class="text-slate-400 font-bold text-sm">No evidence files attached to this profile.</p>
            </div>
            
            <div *ngFor="let doc of selectedEntry()?.evidenceDocuments" class="flex items-center justify-between p-6 rounded-[28px] border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-lg transition-all group">
              <div class="flex items-center gap-5">
                <div class="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  <span class="material-symbols-outlined text-2xl">description</span>
                </div>
                <div>
                  <div class="font-black text-slate-900 text-lg">{{doc.documentTitle}}</div>
                  <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{{doc.documentType}} &bull; Uploaded {{doc.uploadedAt | date:'medium'}}</div>
                </div>
              </div>
              <a [href]="doc.cloudStorageKey" target="_blank" class="px-6 py-3 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-slate-900/10 active:scale-95">
                View Document
              </a>
            </div>
          </div>
        </section>

        <!-- Aliases -->
        <section *ngIf="selectedEntry()?.aliases?.length">
          <h3 class="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
             <span class="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center text-sm">
              <span class="material-symbols-outlined text-sm">alternate_email</span>
            </span>
            Known Aliases & Pseudonyms
          </h3>
          <div class="flex flex-wrap gap-3">
            <div *ngFor="let alias of selectedEntry()?.aliases" class="px-5 py-3 rounded-2xl bg-amber-50 border border-amber-100 flex items-center gap-3">
              <span class="w-2 h-2 rounded-full bg-amber-400"></span>
              <div>
                <span class="font-bold text-amber-900">{{alias.aliasName}}</span>
                <span class="text-[9px] font-black text-amber-500 uppercase tracking-widest ml-2">({{alias.aliasType}})</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Remarks -->
        <section *ngIf="selectedEntry()?.notes">
          <h3 class="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-4">Official Remarks</h3>
          <div class="p-8 rounded-[32px] bg-slate-950 text-slate-300 font-medium leading-relaxed shadow-2xl relative overflow-hidden">
             <span class="material-symbols-outlined absolute -right-4 -bottom-4 text-white/5 text-9xl">format_quote</span>
             {{selectedEntry()?.notes}}
          </div>
        </section>

      </div>
      
      <footer class="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end">
        <button (click)="closeModal()" class="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all shadow-xl shadow-slate-900/20 active:scale-95">
          Close Profile
        </button>
      </footer>
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
export class WatchlistComponent implements OnInit {
  private watchlistService = inject(WatchlistService);

  entries = signal<WatchlistEntryResponseDto[]>([]);
  categories = signal<WatchlistCategoryDto[]>([]);
  
  isLoading = signal(true);
  currentPage = signal(0);
  totalPages = signal(1);
  totalElements = signal(0);
  
  searchQuery = '';
  selectedCategory = '';
  selectedSeverity = signal<string>('');

  selectedEntry = signal<WatchlistEntryResponseDto | null>(null);

  constructor() {
    // Reload entries when severity signal changes
    effect(() => {
      this.selectedSeverity();
      this.loadEntries(0);
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.loadCategories();
    this.loadEntries(0);
  }

  loadCategories() {
    this.watchlistService.getCategories().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.categories.set(res.data);
        }
      }
    });
  }

  loadEntries(page: number) {
    if (page < 0 || (this.totalPages() > 0 && page >= this.totalPages() && page !== 0)) return;

    this.isLoading.set(true);
    this.watchlistService.getAllActiveEntries(
      page, 
      10, // records per page as requested
      this.searchQuery.trim() || undefined,
      this.selectedCategory || undefined,
      this.selectedSeverity() || undefined
    ).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.entries.set(res.data.content);
          this.currentPage.set(res.data.number);
          this.totalPages.set(res.data.totalPages);
          this.totalElements.set(res.data.totalElements);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onSearchChange() {
    this.loadEntries(0);
  }

  onFilterChange() {
    this.loadEntries(0);
  }

  toggleSeverity(severity: string) {
    if (this.selectedSeverity() === severity) {
      this.selectedSeverity.set('');
    } else {
      this.selectedSeverity.set(severity);
    }
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.selectedSeverity.set('');
    this.loadEntries(0);
  }

  pageNumbers() {
    const total = this.totalPages();
    const current = this.currentPage();
    const nums = [];
    
    // Show up to 5 page numbers around the current page
    let start = Math.max(0, current - 2);
    let end = Math.min(total - 1, start + 4);
    
    if (end - start < 4) {
      start = Math.max(0, end - 4);
    }
    
    for (let i = start; i <= end; i++) {
      nums.push(i);
    }
    return nums;
  }

  viewDetails(entry: WatchlistEntryResponseDto) {
    this.watchlistService.getEntryDetails(entry.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.selectedEntry.set(res.data);
        } else {
          this.selectedEntry.set(entry);
        }
      },
      error: () => this.selectedEntry.set(entry)
    });
  }

  closeModal() {
    this.selectedEntry.set(null);
  }
}
