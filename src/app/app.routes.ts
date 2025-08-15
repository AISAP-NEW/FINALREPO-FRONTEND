import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'landing',
    pathMatch: 'full'
  },
  {
    path: 'landing',
    loadComponent: () => import('./pages/landing/landing.page').then(m => m.LandingPage)
  },
  {
    path: 'api/auth/GitHubAuth/callback',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.component')
      .then(m => m.RegisterComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./auth/forgot-password/forgot-password.component')
      .then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./auth/reset-password/reset-password.component')
      .then(m => m.ResetPasswordComponent)
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home.page')
          .then(m => m.HomePage)
      },
      {
        path: 'projects',
        loadComponent: () => import('./pages/projects/projects.component')
          .then(m => m.ProjectsComponent)
      },
      {
        path: 'clients',
        loadComponent: () => import('./pages/clients/clients.component')
          .then(m => m.ClientsComponent)
      },
      {
        path: 'datasets',
        loadComponent: () => import('./pages/datasets/datasets.page')
          .then(m => m.DatasetsComponent)
      },
      {
        path: 'experiments',
        loadComponent: () => import('./pages/experiments/experiments.page')
          .then(m => m.ExperimentsPage)
      },
      {
        path: 'training-dashboard',
        loadComponent: () => import('./pages/training-dashboard/training-dashboard.component')
          .then(m => m.TrainingDashboardComponent)
      },
      {
        path: 'training-dashboard/:trainSessionId',
        loadComponent: () => import('./pages/training-dashboard/training-dashboard.component')
          .then(m => m.TrainingDashboardComponent)
      },
      {
        path: 'datasets/new',
        loadComponent: () => import('./pages/dataset-form/dataset-form.page')
          .then(m => m.DatasetFormPage)
      },
      {
        path: 'datasets/:id',
        loadComponent: () => import('./pages/dataset-details/dataset-details.page').then(m => m.DatasetDetailsPage),
        canActivate: [AuthGuard]
      },
      // Alias for backward compatibility
      {
        path: 'datasets/:id/details',
        redirectTo: 'datasets/:id',
        pathMatch: 'full'
      },
      {
        path: 'datasets/:id/preprocess',
        loadComponent: () => import('./pages/dataset-preprocess/dataset-preprocess.page')
          .then(m => m.DatasetPreprocessPage)
      },
      {
        path: 'datasets/:id/validate',
        loadComponent: () => import('./pages/dataset-validate/dataset-validate.page')
          .then(m => m.DatasetValidatePage)
      },
      {
        path: 'datasets/:id/split',
        loadComponent: () => import('./pages/dataset-split/dataset-split.page')
          .then(m => m.DatasetSplitPage)
      },
      {
        path: 'developers',
        loadComponent: () => import('./pages/developers/developers.component')
          .then(m => m.DevelopersComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/reports/reports.component')
          .then(m => m.ReportsComponent)
      },
      {
        path: 'db-maintenance',
        loadComponent: () => import('./pages/database-maintenance.page').then(m => m.DatabaseMaintenancePage)
      },
      {
        path: 'project-access-requests',
        loadComponent: () => import('./pages/project-access-requests/project-access-requests.component')
          .then(m => m.ProjectAccessRequestsComponent),
        canActivate: [RolesGuard],
        data: { roles: ['Developer', 'LeadDeveloper', 'Lead Developer'] }
      },
      {
        path: 'role-promotion-requests',
        loadComponent: () => import('./pages/role-promotion-requests/role-promotion-requests.component')
          .then(m => m.RolePromotionRequestsComponent),
        canActivate: [RolesGuard],
        data: { roles: ['Admin', 'Developer', 'LeadDeveloper', 'Lead Developer'] }
      },
      {
        path: 'taxonomy-management',
        loadComponent: () => import('./pages/taxonomy-management/taxonomy-management.page').then(m => m.TaxonomyManagementPage),
        canActivate: [RolesGuard],
        data: { roles: ['IT Admin', 'Lead Developer', 'LeadDeveloper', 'Developer', 'Admin'] }
      },
      {
        path: 'notifications',
        loadComponent: () => import('./pages/notifications/notifications.component')
          .then(m => m.NotificationsComponent)
      },
      {
        path: 'access-requests',
        loadComponent: () => import('./pages/projects/access-requests/access-requests.component')
          .then(m => m.AccessRequestsComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'models',
        loadComponent: () => import('./pages/models/models.page')
          .then(m => m.ModelsPage)
      },
      {
        path: 'models/upload',
        loadComponent: () => import('./pages/model-upload/model-upload.page')
          .then(m => m.ModelUploadPage)
      },
      {
        path: 'models/:id',
        loadComponent: () => import('./pages/model-details/model-details.page')
          .then(m => m.ModelDetailsPage)
      },
      {
        path: 'notebook/:modelId',
        loadComponent: () => import('./notebook-panel/notebook-panel.component')
          .then(m => m.NotebookPanelComponent)
      },
      {
        path: 'deployments',
        loadComponent: () => import('./pages/deployments/deployments.page')
          .then(m => m.DeploymentsPage)
      },
      {
        path: 'training-sessions',
        loadComponent: () => import('./pages/training-sessions/training-sessions.page')
          .then(m => m.TrainingSessionsPage)
      },
      {
        path: 'calendar-models',
        loadComponent: () => import('./pages/calendar-models/calendar-models.page').then(m => m.CalendarModelsPage)
      },
      {
        path: 'experiments',
        loadComponent: () => import('./pages/experiments/experiments.page')
          .then(m => m.ExperimentsPage)
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.page')
          .then(m => m.ProfilePage)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
  
];
