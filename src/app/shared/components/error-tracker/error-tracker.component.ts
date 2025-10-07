import { Component, OnInit } from '@angular/core';
import { AnalyticsService } from '../../../core/services/analytics.service';

@Component({
  selector: 'app-error-tracker',
  standalone: true,
  template: '', // Pas de template visible
  styles: []
})
export class ErrorTrackerComponent implements OnInit {

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit() {
    this.setupErrorTracking();
  }

  private setupErrorTracking() {
    // Track JavaScript errors
    window.addEventListener('error', (event) => {
      this.analyticsService.trackError(
        event.message,
        `${event.filename}:${event.lineno}:${event.colno}`
      );
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.analyticsService.trackError(
        event.reason?.message || 'Unhandled Promise Rejection',
        'Promise'
      );
    });

    // Track console errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      this.analyticsService.trackError(
        args.join(' '),
        'Console'
      );
    };
  }
}
