import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { NgApexchartsModule } from 'ng-apexcharts';

import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexStroke,
  ApexFill,
  ApexMarkers,
  ApexGrid,
  ApexDataLabels,
  ApexTooltip,
  ApexYAxis,
  ApexLegend,
  ApexOptions
} from 'ng-apexcharts';
import { ChartTabComponent } from '../../common/chart-tab/chart-tab.component';
import { StatsService } from '../../../services/stats.service';

@Component({
  selector: 'app-statistics-chart',
  imports: [CommonModule, TranslateModule, NgApexchartsModule, ChartTabComponent],
  templateUrl: './statistics-chart.component.html'
})
export class StatisticsChartComponent implements OnInit, OnDestroy {
  isLoading = true;
  errorMessage = '';
  selectedYear = 2025;
  private destroy$ = new Subject<void>();

  constructor(
    private translate: TranslateService,
    private statsService: StatsService
  ) {
    this.initializeChartData();
  }

  ngOnInit() {
    this.loadChartData(this.selectedYear);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  public series: ApexAxisChartSeries = [];

  public chart: ApexChart = {
    fontFamily: 'Outfit, sans-serif',
    height: 310,
    type: 'area',
    toolbar: { show: false }
  };

  public colors: string[] = ['#465FFF', '#9CB9FF'];

  public stroke: ApexStroke = {
    curve: 'straight',
    width: [2, 2]
  };

  public fill: ApexFill = {
    type: 'gradient',
    gradient: {
      opacityFrom: 0.55,
      opacityTo: 0,
    }
  };

  public markers: ApexMarkers = {
    size: 0,
    strokeColors: '#fff',
    strokeWidth: 2,
    hover: { size: 6 }
  };

  public grid: ApexGrid = {
    xaxis: { lines: { show: false } },
    yaxis: { lines: { show: true } }
  };

  public dataLabels: ApexDataLabels = { enabled: false };

  public tooltip: ApexTooltip = {
    enabled: true,
    x: { format: 'dd MMM yyyy' }
  };

  public xaxis: ApexXAxis = {
    type: 'category',
    categories: [],
    axisBorder: { show: false },
    axisTicks: { show: false },
    tooltip: { enabled: false }
  };

  public yaxis: ApexYAxis = {
    labels: {
      style: {
        fontSize: '12px',
        colors: ['#6B7280']
      }
    },
    title: {
      text: '',
      style: { fontSize: '0px' }
    }
  };

  public legend: ApexLegend = {
    show: false,
    position: 'top',
    horizontalAlign: 'left'
  };

  private initializeChartData() {
    this.series = [
      {
        name: this.translate.instant('statistics.sales'),
        data: [],
      },
      {
        name: 'Profit (x100)',
        data: [],
      },
    ];

    this.xaxis.categories = [
      this.translate.instant('months.jan'),
      this.translate.instant('months.feb'),
      this.translate.instant('months.mar'),
      this.translate.instant('months.apr'),
      this.translate.instant('months.may'),
      this.translate.instant('months.jun'),
      this.translate.instant('months.jul'),
      this.translate.instant('months.aug'),
      this.translate.instant('months.sep'),
      this.translate.instant('months.oct'),
      this.translate.instant('months.nov'),
      this.translate.instant('months.dec')
    ];
  }

  loadChartData(year: number) {
    this.isLoading = true;
    this.errorMessage = '';

    this.statsService.getStatisticsChart(year)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.series = [
            {
              name: this.translate.instant('statistics.sales'),
              data: data.sales,
            },
            {
              name: 'Profit (x100)',
              data: data.profit,
            },
          ];
          this.isLoading = false;
        },
        error: (error) => {
          console.error(`Error loading statistics chart for ${year}:`, error);
          this.errorMessage = `Failed to load chart data for ${year}`;
          this.isLoading = false;
        }
      });
  }
}
