import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  toggleTheme() {
    const body = document.body;

    body.classList.toggle('dark-theme');

    const isDark = body.classList.contains('dark-theme');

    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }

  loadTheme() {
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark') {
      document.body.classList.add('dark-theme');
    }
  }
}
