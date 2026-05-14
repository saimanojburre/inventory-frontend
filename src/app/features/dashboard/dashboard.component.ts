import { Component, OnInit, OnDestroy } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { forkJoin } from 'rxjs';

import { InventoryService } from '../../core/services/inventory.service';
import { PurchaseService } from '../../core/services/purchase.service';
import { UsageService } from '../../core/services/usage.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { Router } from '@angular/router';

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

  departmentChart!: Chart;
  categoryChart!: Chart;
  weeklyChart!: Chart;

  greetingMessage = '';
  loading = true;

  constructor(
    private inventoryService: InventoryService,
    private purchaseService: PurchaseService,
    private usageService: UsageService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loadDashboard();
    this.setGreeting();
  }

  ngOnDestroy() {
    this.departmentChart?.destroy();
    this.categoryChart?.destroy();
    this.weeklyChart?.destroy();
  }

  /* ================= LOAD DASHBOARD ================= */

  loadDashboard() {
    this.loading = true;

    forkJoin({
      items: this.inventoryService.getInventory(),
      purchases: this.purchaseService.getAll(),
      usage: this.usageService.getUsage(),
    }).subscribe({
      next: ({ items, purchases, usage }) => {
        this.stats.purchases = purchases.length;
        this.stats.usage = usage.length;

        this.stats.lowStock = items.filter(
          (i: any) => i.quantity < i.minStock,
        ).length;

        this.stats.inventoryValue = items.reduce(
          (sum: number, i: any) => sum + (Number(i.total) || 0),
          0,
        );

        const itemMap: any = {};

        items.forEach((i: any) => {
          if (!i.itemId) return;
          itemMap[i.itemId] = {
            price: Number(i.cost) || 0,
            category: i.category || 'Others',
          };
        });

        // ✅ FIX: Delay chart rendering
        setTimeout(() => {
          this.createDepartmentChart(usage, itemMap);
          this.createCategoryChart(usage, itemMap);
          this.createWeeklyTrend(usage, itemMap);
        });

        this.loading = false;
      },

      error: (err) => {
        console.error(err);
        this.loading = false;
      },
    });
  }

  setGreeting() {
    const hour = new Date().getHours();
    let greeting =
      hour < 12
        ? 'Good Morning'
        : hour < 17
          ? 'Good Afternoon'
          : 'Good Evening';

    this.greetingMessage = `${greeting}, ${this.authService.getUsername()} 👋`;
  }

  goToAddPurchase() {
    this.router.navigate(['/app/purchase/add']);
  }

  goToAddUsage() {
    this.router.navigate(['/app/usage/add']);
  }

  private chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
  };

  /* ================= CHARTS ================= */

  createDepartmentChart(usage: any[], itemMap: any) {
    const map: any = {};

    usage.forEach((u: any) => {
      if (!u.item || !u.item.id) return;

      const item = itemMap[u.item.id];
      if (!item) return;

      const total = (Number(u.quantity) || 0) * item.price;
      map[u.department] = (map[u.department] || 0) + total;
    });

    this.departmentChart?.destroy();

    this.departmentChart = new Chart('departmentChart', {
      type: 'doughnut',
      data: {
        labels: Object.keys(map),
        datasets: [{ data: Object.values(map) }],
      },
      options: this.chartOptions,
    });
  }

  createCategoryChart(usage: any[], itemMap: any) {
    const map: any = {};

    usage.forEach((u: any) => {
      if (!u.item || !u.item.id) return;

      const item = itemMap[u.item.id];
      if (!item) return;

      const total = (Number(u.quantity) || 0) * item.price;
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
          },
        ],
      },
      options: this.chartOptions,
    });
  }

  createWeeklyTrend(usage: any[], itemMap: any) {
    const weekly: any = { 'Week 1': 0, 'Week 2': 0, 'Week 3': 0, 'Week 4': 0 };

    usage.forEach((u: any) => {
      if (!u.item || !u.item.id) return;

      const item = itemMap[u.item.id];
      if (!item) return;

      const total = (Number(u.quantity) || 0) * item.price;
      const week = Math.ceil(new Date(u.usedDateTime).getDate() / 7);

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
          },
        ],
      },
      options: this.chartOptions,
    });
  }
}
