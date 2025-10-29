import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardMetrics {
  total_customers: number;
  total_orders: number;
  total_paid_orders: number;
  total_profit: number;
  customers_growth: number;
  orders_growth: number;
}

export interface YearlySalesData {
  year: number;
  sales: number[];
  total_sales: string;
  growth: string;
}

export interface TargetData {
  title: string;
  subtitle: string;
  percentage: number;
  percentage_change: string;
  message: string;
  target: string;
  profit: string;
  current: string;
  current_label: string;
  target_direction: string;
  profit_direction: string;
  current_direction: string;
}

export interface StatisticsChartData {
  year: number;
  sales: number[];
  profit: number[];
}

export interface Location {
  id: number;
  country: string;
  state?: string;
  city: string;
  airport_code?: string;
  latitude?: number;
  longitude?: number;
}

export interface PopularTrip {
  id: number;
  origin_location: Location;
  destination_location: Location;
  sales_count: number;
}

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get dashboard metrics (customers, orders, revenue, growth)
   */
  getDashboardMetrics(): Observable<DashboardMetrics> {
    return this.http.get<DashboardMetrics>(`${this.apiUrl}/stats/metrics`);
  }

  /**
   * Get monthly sales data for a specific year
   */
  getMonthlySales(year: number): Observable<YearlySalesData> {
    return this.http.get<YearlySalesData>(`${this.apiUrl}/stats/monthly-sales/${year}`);
  }

  /**
   * Get target progress (daily, monthly, or annual)
   */
  getTargetProgress(targetType: 'daily' | 'monthly' | 'annual'): Observable<TargetData> {
    return this.http.get<TargetData>(`${this.apiUrl}/stats/targets/${targetType}`);
  }

  /**
   * Get statistics chart data for a specific year
   */
  getStatisticsChart(year: number): Observable<StatisticsChartData> {
    return this.http.get<StatisticsChartData>(`${this.apiUrl}/stats/statistics-chart/${year}`);
  }

  /**
   * Get popular travel destinations (most sold routes)
   */
  getPopularTrips(limit: number = 10): Observable<PopularTrip[]> {
    return this.http.get<PopularTrip[]>(`${this.apiUrl}/stats/popular-trips?limit=${limit}`);
  }
}
