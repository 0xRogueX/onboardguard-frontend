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
    path: 'staff/login',
    loadComponent: () => import('./staff/login/login.component').then(c => c.StaffLoginComponent)
  },
  {
    path: 'candidate',
    loadComponent: () => import('./layouts/candidate-layout/candidate-layout.component').then(c => c.CandidateLayoutComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['CANDIDATE'] },
    children: [
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
      { path: 'users', loadComponent: () => import('./admin/user-management/user-management.component').then(c => c.UserManagementComponent) },
      { path: 'screening', loadComponent: () => import('./admin/screening-config/screening-config.component').then(c => c.ScreeningConfigComponent) },
      { path: 'approvals', loadComponent: () => import('./admin/approval-dashboard/approval-dashboard.component').then(c => c.ApprovalDashboardComponent) },
      { path: 'emergency', loadComponent: () => import('./admin/emergency-control/emergency-control.component').then(c => c.EmergencyControlComponent) }
    ]
  },
  {
    path: 'officer',
    loadComponent: () => import('./layouts/officer-layout/officer-layout.component').then(c => c.OfficerLayoutComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['L1_OFFICER', 'L2_OFFICER'] },
    children: [
      { path: 'alerts', loadComponent: () => import('./officer/alert-dashboard/alert-dashboard.component').then(c => c.AlertDashboardComponent) },
      { path: 'investigation/:id', loadComponent: () => import('./officer/investigation-workspace/investigation-workspace.component').then(c => c.InvestigationWorkspaceComponent) },
      { path: 'case-review', loadComponent: () => import('./officer/case-review/case-review.component').then(c => c.CaseReviewComponent) },
      { path: 'escalated', loadComponent: () => import('./officer/escalated-cases/escalated-cases.component').then(c => c.EscalatedCasesComponent) }
    ]
  }
];
