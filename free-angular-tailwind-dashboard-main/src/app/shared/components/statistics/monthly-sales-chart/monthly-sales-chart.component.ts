import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgApexchartsModule, ApexAxisChartSeries, ApexChart, ApexXAxis, ApexPlotOptions, ApexDataLabels, ApexStroke, ApexLegend, ApexYAxis, ApexGrid, ApexFill, ApexTooltip } from 'ng-apexcharts';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component';

interface YearSalesData {
  year: number;
  sales: number[];
  totalSales: string;
  growth: string;
}

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
export class MonthlySalesChartComponent {
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
  selectedYear = 2024;

  private yearlyData: Record<number, YearSalesData> = {
    2022: {
      year: 2022,
      sales: [145, 320, 185, 265, 175, 180, 265, 95, 195, 355, 245, 98],
      totalSales: '$2.52M',
      growth: '+12%'
    },
    2023: {
      year: 2023,
      sales: [155, 355, 195, 280, 182, 188, 278, 102, 205, 372, 262, 105],
      totalSales: '$2.78M',
      growth: '+15%'
    },
    2024: {
      year: 2024,
      sales: [168, 385, 201, 298, 187, 195, 291, 110, 215, 390, 280, 112],
      totalSales: '$2.93M',
      growth: '+18%'
    },
    2025: {
      year: 2025,
      sales: [180, 410, 215, 315, 198, 205, 310, 125, 230, 415, 295, 120],
      totalSales: '$3.22M',
      growth: '+22%'
    }
  };

  availableYears = [2022, 2023, 2024, 2025];

  get currentYearData(): YearSalesData {
    return this.yearlyData[this.selectedYear];
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
    this.updateChartData();
    this.closeYearDropdown();
  }

  private updateChartData() {
    this.series = [
      {
        name: 'Sales',
        data: this.currentYearData.sales,
      },
    ];
  }
}