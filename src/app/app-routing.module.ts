import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './auth/login/login.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

import { DashboardComponent } from './features/dashboard/dashboard.component';
import { InventoryComponent } from './features/inventory/inventory.component';
import { PurchaseComponent } from './features/purchase/purchase.component';
import { UsageComponent } from './features/usage/usage.component';

import { authGuard } from './core/guards/auth.guard';
import { AddPurchaseComponent } from './features/purchase/add-purchase/add-purchase.component';
import { ViewPurchaseComponent } from './features/purchase/view-purchase/view-purchase.component';
import { AddUsageComponent } from './features/usage/add-usage/add-usage.component';
import { ViewUsageComponent } from './features/usage/view-usage/view-usage.component';
import { RegisterComponent } from './auth/register/register.component';
import { EditUserComponent } from './auth/edit-user/edit-user.component';
import { ItemsComponent } from './features/items/items.component';
import { AddItemsComponent } from './features/items/add-items/add-items.component';
import { ViewItemsComponent } from './features/items/view-items/view-items.component';
import { MetricsComponent } from './features/metrics/metrics.component';
import { TotalUsageComponent } from './features/metrics/total-usage/total-usage.component';
import { DeptUsageComponent } from './features/metrics/dept-usage/dept-usage.component';
import { UserComponent } from './features/user/user.component';
import { AddUserComponent } from './features/user/add-user/add-user.component';
import { ViewUserComponent } from './features/user/view-user/view-user.component';
import { LogsComponent } from './features/logs/logs.component';

export const routes: Routes = [
  // Login
  {
    path: '',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  // Protected Application Routes
  {
    path: 'app',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      // default redirect after login
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },

      {
        path: 'dashboard',
        component: DashboardComponent,
      },
      {
        path: 'inventory',
        component: InventoryComponent,
      },
      {
        path: 'purchase',
        component: PurchaseComponent,
      },
      {
        path: 'purchase/add',
        component: AddPurchaseComponent,
      },
      {
        path: 'purchase/view',
        component: ViewPurchaseComponent,
      },
      {
        path: 'usage',
        component: UsageComponent,
      },
      {
        path: 'usage/add',
        component: AddUsageComponent,
      },
      {
        path: 'usage/view',
        component: ViewUsageComponent,
      },
      {
        path: 'user',
        component: UserComponent,
      },
      {
        path: 'user/add',
        component: AddUserComponent,
      },
      {
        path: 'user/view',
        component: ViewUserComponent,
      },
      {
        path: 'items',
        component: ItemsComponent,
      },
      {
        path: 'items/add',
        component: AddItemsComponent,
        data: { roles: ['OWNER'] },
      },
      {
        path: 'items/view',
        component: ViewItemsComponent,
      },
      {
        path: 'metrics',
        component: MetricsComponent,
      },
      {
        path: 'logs',
        component: LogsComponent,
      },
      {
        path: 'metrics/total-usage',
        component: TotalUsageComponent,
      },
      {
        path: 'metrics/dept-usage',
        component: DeptUsageComponent,
      },
      {
        path: 'profile',
        component: EditUserComponent,
      },
    ],
  },

  // Handle invalid URLs
  {
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
