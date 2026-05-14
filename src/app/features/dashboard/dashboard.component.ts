import { Component, OnInit, OnDestroy } from '@angular/core';

import { Router } from '@angular/router';

import { Chart } from 'chart.js/auto';

import { forkJoin } from 'rxjs';

import { InventoryService } from '../../core/services/inventory.service';
import { PurchaseService } from '../../core/services/purchase.service';
import { UsageService } from '../../core/services/usage.service';

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

  /* =========================================================
     CONSTRUCTOR
  ========================================================= */

  constructor(
    private inventoryService: InventoryService,
    private purchaseService: PurchaseService,
    private usageService: UsageService,
    private authService: AuthService,
    private router: Router,
    private dashboardCache: DashboardCacheService,
  ) {}

  /* =========================================================
     INIT
  ========================================================= */

  ngOnInit(): void {
    this.setGreeting();

    if (this.dashboardCache.loaded) {
      this.setCachedData();
    } else {
      this.loadDashboard();
    }
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
     LOAD DASHBOARD
  ========================================================= */

  loadDashboard(): void {
    this.loading = true;

    forkJoin({
      items: this.inventoryService.getInventory(),
      purchases: this.purchaseService.getAll(),
      usage: this.usageService.getUsage(),
    }).subscribe({
      next: ({ items, purchases, usage }) => {
        /* ===============================
           KPI STATS
        =============================== */

        this.stats.purchases = purchases.length;

        this.stats.usage = usage.length;

        this.stats.lowStock = items.filter(
          (item: any) => item.quantity < item.minStock,
        ).length;

        this.stats.inventoryValue = items.reduce(
          (sum: number, item: any) => sum + (Number(item.total) || 0),
          0,
        );

        /* ===============================
           ITEM MAP
        =============================== */

        const itemMap: any = {};

        items.forEach((item: any) => {
          if (!item.itemId) return;

          itemMap[item.itemId] = {
            price: Number(item.cost) || 0,
            category: item.category || 'Others',
          };
        });

        /* ===============================
           CACHE
        =============================== */

        this.dashboardCache.dashboardData = {
          stats: this.stats,
          items,
          purchases,
          usage,
          itemMap,
        };

        this.dashboardCache.loaded = true;

        /* ===============================
           CHARTS
        =============================== */

        setTimeout(() => {
          this.createDepartmentChart(usage, itemMap);

          this.createCategoryChart(usage, itemMap);

          this.createWeeklyTrend(usage, itemMap);
        });

        this.loading = false;
      },

      error: (error) => {
        console.error(error);

        this.loading = false;
      },
    });
  }

  /* =========================================================
     LOAD CACHE
  ========================================================= */

  setCachedData(): void {
    const data = this.dashboardCache.dashboardData;

    this.stats = data.stats;

    setTimeout(() => {
      this.createDepartmentChart(data.usage, data.itemMap);

      this.createCategoryChart(data.usage, data.itemMap);

      this.createWeeklyTrend(data.usage, data.itemMap);
    });

    this.loading = false;
  }

  /* =========================================================
     REFRESH
  ========================================================= */

  refreshDashboard(): void {
    this.dashboardCache.clear();

    this.destroyCharts();

    this.loadDashboard();
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
