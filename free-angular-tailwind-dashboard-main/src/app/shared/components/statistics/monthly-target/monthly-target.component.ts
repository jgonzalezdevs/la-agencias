import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
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

type TargetType = 'daily' | 'monthly' | 'annual';

interface TargetData {
  title: string;
  subtitle: string;
  percentage: number;
  percentageChange: string;
  message: string;
  target: string;
  revenue: string;
  current: string;
  currentLabel: string;
  targetDirection: 'up' | 'down';
  revenueDirection: 'up' | 'down';
  currentDirection: 'up' | 'down';
}

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
export class MonthlyTargetComponent {
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

  private targetsData: Record<TargetType, TargetData> = {
    daily: {
      title: 'monthlyTarget.dailyTarget',
      subtitle: 'monthlyTarget.dailyDescription',
      percentage: 82.5,
      percentageChange: '+15%',
      message: 'monthlyTarget.dailyMessage',
      target: '$1K',
      revenue: '$850',
      current: '$850',
      currentLabel: 'monthlyTarget.today',
      targetDirection: 'down',
      revenueDirection: 'up',
      currentDirection: 'up',
    },
    monthly: {
      title: 'monthlyTarget.monthlyTarget',
      subtitle: 'monthlyTarget.monthlyDescription',
      percentage: 75.55,
      percentageChange: '+10%',
      message: 'monthlyTarget.monthlyMessage',
      target: '$20K',
      revenue: '$15K',
      current: '$3.2K',
      currentLabel: 'monthlyTarget.today',
      targetDirection: 'down',
      revenueDirection: 'up',
      currentDirection: 'up',
    },
    annual: {
      title: 'monthlyTarget.annualTarget',
      subtitle: 'monthlyTarget.annualDescription',
      percentage: 68.3,
      percentageChange: '+8%',
      message: 'monthlyTarget.annualMessage',
      target: '$240K',
      revenue: '$164K',
      current: '$14K',
      currentLabel: 'monthlyTarget.thisMonth',
      targetDirection: 'down',
      revenueDirection: 'up',
      currentDirection: 'up',
    },
  };

  get currentTarget(): TargetData {
    return this.targetsData[this.currentTargetType];
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

    this.updateChartData();
  }

  private updateChartData() {
    this.series = [this.currentTarget.percentage];
  }
}
