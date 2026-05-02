import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/candidate/login', pathMatch: 'full' },
  {
    path: 'candidate/login',
    loadComponent: () => import('./candidate/login/login.component').then(c => c.CandidateLoginComponent)
  },
  {
    path: 'candidate/register',
    loadComponent: () => import('./candidate/register/register.component').then(c => c.CandidateRegisterComponent)
  },
  {
    path: 'staff/login',
    loadComponent: () => import('./staff/login/login.component').then(c => c.StaffLoginComponent)
  },
  {
    path: 'candidate',
    loadComponent: () => import('./layouts/candidate-layout/candidate-layout.component').then(c => c.CandidateLayoutComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['CANDIDATE'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./candidate/dashboard/dashboard.component').then(c => c.CandidateDashboardComponent) },
      { path: 'application-tracking', loadComponent: () => import('./candidate/application-tracking/application-tracking.component').then(c => c.ApplicationTrackingComponent) },
      { path: 'onboarding', loadComponent: () => import('./candidate/onboarding-form/onboarding-form.component').then(c => c.CandidateOnboardingFormComponent) },
      { path: 'reupload', loadComponent: () => import('./candidate/document-reupload/document-reupload.component').then(c => c.DocumentReuploadComponent) }
    ]
  },
  {
    path: 'admin',
    loadComponent: () => import('./layouts/admin-layout/admin-layout.component').then(c => c.AdminLayoutComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'SUPER_ADMIN'] },
    children: [
      { path: '', redirectTo: 'users', pathMatch: 'full' },
      { path: 'users', loadComponent: () => import('./admin/user-management/user-management.component').then(c => c.UserManagementComponent) },
      { path: 'screening', loadComponent: () => import('./admin/screening-config/screening-config.component').then(c => c.ScreeningConfigComponent) },
      { path: 'reports', loadComponent: () => import('./admin/reports/reports.component').then(c => c.ReportsComponent) },
      { path: 'audit', loadComponent: () => import('./admin/audit-timeline/audit-timeline.component').then(c => c.AuditTimelineComponent) },
      { path: 'approvals', loadComponent: () => import('./admin/approval-dashboard/approval-dashboard.component').then(c => c.ApprovalDashboardComponent) },
      { path: 'watchlist', loadComponent: () => import('./admin/watchlist/watchlist.component').then(c => c.WatchlistComponent) },
      { path: 'emergency', loadComponent: () => import('./admin/emergency-control/emergency-control.component').then(c => c.EmergencyControlComponent) }
    ]
  },
  {
    path: 'officer',
    loadComponent: () => import('./layouts/officer-layout/officer-layout.component').then(c => c.OfficerLayoutComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['L1_OFFICER', 'L2_OFFICER'] },
    children: [
      { path: '', redirectTo: 'alerts', pathMatch: 'full' },
      // L1 — Candidate verification queue (main landing)
      { path: 'alerts', loadComponent: () => import('./officer/alert-dashboard/alert-dashboard.component').then(c => c.AlertDashboardComponent) },
      // L1 — Document verification workspace (after claiming a candidate)
      { path: 'investigation/:id', loadComponent: () => import('./officer/investigation-workspace/investigation-workspace.component').then(c => c.InvestigationWorkspaceComponent) },
      // L1 — Open screening cases (claim + escalate to L2)
      { path: 'case-review', loadComponent: () => import('./officer/case-review/case-review.component').then(c => c.CaseReviewComponent) },
      // L1 — Screening alert board (claim alerts, convert to case, dismiss)
      { path: 'alert-board', loadComponent: () => import('./officer/alert-board/alert-board.component').then(c => c.AlertBoardComponent) },
      // L2 — Escalated cases (final approve/reject decision)
      { path: 'escalated', loadComponent: () => import('./officer/escalated-cases/escalated-cases.component').then(c => c.EscalatedCasesComponent) }
    ]
  }
];
