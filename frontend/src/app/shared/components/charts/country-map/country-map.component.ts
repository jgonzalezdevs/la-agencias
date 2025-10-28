import { Component, NgZone, ElementRef, ViewChild, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5geodata_worldLow from "@amcharts/amcharts5-geodata/worldLow";

export interface FlightRoute {
  originLat: number;
  originLon: number;
  originName: string;
  destLat: number;
  destLon: number;
  destName: string;
}

@Component({
  selector: 'app-country-map',
  template: `<div #chartdiv style="width: 100%; height: 300px; border-radius: 1rem;"></div>`,
})
export class CountryMapComponent implements OnChanges {
  @ViewChild('chartdiv', { static: true }) chartdiv!: ElementRef;
  @Input() selectedRoute?: FlightRoute;

  root!: am5.Root;
  chart!: am5map.MapChart;
  lineSeries!: am5map.MapLineSeries;
  pointSeries!: am5map.MapPointSeries;

  constructor(private zone: NgZone) { }

  ngOnInit() {
    this.zone.runOutsideAngular(() => {
      this.root = am5.Root.new(this.chartdiv.nativeElement);

      this.chart = this.root.container.children.push(
        am5map.MapChart.new(this.root, {
          panX: "none",
          panY: "none",
          wheelX: "none",
          wheelY: "none",
          projection: am5map.geoMercator(),
        })
      );

      let polygonSeries = this.chart.series.push(
        am5map.MapPolygonSeries.new(this.root, {
          geoJSON: am5geodata_worldLow,
          exclude: ["AQ"],
        })
      );

      polygonSeries.mapPolygons.template.setAll({
        tooltipText: "{name}",
        interactive: true,
        fill: am5.color(0xE5EAF2),
        stroke: am5.color(0xD0D5DD),
      });

      polygonSeries.mapPolygons.template.states.create("hover", {
        fill: am5.color(0x465FFF),
      });

      // Add point series for markers
      this.pointSeries = this.chart.series.push(
        am5map.MapPointSeries.new(this.root, {})
      );

      this.pointSeries.bullets.push(() =>
        am5.Bullet.new(this.root, {
          sprite: am5.Circle.new(this.root, {
            radius: 6,
            fill: am5.color(0x465FFF),
            stroke: am5.color(0xffffff),
            strokeWidth: 2,
          })
        })
      );

      // Add line series for flight routes
      this.lineSeries = this.chart.series.push(
        am5map.MapLineSeries.new(this.root, {})
      );

      this.lineSeries.mapLines.template.setAll({
        stroke: am5.color(0x465FFF),
        strokeOpacity: 0.6,
        strokeWidth: 2,
      });

      // Update map with initial route if provided
      this.updateMap();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedRoute'] && !changes['selectedRoute'].firstChange) {
      this.updateMap();
    }
  }

  updateMap() {
    if (!this.pointSeries || !this.lineSeries) return;

    this.zone.runOutsideAngular(() => {
      // Clear existing data
      this.pointSeries.data.clear();
      this.lineSeries.data.clear();

      if (this.selectedRoute) {
        // Add origin point
        this.pointSeries.data.push({
          geometry: {
            type: "Point",
            coordinates: [this.selectedRoute.originLon, this.selectedRoute.originLat]
          },
          name: this.selectedRoute.originName
        });

        // Add destination point
        this.pointSeries.data.push({
          geometry: {
            type: "Point",
            coordinates: [this.selectedRoute.destLon, this.selectedRoute.destLat]
          },
          name: this.selectedRoute.destName
        });

        // Add flight line
        this.lineSeries.data.push({
          geometry: {
            type: "LineString",
            coordinates: [
              [this.selectedRoute.originLon, this.selectedRoute.originLat],
              [this.selectedRoute.destLon, this.selectedRoute.destLat]
            ]
          }
        });
      }
    });
  }

  ngOnDestroy() {
    this.root?.dispose();
  }
}