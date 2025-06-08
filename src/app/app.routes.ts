import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component')
      .then(m => m.LoginComponent)
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
        path: 'datasets/new',
        loadComponent: () => import('./pages/dataset-form/dataset-form.page')
          .then(m => m.DatasetFormPage)
      },
      {
        path: 'datasets/:id',
        loadComponent: () => import('./pages/dataset-detail/dataset-detail.page')
          .then(m => m.DatasetDetailPage)
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
        path: 'access-levels',
        loadComponent: () => import('./pages/access-levels/access-levels.component')
          .then(m => m.AccessLevelsComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./pages/notifications/notifications.component')
          .then(m => m.NotificationsComponent)
      },
      {
        path: 'access-requests',
        loadComponent: () => import('./pages/projects/access-requests/access-requests.component').then(m => m.AccessRequestsComponent),
        canActivate: [AuthGuard]
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
