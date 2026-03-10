// src/app/features/dashboard/admin/overview/admin-overview.component.ts
import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AdminStats, ActivityChartPoint, CategoryDistributionPoint, RecentActivityEntry } from '../../../../core/services/admin.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-overview.component.html',
  styleUrl: './admin-overview.component.scss'
})
export class AdminOverviewComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('lineCanvas')   lineCanvas!:   ElementRef<HTMLCanvasElement>;
  @ViewChild('donutCanvas')  donutCanvas!:  ElementRef<HTMLCanvasElement>;

  loading = true;
  today = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  stats: AdminStats = { totalStudents: 0, totalCourses: 0, totalCertificates: 0, totalDocuments: 0, examPassRate: 0 };
  displayedStats    = { totalStudents: 0, totalCourses: 0, totalCertificates: 0, totalDocuments: 0 };

  chartPoints:    ActivityChartPoint[]      = [];
  categories:     CategoryDistributionPoint[] = [];
  recentActivity: RecentActivityEntry[]     = [];

  private lineChart:  Chart | null = null;
  private donutChart: Chart | null = null;
  private dataReady = false;
  private viewReady = false;

  readonly DONUT_PALETTE = ['#6366f1','#8b5cf6','#06b6d4','#22c55e','#f59e0b','#ef4444','#ec4899','#14b8a6'];

  constructor(private adminService: AdminService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    let pending = 3;
    const done = () => {
      if (--pending === 0) {
        this.loading = false;
        this.dataReady = true;
        // Force Angular to process the @if(!loading) block so @ViewChild canvases resolve,
        // then build charts on the next macrotask tick.
        this.cdr.detectChanges();
        setTimeout(() => this.tryBuildCharts(), 0);
      }
    };

    this.adminService.getStats().pipe(catchError(() => of(null))).subscribe(s => {
      if (s) { this.stats = s; this.animateCounters(); }
      done();
    });
    this.adminService.getActivityChart(30).pipe(catchError(() => of([]))).subscribe(p => {
      this.chartPoints = p ?? [];
      done();
    });
    this.adminService.getCategoryDistribution().pipe(catchError(() => of([]))).subscribe(c => {
      this.categories = c ?? [];
      this.adminService.getRecentActivity(5).pipe(catchError(() => of([]))).subscribe(r => {
        this.recentActivity = r ?? [];
        done();
      });
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    setTimeout(() => this.tryBuildCharts(), 0);
  }

  ngOnDestroy(): void {
    this.lineChart?.destroy();
    this.donutChart?.destroy();
  }

  private tryBuildCharts(): void {
    if (!this.dataReady || !this.viewReady) return;
    if (!this.lineCanvas?.nativeElement || !this.donutCanvas?.nativeElement) return;
    this.buildLineChart();
    this.buildDonutChart();
  }

  /** Detect current theme by checking if the shell div carries .theme-light */
  private getChartColors(): { textColor: string; gridColor: string } {
    const isLight = document.querySelector('.shell')?.classList.contains('theme-light') ?? false;
    return {
      textColor: isLight ? '#64748b' : '#94a3b8',
      gridColor: isLight ? '#e2e8f0' : '#2d3148'
    };
  }

  private buildLineChart(): void {
    this.lineChart?.destroy();
    const accent = '#6366f1';
    const { textColor, gridColor } = this.getChartColors();

    // Always show 30 days — pad missing days with count 0
    const paddedPoints = this.padChartPoints(this.chartPoints, 30);

    const cfg: ChartConfiguration = {
      type: 'line',
      data: {
        labels: paddedPoints.map(p => p.date),
        datasets: [{
          label: 'Courses Generated',
          data: paddedPoints.map(p => p.count),
          borderColor: accent,
          backgroundColor: accent + '22',
          borderWidth: 2,
          pointBackgroundColor: accent,
          pointRadius: 3,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: '#1e2130', titleColor: '#f1f5f9', bodyColor: '#94a3b8', borderColor: '#2d3148', borderWidth: 1 }
        },
        scales: {
          x: { ticks: { color: textColor, maxTicksLimit: 7 }, grid: { color: gridColor } },
          y: {
            beginAtZero: true,
            ticks: { color: textColor, stepSize: 1, precision: 0 },
            grid: { color: gridColor }
          }
        }
      }
    };
    this.lineChart = new Chart(this.lineCanvas.nativeElement, cfg);
  }

  /** Fill the last `days` calendar days; missing days get count 0. */
  private padChartPoints(points: ActivityChartPoint[], days: number): ActivityChartPoint[] {
    // Use local date string (YYYY-MM-DD) to match what the backend stores
    const toLocalDateKey = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    // Normalize incoming keys to just YYYY-MM-DD
    const map = new Map(points.map(p => [p.date.substring(0, 10), p.count]));

    const result: ActivityChartPoint[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = toLocalDateKey(d);
      result.push({ date: key, count: map.get(key) ?? 0 });
    }
    return result;
  }

  private buildDonutChart(): void {
    this.donutChart?.destroy();
    const { textColor } = this.getChartColors();

    const cfg: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: this.categories.map(c => c.category),
        datasets: [{
          data: this.categories.map(c => c.count),
          backgroundColor: this.DONUT_PALETTE.slice(0, this.categories.length),
          borderWidth: 0,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { position: 'right', labels: { color: textColor, padding: 16, boxWidth: 12, font: { size: 12 } } },
          tooltip: { backgroundColor: '#1e2130', titleColor: '#f1f5f9', bodyColor: '#94a3b8', borderColor: '#2d3148', borderWidth: 1 }
        }
      }
    };
    this.donutChart = new Chart(this.donutCanvas.nativeElement, cfg);
  }

  private animateCounters(): void {
    const keys: (keyof typeof this.displayedStats)[] = ['totalStudents', 'totalCourses', 'totalCertificates', 'totalDocuments'];
    keys.forEach(key => {
      const target = (this.stats as any)[key] as number;
      const duration = 1200;
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        this.displayedStats[key] = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  getActionBadgeClass(action: string): string {
    const map: Record<string, string> = {
      GENERATE_COURSE:       'badge--indigo',
      PASS_EXAM:             'badge--green',
      FAIL_EXAM:             'badge--red',
      DOWNLOAD_CERTIFICATE:  'badge--amber',
    };
    return map[action] ?? 'badge--gray';
  }

  formatRelativeTime(isoTimestamp: string): string {
    const diff = (Date.now() - new Date(isoTimestamp).getTime()) / 1000;
    if (diff < 60)   return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }
}
