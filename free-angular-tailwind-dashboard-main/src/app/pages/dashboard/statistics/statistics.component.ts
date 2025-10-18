import { Component } from '@angular/core';
import { StatisticsMetricsComponent } from '../../../shared/components/statistics/statistics-metrics/statistics-metrics.component';
import { MonthlySalesChartComponent } from '../../../shared/components/statistics/monthly-sales-chart/monthly-sales-chart.component';
import { MonthlyTargetComponent } from '../../../shared/components/statistics/monthly-target/monthly-target.component';
import { StatisticsChartComponent } from '../../../shared/components/statistics/statistics-chart/statistics-chart.component';
import { DemographicCardComponent } from '../../../shared/components/statistics/demographic-card/demographic-card.component';
import { RecentOrdersComponent } from '../../../shared/components/statistics/recent-orders/recent-orders.component';

@Component({
  selector: 'app-statistics',
  imports: [
    StatisticsMetricsComponent,
    MonthlySalesChartComponent,
    MonthlyTargetComponent,
    StatisticsChartComponent,
    DemographicCardComponent,
    RecentOrdersComponent,
  ],
  templateUrl: './statistics.component.html',
})
export class StatisticsComponent {}
