import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { EditUserComponent } from './auth/edit-user/edit-user.component';

import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

import { DashboardComponent } from './features/dashboard/dashboard.component';
import { InventoryComponent } from './features/inventory/inventory.component';

import { PurchaseComponent } from './features/purchase/purchase.component';
import { AddPurchaseComponent } from './features/purchase/add-purchase/add-purchase.component';

import { UsageComponent } from './features/usage/usage.component';
import { AddUsageComponent } from './features/usage/add-usage/add-usage.component';

import { ItemsComponent } from './features/items/items.component';
import { AddItemsComponent } from './features/items/add-items/add-items.component';

import { MetricsComponent } from './features/metrics/metrics.component';
import { TotalUsageComponent } from './features/metrics/total-usage/total-usage.component';
import { DeptUsageComponent } from './features/metrics/dept-usage/dept-usage.component';

import { UserComponent } from './features/user/user.component';
import { AddUserComponent } from './features/user/add-user/add-user.component';

import { LogsComponent } from './features/logs/logs.component';

import { authGuard } from './core/guards/auth.guard';
import { UnauthorizedComponent } from './auth/unauthorized/unauthorized.component';

export const routes: Routes = [
  /* =====================================================
     AUTH
  ===================================================== */

  {
    path: '',
    component: LoginComponent,
  },

  {
    path: 'register',
    component: RegisterComponent,
  },

  /* =====================================================
     PROTECTED APP
  ===================================================== */

  {
    path: 'app',

    component: MainLayoutComponent,

    canActivate: [authGuard],
    canActivateChild: [authGuard],

    children: [
      /* DEFAULT */

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },

      /* DASHBOARD */

      {
        path: 'dashboard',
        component: DashboardComponent,
      },

      /* INVENTORY */

      {
        path: 'inventory',
        component: InventoryComponent,
      },

      /* ITEMS */

      {
        path: 'items',
        component: ItemsComponent,

        data: {
          roles: ['OWNER', 'MANAGER'],
        },
      },

      {
        path: 'items/add',
        component: AddItemsComponent,

        data: {
          roles: ['OWNER'],
        },
      },

      /* PURCHASE */

      {
        path: 'purchase',
        component: PurchaseComponent,
      },

      {
        path: 'purchase/add',
        component: AddPurchaseComponent,

        data: {
          roles: ['OWNER', 'MANAGER'],
        },
      },

      /* USAGE */

      {
        path: 'usage',
        component: UsageComponent,
      },

      {
        path: 'usage/add',
        component: AddUsageComponent,

        data: {
          roles: ['OWNER', 'MANAGER'],
        },
      },

      /* USERS */

      {
        path: 'user',
        component: UserComponent,

        data: {
          roles: ['OWNER', 'MANAGER'],
        },
      },

      {
        path: 'user/add',
        component: AddUserComponent,

        data: {
          roles: ['OWNER'],
        },
      },

      /* METRICS */

      {
        path: 'metrics',
        component: MetricsComponent,

        data: {
          roles: ['OWNER', 'MANAGER'],
        },
      },

      {
        path: 'metrics/total-usage',
        component: TotalUsageComponent,

        data: {
          roles: ['OWNER', 'MANAGER'],
        },
      },

      {
        path: 'metrics/dept-usage',
        component: DeptUsageComponent,

        data: {
          roles: ['OWNER', 'MANAGER'],
        },
      },

      /* LOGS */

      {
        path: 'logs',
        component: LogsComponent,

        data: {
          roles: ['OWNER'],
        },
      },

      /* PROFILE */

      {
        path: 'profile',
        component: EditUserComponent,
      },
    ],
  },

  /* =====================================================
     UNAUTHORIZED
  ===================================================== */

  {
    path: 'unauthorized',
    component: UnauthorizedComponent,
  },

  /* =====================================================
     INVALID ROUTES
  ===================================================== */

  {
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'enabled',
    }),
  ],

  exports: [RouterModule],
})
export class AppRoutingModule {}
