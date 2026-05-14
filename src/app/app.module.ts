import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { TopbarComponent } from './layout/topbar/topbar.component';
import { LoginComponent } from './auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { InventoryComponent } from './features/inventory/inventory.component';
import { PurchaseComponent } from './features/purchase/purchase.component';
import { UsageComponent } from './features/usage/usage.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AddPurchaseComponent } from './features/purchase/add-purchase/add-purchase.component';
import { AddUsageComponent } from './features/usage/add-usage/add-usage.component';
import { RegisterComponent } from './auth/register/register.component';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { EditUserComponent } from './auth/edit-user/edit-user.component';
import { AddItemsComponent } from './features/items/add-items/add-items.component';
import { ItemsComponent } from './features/items/items.component';
import { TotalUsageComponent } from './features/metrics/total-usage/total-usage.component';
import { DeptUsageComponent } from './features/metrics/dept-usage/dept-usage.component';
import { MetricsComponent } from './features/metrics/metrics.component';
import { PageHeaderComponent } from './shared/components/page-header/page-header.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { AddUserComponent } from './features/user/add-user/add-user.component';
import { UserComponent } from './features/user/user.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { LogsComponent } from './features/logs/logs.component';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { UnauthorizedComponent } from './auth/unauthorized/unauthorized.component';
@NgModule({
  declarations: [
    AppComponent,
    MainLayoutComponent,
    SidebarComponent,
    TopbarComponent,
    LoginComponent,
    DashboardComponent,
    InventoryComponent,
    PurchaseComponent,
    UsageComponent,
    AddPurchaseComponent,
    UsageComponent,
    AddUsageComponent,
    RegisterComponent,
    EditUserComponent,
    AddItemsComponent,
    ItemsComponent,
    TotalUsageComponent,
    DeptUsageComponent,
    MetricsComponent,
    PageHeaderComponent,
    AddUserComponent,
    UserComponent,
    LogsComponent,
    UnauthorizedComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatListModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    HttpClientModule,
    MatPaginatorModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatButtonToggleModule,
    MatSnackBarModule,
    MatSlideToggleModule,
    NgxSkeletonLoaderModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
