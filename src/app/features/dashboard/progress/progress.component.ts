import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardCourse, DashboardResponse } from '../../../core/services/dashboard.service';
import {
  Chart,
  DoughnutController,
  BarController,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';

Chart.register(DoughnutController, BarController, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress.component.html',
  styleUrl: './progress.component.scss'
})
export class ProgressComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('doughnutCanvas') doughnutCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barCanvas')      barCanvas!:      ElementRef<HTMLCanvasElement>;

  loading = true;
  error   = false;
  data: DashboardResponse | null = null;

  private doughnutChart?: Chart;
  private barChart?:      Chart;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.dashboardService.getDashboard().subscribe({
      next: (res) => { this.data = res; this.loading = false; },
      error: ()    => { this.error = true; this.loading = false; }
    });
  }

  ngAfterViewInit(): void {
    // Charts are created after data arrives — handled in ngOnInit via a check
  }

  ngAfterViewChecked(): void {
    if (!this.loading && !this.error && this.data && !this.doughnutChart && this.doughnutCanvas) {
      this.buildCharts();
    }
  }

  buildCharts(): void {
    const courses = this.data!.courses;

    // ── Doughnut ────────────────────────────────────────────────────────────
    const completed   = courses.filter(c => c.progressPercentage === 100).length;
    const inProgress  = courses.filter(c => c.progressPercentage > 0 && c.progressPercentage < 100).length;
    const notStarted  = courses.filter(c => c.progressPercentage === 0).length;

    this.doughnutChart = new Chart(this.doughnutCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'In Progress', 'Not Started'],
        datasets: [{
          data: [completed, inProgress, notStarted],
          backgroundColor: ['#10b981', '#6366f1', '#484f58'],
          borderColor: '#161b22',
          borderWidth: 3,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#8b949e', padding: 16, font: { size: 12 } }
          },
          tooltip: { backgroundColor: '#1c2128', borderColor: '#30363d', borderWidth: 1 }
        }
      }
    });

    // ── Bar ─────────────────────────────────────────────────────────────────
    const labels = courses.map(c => c.title.length > 20 ? c.title.slice(0, 18) + '…' : c.title);
    const scores = courses.map(c => {
      // Use progressPercentage as a proxy for quiz score if averageQuizScore per course isn't available
      return c.quizzesPassed > 0 && c.totalQuizzes > 0
        ? Math.round((c.quizzesPassed / c.totalQuizzes) * 100)
        : 0;
    });

    this.barChart = new Chart(this.barCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Quiz Pass Rate (%)',
          data: scores,
          backgroundColor: 'rgba(99, 102, 241, 0.6)',
          borderColor: '#6366f1',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: '#8b949e', maxRotation: 30 }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { min: 0, max: 100, ticks: { color: '#8b949e' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        },
        plugins: {
          legend: { labels: { color: '#8b949e' } },
          tooltip: { backgroundColor: '#1c2128', borderColor: '#30363d', borderWidth: 1 }
        }
      }
    });
  }

  examStatus(course: DashboardCourse): string {
    if (course.examPassed) return 'Passed';
    if (course.progressPercentage === 100) return 'Ready';
    return 'Not attempted';
  }

  ngOnDestroy(): void {
    this.doughnutChart?.destroy();
    this.barChart?.destroy();
  }
}
