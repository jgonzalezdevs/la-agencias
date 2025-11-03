import { Routes } from '@angular/router';
import { StatisticsComponent } from './pages/dashboard/statistics/statistics.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { FormElementsComponent } from './pages/forms/form-elements/form-elements.component';
import { BasicTablesComponent } from './pages/tables/basic-tables/basic-tables.component';
import { BlankComponent } from './pages/blank/blank.component';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { LineChartComponent } from './pages/charts/line-chart/line-chart.component';
import { BarChartComponent } from './pages/charts/bar-chart/bar-chart.component';
import { AlertsComponent } from './pages/ui-elements/alerts/alerts.component';
import { AvatarElementComponent } from './pages/ui-elements/avatar-element/avatar-element.component';
import { BadgesComponent } from './pages/ui-elements/badges/badges.component';
import { ButtonsComponent } from './pages/ui-elements/buttons/buttons.component';
import { ImagesComponent } from './pages/ui-elements/images/images.component';
import { VideosComponent } from './pages/ui-elements/videos/videos.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/auth-pages/sign-up/sign-up.component';
import { CalenderComponent } from './pages/calender/calender.component';
import { ExportComponent } from './pages/export/export.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { UserManagementComponent } from './pages/user-management/user-management.component';
import { authGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  {
    path:'',
    component:AppLayoutComponent,
    canActivate: [authGuard],
    children:[
      {
        path: '',
        component: BlankComponent,
        pathMatch: 'full',
        title:
          'Dashboard | La Agencias - Panel de Administración',
      },
      {
        path:'statistics',
        component:StatisticsComponent,
        title:'Angular Statistics Dashboard | La Agencias - Panel de Administración'
      },
      {
        path:'calendar',
        component:CalenderComponent,
        title:'Angular Calender | La Agencias - Panel de Administración'
      },
      {
        path:'export',
        component:ExportComponent,
        title:'Export Reports | La Agencias - Panel de Administración'
      },
      {
        path:'users',
        component:UserManagementComponent,
        title:'Gestión de Usuarios | La Agencias - Panel de Administración'
      },
      {
        path:'form-elements',
        component:FormElementsComponent,
        title:'Angular Form Elements Dashboard | La Agencias - Panel de Administración'
      },
      {
        path:'basic-tables',
        component:BasicTablesComponent,
        title:'Angular Basic Tables Dashboard | La Agencias - Panel de Administración'
      },
      {
        path:'blank',
        component:BlankComponent,
        title:'Angular Blank Dashboard | La Agencias - Panel de Administración'
      },
      // support tickets
      {
        path:'invoice',
        component:InvoicesComponent,
        title:'Angular Invoice Details Dashboard | La Agencias - Panel de Administración'
      },
      {
        path:'line-chart',
        component:LineChartComponent,
        title:'Angular Line Chart Dashboard | La Agencias - Panel de Administración'
      },
      {
        path:'bar-chart',
        component:BarChartComponent,
        title:'Angular Bar Chart Dashboard | La Agencias - Panel de Administración'
      },
      {
        path:'alerts',
        component:AlertsComponent,
        title:'Angular Alerts Dashboard | La Agencias - Panel de Administración'
      },
      {
        path:'avatars',
        component:AvatarElementComponent,
        title:'Angular Avatars Dashboard | La Agencias - Panel de Administración'
      },
      {
        path:'badge',
        component:BadgesComponent,
        title:'Angular Badges Dashboard | La Agencias - Panel de Administración'
      },
      {
        path:'buttons',
        component:ButtonsComponent,
        title:'Angular Buttons Dashboard | La Agencias - Panel de Administración'
      },
      {
        path:'images',
        component:ImagesComponent,
        title:'Angular Images Dashboard | La Agencias - Panel de Administración'
      },
      {
        path:'videos',
        component:VideosComponent,
        title:'Angular Videos Dashboard | La Agencias - Panel de Administración'
      },
    ]
  },
  // auth pages
  {
    path:'signin',
    component:SignInComponent,
    title:'Angular Sign In Dashboard | La Agencias - Panel de Administración'
  },
  {
    path:'signup',
    component:SignUpComponent,
    title:'Angular Sign Up Dashboard | La Agencias - Panel de Administración'
  },
  {
    path:'forgot-password',
    component:ForgotPasswordComponent,
    title:'Forgot Password | La Agencias - Panel de Administración'
  },
  {
    path:'reset-password',
    component:ResetPasswordComponent,
    title:'Reset Password | La Agencias - Panel de Administración'
  },
  // error pages
  {
    path:'**',
    component:NotFoundComponent,
    title:'Angular NotFound Dashboard | La Agencias - Panel de Administración'
  },
];
