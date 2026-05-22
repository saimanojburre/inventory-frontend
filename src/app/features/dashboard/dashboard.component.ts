import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import { AuthService } from 'src/app/core/services/auth.service';
import { DashboardCacheService } from 'src/app/core/services/dashboard-cache.service';
import { ThemeService } from 'src/app/core/services/theme.service';

Chart.register(...registerables, ChartDataLabels);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats = {
    inventoryValue: 0,
    purchases: 0,
    usage: 0,
    lowStock: 0,
  };

  departmentChart: Chart | null = null;
  categoryChart: Chart | null = null;
  weeklyChart: Chart | null = null;

  greetingMessage = '';
  loading = true;

  items: any[] = [];
  lowStockItems: any[] = [];

  private latestUsage: any[] = [];
  private latestItemMap: any = {};
  private themeObserver: MutationObserver | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private dashboardCache: DashboardCacheService,
    private themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.setGreeting();
    this.watchThemeChanges();

    this.dashboardCache.loadIfNeeded();

    this.dashboardCache.dashboard$.subscribe((data) => {
      if (!data) return;

      this.stats = data.stats;
      this.items = data.items || [];
      this.lowStockItems = this.items.filter((item: any) => {
        return item.quantity <= item.minStock;
      });

      this.latestUsage = data.usage || [];
      this.latestItemMap = data.itemMap || {};

      requestAnimationFrame(() => {
        this.createAllCharts();
      });

      this.loading = false;
    });
  }

  ngOnDestroy(): void {
    this.destroyCharts();
    this.themeObserver?.disconnect();
  }

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

  refreshDashboard(): void {
    this.loading = true;
    this.destroyCharts();
    this.dashboardCache.clear();
    this.dashboardCache.loadIfNeeded();
  }

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

  private watchThemeChanges(): void {
    this.themeObserver = new MutationObserver(() => {
      if (!this.loading) {
        requestAnimationFrame(() => {
          this.createAllCharts();
        });
      }
    });

    this.themeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  private createAllCharts(): void {
    this.createDepartmentChart(this.latestUsage, this.latestItemMap);
    this.createCategoryChart(this.latestUsage, this.latestItemMap);
    this.createWeeklyTrend(this.latestUsage, this.latestItemMap);
  }

  private formatCurrency(value: number): string {
    return (
      '₹' +
      Number(value).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  private getBaseChartColors(): any {
    const isDark = this.themeService.isDarkTheme();

    return {
      textColor: isDark ? '#e5e7eb' : '#111827',
      mutedColor: isDark ? '#94a3b8' : '#6b7280',
      gridColor: isDark
        ? 'rgba(148, 163, 184, 0.18)'
        : 'rgba(148, 163, 184, 0.25)',
    };
  }

  private getDoughnutChartOptions(): any {
    const colors = this.getBaseChartColors();

    return {
      responsive: true,
      maintainAspectRatio: false,

      layout: {
        padding: {
          top: 28,
          right: 42,
          bottom: 24,
          left: 42,
        },
      },

      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 18,
            color: colors.mutedColor,
          },
        },

        datalabels: {
          display: true,
          color: colors.textColor,
          anchor: 'center',
          align: 'center',
          clamp: true,
          clip: false,

          font: {
            weight: '700',
            size: 11,
          },

          formatter: (value: number) => {
            return this.formatCurrency(value);
          },
        },

        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = Number(context.raw || 0);

              return `${label}: ${this.formatCurrency(value)}`;
            },
          },
        },
      },

      scales: {
        x: {
          display: false,
        },
        y: {
          display: false,
        },
      },
    };
  }

  private getAxisChartOptions(): any {
    const colors = this.getBaseChartColors();

    return {
      responsive: true,
      maintainAspectRatio: false,

      layout: {
        padding: {
          top: 28,
          right: 12,
          bottom: 6,
          left: 6,
        },
      },

      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 18,
            color: colors.mutedColor,
          },
        },

        datalabels: {
          color: colors.textColor,
          anchor: 'end',
          align: 'top',
          offset: 4,
          clamp: true,
          clip: false,

          font: {
            weight: '600',
            size: 11,
          },

          formatter: (value: number) => {
            return this.formatCurrency(value);
          },
        },
      },

      scales: {
        x: {
          ticks: {
            color: colors.mutedColor,
            maxRotation: 10,
            minRotation: 0,
          },
          grid: {
            color: colors.gridColor,
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: colors.mutedColor,
          },
          grid: {
            color: colors.gridColor,
          },
        },
      },
    };
  }

  createDepartmentChart(usage: any[], itemMap: any): void {
    this.departmentChart?.destroy();
    Chart.getChart('departmentChart')?.destroy();

    const canvas = document.getElementById(
      'departmentChart',
    ) as HTMLCanvasElement;

    if (!canvas) return;

    const map: any = {};

    usage.forEach((usageItem: any) => {
      if (!usageItem.item?.id) return;

      const item = itemMap[usageItem.item.id];

      if (!item) return;

      const total = (Number(usageItem.quantity) || 0) * item.price;

      map[usageItem.department] = (map[usageItem.department] || 0) + total;
    });

    this.departmentChart = new Chart(canvas, {
      type: 'doughnut',

      data: {
        labels: Object.keys(map),

        datasets: [
          {
            data: Object.values(map),
            borderWidth: 3,
            hoverOffset: 8,
          },
        ],
      },

      options: this.getDoughnutChartOptions(),
    });
  }

  createCategoryChart(usage: any[], itemMap: any): void {
    this.categoryChart?.destroy();
    Chart.getChart('categoryChart')?.destroy();

    const canvas = document.getElementById(
      'categoryChart',
    ) as HTMLCanvasElement;

    if (!canvas) return;

    const map: any = {};

    usage.forEach((usageItem: any) => {
      if (!usageItem.item?.id) return;

      const item = itemMap[usageItem.item.id];

      if (!item) return;

      const total = (Number(usageItem.quantity) || 0) * item.price;
      const category = item.category || 'Others';

      map[category] = (map[category] || 0) + total;
    });

    this.categoryChart = new Chart(canvas, {
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

      options: this.getAxisChartOptions(),
    });
  }

  createWeeklyTrend(usage: any[], itemMap: any): void {
    this.weeklyChart?.destroy();
    Chart.getChart('weeklyChart')?.destroy();

    const canvas = document.getElementById('weeklyChart') as HTMLCanvasElement;

    if (!canvas) return;

    const weekly: any = {
      'Week 1': 0,
      'Week 2': 0,
      'Week 3': 0,
      'Week 4': 0,
    };

    usage.forEach((usageItem: any) => {
      if (!usageItem.item?.id) return;

      const item = itemMap[usageItem.item.id];

      if (!item) return;

      const total = (Number(usageItem.quantity) || 0) * item.price;
      const week = Math.ceil(new Date(usageItem.usedDateTime).getDate() / 7);

      weekly[`Week ${week}`] += total;
    });

    this.weeklyChart = new Chart(canvas, {
      type: 'line',

      data: {
        labels: Object.keys(weekly),

        datasets: [
          {
            label: 'Weekly Usage',
            data: Object.values(weekly),
            tension: 0.4,
            fill: true,

            datalabels: {
              align: 'top',
              anchor: 'end',
            },
          },
        ],
      },

      options: this.getAxisChartOptions(),
    });
  }

  private destroyCharts(): void {
    this.departmentChart?.destroy();
    this.categoryChart?.destroy();
    this.weeklyChart?.destroy();

    Chart.getChart('departmentChart')?.destroy();
    Chart.getChart('categoryChart')?.destroy();
    Chart.getChart('weeklyChart')?.destroy();

    this.departmentChart = null;
    this.categoryChart = null;
    this.weeklyChart = null;
  }
}
