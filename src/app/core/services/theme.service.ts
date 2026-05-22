import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly storageKey = 'inventory-theme';

  loadTheme(): void {
    const savedTheme = localStorage.getItem(this.storageKey);
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)',
    ).matches;
    const shouldUseDarkTheme =
      savedTheme === 'dark' || (!savedTheme && prefersDark);

    document.body.classList.toggle('dark-theme', shouldUseDarkTheme);
    this.updateThemeColor(shouldUseDarkTheme);
  }

  toggleTheme(): void {
    const isDark = !document.body.classList.contains('dark-theme');

    document.body.classList.toggle('dark-theme', isDark);
    localStorage.setItem(this.storageKey, isDark ? 'dark' : 'light');
    this.updateThemeColor(isDark);
  }

  isDarkTheme(): boolean {
    return document.body.classList.contains('dark-theme');
  }

  private updateThemeColor(isDark: boolean): void {
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');

    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', isDark ? '#0f172a' : '#4f46e5');
    }
  }
}
