import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { NgApexchartsModule, ApexAxisChartSeries, ApexChart, ApexXAxis, ApexPlotOptions, ApexDataLabels, ApexStroke, ApexLegend, ApexYAxis, ApexGrid, ApexFill, ApexTooltip } from 'ng-apexcharts';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component';
import { StatsService, YearlySalesData } from '../../../services/stats.service';

@Component({
  selector: 'app-monthly-sales-chart',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    NgApexchartsModule,
    DropdownComponent,
    DropdownItemComponent,
  ],
  templateUrl: './monthly-sales-chart.component.html'
})
export class MonthlySalesChartComponent implements OnInit, OnDestroy {
  isLoading = true;
  errorMessage = '';
  private destroy$ = new Subject<void>();

  constructor(private statsService: StatsService) {}

  ngOnInit() {
    this.loadSalesData(this.selectedYear);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  public series: ApexAxisChartSeries = [
    {
      name: 'Sales',
      data: [168, 385, 201, 298, 187, 195, 291, 110, 215, 390, 280, 112],
    },
  ];
  public chart: ApexChart = {
    fontFamily: 'Outfit, sans-serif',
    type: 'bar',
    height: 180,
    toolbar: { show: false },
  };
  public xaxis: ApexXAxis = {
    categories: [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ],
    axisBorder: { show: false },
    axisTicks: { show: false },
  };
  public plotOptions: ApexPlotOptions = {
    bar: {
      horizontal: false,
      columnWidth: '39%',
      borderRadius: 5,
      borderRadiusApplication: 'end',
    },
  };
  public dataLabels: ApexDataLabels = { enabled: false };
  public stroke: ApexStroke = {
    show: true,
    width: 4,
    colors: ['transparent'],
  };
  public legend: ApexLegend = {
    show: true,
    position: 'top',
    horizontalAlign: 'left',
    fontFamily: 'Outfit',
  };
  public yaxis: ApexYAxis = { title: { text: undefined } };
  public grid: ApexGrid = { yaxis: { lines: { show: true } } };
  public fill: ApexFill = { opacity: 1 };
  public tooltip: ApexTooltip = {
    x: { show: false },
    y: { formatter: (val: number) => `${val}` },
  };
  public colors: string[] = ['#465fff'];

  isOpen = false;
  isYearDropdownOpen = false;
  selectedYear = 2025;

  private yearlyData: Record<number, YearlySalesData> = {};

  availableYears = [2022, 2023, 2024, 2025];

  get currentYearData(): YearlySalesData | null {
    return this.yearlyData[this.selectedYear] || null;
  }

  loadSalesData(year: number) {
    this.isLoading = true;
    this.errorMessage = '';

    this.statsService.getMonthlySales(year)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.yearlyData[year] = {
            year: data.year,
            sales: data.sales,
            total_sales: data.total_sales,
            growth: data.growth
          };
          this.updateChartData();
          this.isLoading = false;
        },
        error: (error) => {
          console.error(`Error loading sales data for ${year}:`, error);
          this.errorMessage = `Failed to load sales data for ${year}`;
          this.isLoading = false;
        }
      });
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  closeDropdown() {
    this.isOpen = false;
  }

  toggleYearDropdown() {
    this.isYearDropdownOpen = !this.isYearDropdownOpen;
  }

  closeYearDropdown() {
    this.isYearDropdownOpen = false;
  }

  selectYear(year: number) {
    this.selectedYear = year;
    // If data for this year is already loaded, just update the chart
    if (this.yearlyData[year]) {
      this.updateChartData();
    } else {
      // Otherwise, fetch the data
      this.loadSalesData(year);
    }
    this.closeYearDropdown();
  }

  private updateChartData() {
    const data = this.currentYearData;
    if (data) {
      this.series = [
        {
          name: 'Sales',
          data: data.sales,
        },
      ];
    }
  }
}