import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WatchlistService, WatchlistEntryResponseDto, WatchlistCategoryDto } from '../../services/watchlist.service';

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 text-slate-900">
  <header class="h-20 bg-white border-b flex items-center justify-between px-10 shrink-0">
    <div>
      <h1 class="text-xl font-bold tracking-tight">Watchlist Database</h1>
      <p class="text-sm text-slate-500">Global registry of flagged individuals and entities</p>
    </div>
    <div class="flex gap-4">
      <select class="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" (change)="onCategoryChange($event)">
        <option value="">All Categories</option>
        <option *ngFor="let cat of categories()" [value]="cat.categoryCode">{{cat.categoryName}}</option>
      </select>
    </div>
  </header>

  <main class="flex-1 overflow-y-auto p-10">
    <div *ngIf="isLoading()" class="text-sm text-slate-500 font-medium">Loading records...</div>
    
    <div *ngIf="!isLoading()" class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-50/80 border-b border-slate-200 text-sm font-semibold text-slate-600">
            <th class="p-5 font-semibold">Name / ID</th>
            <th class="p-5 font-semibold">Category</th>
            <th class="p-5 font-semibold">Source</th>
            <th class="p-5 font-semibold">Severity</th>
            <th class="p-5 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr *ngFor="let entry of filteredEntries()" class="hover:bg-slate-50/50 transition-colors">
            <td class="p-5">
              <div class="font-bold text-slate-900">{{entry.primaryName || entry.organizationName}}</div>
              <div class="text-xs text-slate-500 mt-1" *ngIf="entry.panNumber || entry.aadhaarNumber">
                ID: {{entry.panNumber || entry.aadhaarNumber}}
              </div>
            </td>
            <td class="p-5">
              <span class="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200">
                {{entry.categoryName}}
              </span>
            </td>
            <td class="p-5">
              <div class="text-sm font-medium">{{entry.sourceName}}</div>
              <div class="text-xs text-slate-400 mt-1">Weight: {{entry.sourceCredibilityWeight}}</div>
            </td>
            <td class="p-5">
              <span class="px-3 py-1 rounded-lg text-xs font-bold border" 
                [ngClass]="{
                  'bg-rose-50 text-rose-700 border-rose-200': entry.severity === 'CRITICAL' || entry.severity === 'HIGH',
                  'bg-amber-50 text-amber-700 border-amber-200': entry.severity === 'MEDIUM',
                  'bg-slate-50 text-slate-700 border-slate-200': entry.severity === 'LOW'
                }">
                {{entry.severity}}
              </span>
            </td>
            <td class="p-5">
              <button (click)="viewDetails(entry)" class="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors">
                View Evidence
              </button>
            </td>
          </tr>
          <tr *ngIf="entries().length === 0">
            <td colspan="5" class="p-10 text-center text-slate-500">No records found.</td>
          </tr>
        </tbody>
      </table>
      
      <!-- Pagination -->
      <div class="p-5 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
        <span class="text-sm text-slate-500">Showing page {{currentPage() + 1}} of {{totalPages()}}</span>
        <div class="flex gap-2">
          <button (click)="loadEntries(currentPage() - 1)" [disabled]="currentPage() === 0" class="px-4 py-2 border border-slate-200 bg-white rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-slate-50 transition-colors">Previous</button>
          <button (click)="loadEntries(currentPage() + 1)" [disabled]="currentPage() >= totalPages() - 1" class="px-4 py-2 border border-slate-200 bg-white rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-slate-50 transition-colors">Next</button>
        </div>
      </div>
    </div>
  </main>

  <!-- Modal for Evidence & Details -->
  <div *ngIf="selectedEntry()" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
    <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" (click)="closeModal()"></div>
    <div class="relative bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
      <header class="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div>
          <h2 class="text-xl font-bold text-slate-900">{{selectedEntry()?.primaryName || selectedEntry()?.organizationName}}</h2>
          <p class="text-sm text-slate-500 mt-1">ID: {{selectedEntry()?.panNumber || selectedEntry()?.aadhaarNumber || 'N/A'}}</p>
        </div>
        <button (click)="closeModal()" class="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200/50 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors">
          <span class="material-symbols-outlined">close</span>
        </button>
      </header>
      
      <div class="p-6 overflow-y-auto flex-1 space-y-8">
        
        <section>
          <h3 class="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">Profile Details</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span class="text-xs font-medium text-slate-500 block mb-1">Category</span>
              <span class="font-bold text-slate-900">{{selectedEntry()?.categoryName}}</span>
            </div>
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span class="text-xs font-medium text-slate-500 block mb-1">Source</span>
              <span class="font-bold text-slate-900">{{selectedEntry()?.sourceName}}</span>
            </div>
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span class="text-xs font-medium text-slate-500 block mb-1">Severity</span>
              <span class="font-bold text-slate-900">{{selectedEntry()?.severity}}</span>
            </div>
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span class="text-xs font-medium text-slate-500 block mb-1">Nationality</span>
              <span class="font-bold text-slate-900">{{selectedEntry()?.nationality || 'N/A'}}</span>
            </div>
          </div>
        </section>

        <section *ngIf="selectedEntry()?.aliases?.length">
          <h3 class="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">Known Aliases</h3>
          <div class="flex flex-wrap gap-2">
            <span *ngFor="let alias of selectedEntry()?.aliases" class="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 text-sm font-medium">
              {{alias.aliasName}} ({{alias.aliasType}})
            </span>
          </div>
        </section>

        <section *ngIf="selectedEntry()?.evidenceDocuments?.length">
          <h3 class="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">Evidence Documents</h3>
          <div class="space-y-3">
            <div *ngFor="let doc of selectedEntry()?.evidenceDocuments" class="flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors group">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined">description</span>
                </div>
                <div>
                  <div class="font-bold text-slate-900">{{doc.documentTitle}}</div>
                  <div class="text-xs text-slate-500 mt-1">{{doc.documentType}} • Uploaded: {{doc.uploadedAt | date}}</div>
                </div>
              </div>
              <a [href]="doc.cloudStorageKey" target="_blank" class="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">View</a>
            </div>
          </div>
        </section>

      </div>
    </div>
  </div>
</div>
  `
})
export class WatchlistComponent implements OnInit {
  private watchlistService = inject(WatchlistService);

  entries = signal<WatchlistEntryResponseDto[]>([]);
  categories = signal<WatchlistCategoryDto[]>([
    { categoryCode: 'FRAUD', categoryName: 'Fraud', description: '' },
    { categoryCode: 'CRIMINAL', categoryName: 'Criminal', description: '' },
    { categoryCode: 'BLACKLIST', categoryName: 'Blacklist', description: '' },
    { categoryCode: 'PEP', categoryName: 'PEP', description: '' },
    { categoryCode: 'EMPLOYMENT_ISSUE', categoryName: 'Employment Issue', description: '' },
    { categoryCode: 'PROFESSIONAL_MISCONDUCT', categoryName: 'Professional Misconduct', description: '' }
  ]);

  isLoading = signal(true);
  currentPage = signal(0);
  totalPages = signal(1);
  selectedCategory = signal<string>('');

  selectedEntry = signal<WatchlistEntryResponseDto | null>(null);

  filteredEntries = computed(() => {
    const cat = this.selectedCategory();
    if (!cat) return this.entries();
    return this.entries().filter(e => e.categoryCode === cat);
  });

  ngOnInit() {
    this.loadEntries(0);
  }



  loadEntries(page: number) {
    if (page < 0 || (this.totalPages() > 0 && page >= this.totalPages() && page !== 0)) return;

    this.isLoading.set(true);
    this.watchlistService.getAllActiveEntries(page, 20).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.entries.set(res.data.content);
          this.currentPage.set(res.data.number);
          this.totalPages.set(res.data.totalPages);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onCategoryChange(event: any) {
    this.selectedCategory.set(event.target.value);
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
