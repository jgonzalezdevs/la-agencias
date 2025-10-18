import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component';
import { CountryMapComponent } from '../../charts/country-map/country-map.component';

@Component({
  selector: 'app-demographic-card',
  imports: [
    CommonModule,
    TranslateModule,
    CountryMapComponent,
    DropdownComponent,
    DropdownItemComponent,
  ],
  templateUrl: './demographic-card.component.html',
})
export class DemographicCardComponent {
  isOpen = false;

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  closeDropdown() {
    this.isOpen = false;
  }

  destinations = [
    {
      img: '/images/country/country-01.svg',
      alt: 'usa',
      name: 'USA',
      topRoutes: 'NY → LA, Miami → SF',
      tickets: '2,379 Tickets',
      percent: 79,
      growth: '+12.5%',
      travelType: 'Flight & Bus'
    },
    {
      img: '/images/country/country-02.svg',
      alt: 'france',
      name: 'France',
      topRoutes: 'Paris → Nice, Lyon → Marseille',
      tickets: '589 Tickets',
      percent: 23,
      growth: '+8.3%',
      travelType: 'Flight'
    },
    {
      img: '/images/country/country-03.svg',
      alt: 'uk',
      name: 'United Kingdom',
      topRoutes: 'London → Edinburgh, Manchester → London',
      tickets: '1,456 Tickets',
      percent: 45,
      growth: '+15.7%',
      travelType: 'Flight & Bus'
    },
    {
      img: '/images/country/country-04.svg',
      alt: 'japan',
      name: 'Japan',
      topRoutes: 'Tokyo → Osaka, Tokyo → Kyoto',
      tickets: '823 Tickets',
      percent: 31,
      growth: '+22.1%',
      travelType: 'Flight'
    },
    {
      img: '/images/country/country-05.svg',
      alt: 'spain',
      name: 'Spain',
      topRoutes: 'Madrid → Barcelona, Valencia → Seville',
      tickets: '634 Tickets',
      percent: 28,
      growth: '+6.9%',
      travelType: 'Flight & Bus'
    },
  ];
}
