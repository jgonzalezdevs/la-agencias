import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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

@Component({
  selector: 'app-statistics-chart',
  imports: [CommonModule, TranslateModule, NgApexchartsModule, ChartTabComponent],
  templateUrl: './statistics-chart.component.html'
})
export class StatisticsChartComponent {
  constructor(private translate: TranslateService) {
    this.initializeChartData();
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
        data: [180, 190, 170, 160, 175, 165, 170, 205, 230, 210, 240, 235],
      },
      {
        name: this.translate.instant('statistics.revenue'),
        data: [40, 30, 50, 40, 55, 40, 70, 100, 110, 120, 150, 140],
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
}
