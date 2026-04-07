import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  PieController,
  Tooltip
} from 'chart.js';
import { CourseBreakdownItem } from './progress.component';

Chart.register(BarController, PieController, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface QuizHistoryItem {
  name: string;
  score: number;
}

@Component({
  selector: 'app-progress-charts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-charts.component.html',
  styleUrl: './progress-charts.component.scss'
})
export class ProgressChartsComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() quizHistory: QuizHistoryItem[] = [];
  @Input() courseBreakdown: CourseBreakdownItem[] = [];

  @ViewChild('barCanvas') barCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieCanvas') pieCanvas?: ElementRef<HTMLCanvasElement>;

  private barChart?: Chart;
  private pieChart?: Chart;
  private viewReady = false;
  private themeObserver?: MutationObserver;

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.watchThemeChanges();
    this.renderCharts();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (this.viewReady) {
      this.renderCharts();
    }
  }

  ngOnDestroy(): void {
    this.themeObserver?.disconnect();
    this.barChart?.destroy();
    this.pieChart?.destroy();
  }

  private watchThemeChanges(): void {
    const shell = this.getShellElement();
    if (!shell) {
      return;
    }

    this.themeObserver = new MutationObserver(() => {
      this.renderCharts();
    });

    this.themeObserver.observe(shell, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  private getShellElement(): Element | null {
    return this.barCanvas?.nativeElement.closest('.shell')
      ?? this.pieCanvas?.nativeElement.closest('.shell')
      ?? document.querySelector('.shell');
  }

  private isDarkTheme(): boolean {
    const shell = this.getShellElement();
    return !!shell?.classList.contains('theme-dark');
  }

  private renderCharts(): void {
    this.renderBarChart();
    this.renderPieChart();
  }

  private renderBarChart(): void {
    this.barChart?.destroy();

    if (!this.barCanvas?.nativeElement || this.quizHistory.length === 0) {
      return;
    }

    const dark = this.isDarkTheme();
    const axisColor = dark ? '#94a3b8' : '#6b7280';
    const gridColor = dark ? 'rgba(148, 163, 184, 0.16)' : '#e5e7eb';
    const tooltipBackground = dark ? '#0f172a' : '#111827';
    const tooltipBorder = dark ? '#334155' : '#1f2937';

    this.barChart = new Chart(this.barCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: this.quizHistory.map((item) => item.name),
        datasets: [
          {
            data: this.quizHistory.map((item) => item.score),
            backgroundColor: '#6366f1',
            borderRadius: 8,
            borderSkipped: false,
            maxBarThickness: 48
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 500 },
        plugins: {
          legend: { display: false },
          tooltip: {
            displayColors: false,
            backgroundColor: tooltipBackground,
            titleColor: '#f8fafc',
            bodyColor: '#f8fafc',
            borderColor: tooltipBorder,
            borderWidth: 1
          }
        },
        scales: {
          x: {
            ticks: { color: axisColor, font: { size: 12 } },
            grid: { display: false }
          },
          y: {
            min: 0,
            max: 100,
            ticks: {
              stepSize: 25,
              color: axisColor,
              font: { size: 12 }
            },
            grid: {
              color: gridColor
            }
          }
        }
      }
    });
  }

  private renderPieChart(): void {
    this.pieChart?.destroy();

    if (!this.pieCanvas?.nativeElement || this.courseBreakdown.length === 0) {
      return;
    }

    const dark = this.isDarkTheme();
    const tooltipBackground = dark ? '#0f172a' : '#111827';
    const tooltipBorder = dark ? '#334155' : '#1f2937';
    const sliceBorder = dark ? '#161b22' : '#ffffff';

    this.pieChart = new Chart(this.pieCanvas.nativeElement, {
      type: 'pie',
      data: {
        labels: this.courseBreakdown.map((item) => item.name),
        datasets: [
          {
            data: this.courseBreakdown.map((item) => item.value),
            backgroundColor: this.courseBreakdown.map((item) => item.color),
            borderColor: sliceBorder,
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 500 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: tooltipBackground,
            titleColor: '#f8fafc',
            bodyColor: '#f8fafc',
            borderColor: tooltipBorder,
            borderWidth: 1
          }
        }
      }
    });
  }
}
