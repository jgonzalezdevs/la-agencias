import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import {
  ApexNonAxisChartSeries,
  ApexChart,
  ApexPlotOptions,
  ApexFill,
  ApexStroke,
  ApexOptions,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component';
import { StatsService, TargetData } from '../../../services/stats.service';

type TargetType = 'daily' | 'monthly' | 'annual';

@Component({
  selector: 'app-monthly-target',
  imports: [
    CommonModule,
    TranslateModule,
    NgApexchartsModule,
    DropdownComponent,
    DropdownItemComponent,
  ],
  templateUrl: './monthly-target.component.html',
})
export class MonthlyTargetComponent implements OnInit, OnDestroy {
  isLoading = true;
  errorMessage = '';
  currentTargetData: TargetData | null = null;
  private destroy$ = new Subject<void>();

  constructor(private statsService: StatsService) {}

  ngOnInit() {
    this.loadTargetData(this.currentTargetType);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  public series: ApexNonAxisChartSeries = [75.55];
  public chart: ApexChart = {
    fontFamily: 'Outfit, sans-serif',
    type: 'radialBar',
    height: 330,
    sparkline: { enabled: true },
  };
  public plotOptions: ApexPlotOptions = {
    radialBar: {
      startAngle: -85,
      endAngle: 85,
      hollow: { size: '80%' },
      track: {
        background: '#E4E7EC',
        strokeWidth: '100%',
        margin: 5,
      },
      dataLabels: {
        name: { show: false },
        value: {
          fontSize: '36px',
          fontWeight: '600',
          offsetY: -40,
          color: '#1D2939',
          formatter: (val: number) => `${val}%`,
        },
      },
    },
  };
  public fill: ApexFill = {
    type: 'solid',
    colors: ['#465FFF'],
  };
  public stroke: ApexStroke = {
    lineCap: 'round',
  };
  public labels: string[] = ['Progress'];
  public colors: string[] = ['#465FFF'];

  isOpen = false;
  currentTargetType: TargetType = 'monthly';

  get currentTarget(): TargetData | null {
    return this.currentTargetData;
  }

  loadTargetData(targetType: TargetType) {
    this.isLoading = true;
    this.errorMessage = '';

    this.statsService.getTargetProgress(targetType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.currentTargetData = data;
          this.updateChartData();
          this.isLoading = false;
        },
        error: (error) => {
          console.error(`Error loading ${targetType} target:`, error);
          this.errorMessage = `Failed to load ${targetType} target`;
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

  navigateTarget(direction: 'prev' | 'next') {
    const types: TargetType[] = ['daily', 'monthly', 'annual'];
    const currentIndex = types.indexOf(this.currentTargetType);

    if (direction === 'prev') {
      this.currentTargetType = types[currentIndex === 0 ? types.length - 1 : currentIndex - 1];
    } else {
      this.currentTargetType = types[currentIndex === types.length - 1 ? 0 : currentIndex + 1];
    }

    this.loadTargetData(this.currentTargetType);
  }

  private updateChartData() {
    if (this.currentTarget) {
      this.series = [this.currentTarget.percentage];
    }
  }
}
