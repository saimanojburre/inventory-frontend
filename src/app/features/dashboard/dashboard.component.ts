import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Chart } from 'chart.js/auto';
import { AuthService } from 'src/app/core/services/auth.service';
import { DashboardCacheService } from 'src/app/core/services/dashboard-cache.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  /* =========================================================
     STATS
  ========================================================= */

  stats = {
    inventoryValue: 0,
    purchases: 0,
    usage: 0,
    lowStock: 0,
  };

  /* =========================================================
     CHARTS
  ========================================================= */

  departmentChart!: Chart;
  categoryChart!: Chart;
  weeklyChart!: Chart;

  /* =========================================================
     UI STATE
  ========================================================= */

  greetingMessage = '';
  loading = true;
  items: any[] = [];
  lowStockItems: any[] = [];

  /* =========================================================
     CONSTRUCTOR
  ========================================================= */

  constructor(
    private authService: AuthService,
    private router: Router,
    private dashboardCache: DashboardCacheService,
  ) {}

  /* =========================================================
     INIT
  ========================================================= */

  ngOnInit(): void {
    this.setGreeting();

    this.dashboardCache.loadIfNeeded();

    this.dashboardCache.dashboard$.subscribe((data) => {
      if (!data) return;
      this.stats = data.stats;

      this.items = data.items || [];

      this.lowStockItems = this.items.filter((item: any) => {
        return item.quantity <= item.minStock;
      });
      setTimeout(() => {
        this.destroyCharts();
        this.createDepartmentChart(data.usage, data.itemMap);

        this.createCategoryChart(data.usage, data.itemMap);

        this.createWeeklyTrend(data.usage, data.itemMap);
      });

      this.loading = false;
    });
  }

  /* =========================================================
     DESTROY
  ========================================================= */

  ngOnDestroy(): void {
    this.departmentChart?.destroy();
    this.categoryChart?.destroy();
    this.weeklyChart?.destroy();
  }

  /* =========================================================
     GREETING
  ========================================================= */

  setGreeting(): void {
    const hour = new Date().getHours();

    const greeting =
      hour < 12
        ? 'Good Morning'
        : hour < 17
          ? 'Good Afternoon'
          : 'Good Evening';

    this.greetingMessage = `${greeting}, ${this.authService.getUsername()} 👋`;
  }
  /* =========================================================
     REFRESH
  ========================================================= */

  refreshDashboard(): void {
    this.loading = true;
    this.destroyCharts();
    this.dashboardCache.clear();
    this.dashboardCache.loadIfNeeded();
  }

  /* =========================================================
     NAVIGATION
  ========================================================= */

  goToAddPurchase(): void {
    this.router.navigate(['/app/purchase/add']);
  }

  goToAddUsage(): void {
    this.router.navigate(['/app/usage/add']);
  }
  getLowStockItems(): any[] {
    return this.items.filter((item: any) => {
      return item.quantity <= item.minStock;
    });
  }
  goToLowStock(): void {
    this.router.navigate(['/app/inventory'], {
      queryParams: {
        lowStock: true,
      },
    });
  }
  /* =========================================================
     CHART OPTIONS
  ========================================================= */

  private chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        labels: {
          usePointStyle: true,
          padding: 18,
        },
      },
    },
  };

  /* =========================================================
     DEPARTMENT CHART
  ========================================================= */

  createDepartmentChart(usage: any[], itemMap: any): void {
    const map: any = {};

    usage.forEach((usageItem: any) => {
      if (!usageItem.item || !usageItem.item.id) {
        return;
      }

      const item = itemMap[usageItem.item.id];

      if (!item) {
        return;
      }

      const total = (Number(usageItem.quantity) || 0) * item.price;

      map[usageItem.department] = (map[usageItem.department] || 0) + total;
    });

    this.departmentChart?.destroy();

    this.departmentChart = new Chart('departmentChart', {
      type: 'doughnut',

      data: {
        labels: Object.keys(map),

        datasets: [
          {
            data: Object.values(map),
          },
        ],
      },

      options: this.chartOptions,
    });
  }

  /* =========================================================
     CATEGORY CHART
  ========================================================= */

  createCategoryChart(usage: any[], itemMap: any): void {
    const map: any = {};

    usage.forEach((usageItem: any) => {
      if (!usageItem.item || !usageItem.item.id) {
        return;
      }

      const item = itemMap[usageItem.item.id];

      if (!item) {
        return;
      }

      const total = (Number(usageItem.quantity) || 0) * item.price;

      const category = item.category || 'Others';

      map[category] = (map[category] || 0) + total;
    });

    this.categoryChart?.destroy();

    this.categoryChart = new Chart('categoryChart', {
      type: 'bar',

      data: {
        labels: Object.keys(map),

        datasets: [
          {
            label: 'Category Usage',
            data: Object.values(map),

            borderRadius: 8,
          },
        ],
      },

      options: this.chartOptions,
    });
  }

  /* =========================================================
     WEEKLY TREND
  ========================================================= */

  createWeeklyTrend(usage: any[], itemMap: any): void {
    const weekly: any = {
      'Week 1': 0,
      'Week 2': 0,
      'Week 3': 0,
      'Week 4': 0,
    };

    usage.forEach((usageItem: any) => {
      if (!usageItem.item || !usageItem.item.id) {
        return;
      }

      const item = itemMap[usageItem.item.id];

      if (!item) {
        return;
      }

      const total = (Number(usageItem.quantity) || 0) * item.price;

      const week = Math.ceil(new Date(usageItem.usedDateTime).getDate() / 7);

      weekly[`Week ${week}`] += total;
    });

    this.weeklyChart?.destroy();

    this.weeklyChart = new Chart('weeklyChart', {
      type: 'line',

      data: {
        labels: Object.keys(weekly),

        datasets: [
          {
            label: 'Weekly Usage',
            data: Object.values(weekly),

            tension: 0.4,
            fill: true,
          },
        ],
      },

      options: this.chartOptions,
    });
  }

  /* =========================================================
     DESTROY CHARTS
  ========================================================= */

  private destroyCharts(): void {
    this.departmentChart?.destroy();
    this.categoryChart?.destroy();
    this.weeklyChart?.destroy();
  }
}
