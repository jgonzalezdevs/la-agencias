import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';

import { Component, ViewChild } from '@angular/core';
import { EventInput, CalendarOptions, DateSelectArg, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';

interface TicketImage {
  name: string;
  dataUrl: string;
}

interface CalendarEvent extends EventInput {
  extendedProps: {
    transportType: 'flight' | 'bus';
    origin: string;
    destination: string;
    passengerName: string;
    passengerDocument: string;
    passengerPhone: string;
    passengerEmail: string;
    price: number;
    commission: number;
    ticketNumber: string;
    seatNumber: string;
    travelClass: string;
    departureTime: string;
    arrivalTime: string;
    carrier: string;
    paymentMethod: string;
    notes: string;
    status: 'confirmed' | 'pending' | 'cancelled';
    images: TicketImage[];
  };
}

@Component({
  selector: 'app-calender',
  imports: [
    CommonModule,
    FormsModule,
    FullCalendarModule,
    ModalComponent
  ],
  templateUrl: './calender.component.html',
  styles: ``
})
export class CalenderComponent {

  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  events: CalendarEvent[] = [];
  selectedEvent: CalendarEvent | null = null;
  isOpen = false;

  // Form fields
  transportType: 'flight' | 'bus' = 'flight';
  origin = '';
  destination = '';
  passengerName = '';
  passengerDocument = '';
  passengerPhone = '';
  passengerEmail = '';
  price = 0;
  commission = 0;
  ticketNumber = '';
  seatNumber = '';
  travelClass = '';
  departureDate = '';
  departureTime = '';
  arrivalTime = '';
  carrier = '';
  paymentMethod = '';
  notes = '';
  status: 'confirmed' | 'pending' | 'cancelled' = 'confirmed';
  images: TicketImage[] = [];

  travelClasses = ['Economy', 'Premium Economy', 'Business', 'First Class'];
  paymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Digital Wallet'];
  carriers = ['Avianca', 'LATAM', 'Copa Airlines', 'Viva Air', 'Wingo', 'Cruz del Sur', 'Ormeño', 'Linea'];

  calendarOptions!: CalendarOptions;

  ngOnInit() {
    this.events = [
      {
        id: '1',
        title: 'Lima → Bogotá (Flight)',
        start: new Date().toISOString().split('T')[0],
        extendedProps: {
          transportType: 'flight' as const,
          origin: 'Lima, Peru',
          destination: 'Bogotá, Colombia',
          passengerName: 'Juan Pérez',
          passengerDocument: '12345678',
          passengerPhone: '+51 999 888 777',
          passengerEmail: 'juan@example.com',
          price: 450,
          commission: 45,
          ticketNumber: 'AV-2024-001',
          seatNumber: '12A',
          travelClass: 'Economy',
          departureTime: '08:30',
          arrivalTime: '11:45',
          carrier: 'Avianca',
          paymentMethod: 'Credit Card',
          notes: '',
          status: 'confirmed' as const,
          images: []
        }
      },
      {
        id: '2',
        title: 'Cusco → Lima (Bus)',
        start: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        extendedProps: {
          transportType: 'bus' as const,
          origin: 'Cusco, Peru',
          destination: 'Lima, Peru',
          passengerName: 'María González',
          passengerDocument: '87654321',
          passengerPhone: '+51 888 777 666',
          passengerEmail: 'maria@example.com',
          price: 120,
          commission: 12,
          ticketNumber: 'CS-2024-002',
          seatNumber: '15',
          travelClass: 'Premium',
          departureTime: '21:00',
          arrivalTime: '08:30',
          carrier: 'Cruz del Sur',
          paymentMethod: 'Cash',
          notes: 'Bus cama',
          status: 'confirmed' as const,
          images: []
        }
      }
    ];

    this.calendarOptions = {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'prev,next addTicketButton',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      selectable: true,
      events: this.events,
      select: (info) => this.handleDateSelect(info),
      eventClick: (info) => this.handleEventClick(info),
      customButtons: {
        addTicketButton: {
          text: '+ Add Ticket',
          click: () => this.openModal()
        }
      },
      eventContent: (arg) => this.renderEventContent(arg)
    };
  }

  handleDateSelect(selectInfo: DateSelectArg) {
    this.resetModalFields();
    this.departureDate = selectInfo.startStr;
    this.openModal();
  }

  handleEventClick(clickInfo: EventClickArg) {
    const event = clickInfo.event as any;
    const props = event.extendedProps;

    this.selectedEvent = {
      id: event.id,
      title: event.title,
      start: event.startStr,
      extendedProps: props
    };

    // Populate form fields
    this.transportType = props.transportType;
    this.origin = props.origin;
    this.destination = props.destination;
    this.passengerName = props.passengerName;
    this.passengerDocument = props.passengerDocument;
    this.passengerPhone = props.passengerPhone;
    this.passengerEmail = props.passengerEmail;
    this.price = props.price;
    this.commission = props.commission;
    this.ticketNumber = props.ticketNumber;
    this.seatNumber = props.seatNumber;
    this.travelClass = props.travelClass;
    this.departureDate = event.startStr;
    this.departureTime = props.departureTime;
    this.arrivalTime = props.arrivalTime;
    this.carrier = props.carrier;
    this.paymentMethod = props.paymentMethod;
    this.notes = props.notes;
    this.status = props.status;
    this.images = props.images || [];

    this.openModal();
  }

  handleAddOrUpdateEvent() {
    const title = `${this.origin} → ${this.destination} (${this.transportType === 'flight' ? 'Flight' : 'Bus'})`;

    if (this.selectedEvent) {
      this.events = this.events.map(ev =>
        ev.id === this.selectedEvent!.id
          ? {
              ...ev,
              title,
              start: this.departureDate,
              extendedProps: this.getExtendedProps()
            }
          : ev
      );
    } else {
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        title,
        start: this.departureDate,
        allDay: true,
        extendedProps: this.getExtendedProps()
      };
      this.events = [...this.events, newEvent];
    }
    this.calendarOptions.events = this.events;
    this.closeModal();
    this.resetModalFields();
  }

  getExtendedProps() {
    return {
      transportType: this.transportType,
      origin: this.origin,
      destination: this.destination,
      passengerName: this.passengerName,
      passengerDocument: this.passengerDocument,
      passengerPhone: this.passengerPhone,
      passengerEmail: this.passengerEmail,
      price: this.price,
      commission: this.commission,
      ticketNumber: this.ticketNumber,
      seatNumber: this.seatNumber,
      travelClass: this.travelClass,
      departureTime: this.departureTime,
      arrivalTime: this.arrivalTime,
      carrier: this.carrier,
      paymentMethod: this.paymentMethod,
      notes: this.notes,
      status: this.status,
      images: this.images
    };
  }

  resetModalFields() {
    this.transportType = 'flight';
    this.origin = '';
    this.destination = '';
    this.passengerName = '';
    this.passengerDocument = '';
    this.passengerPhone = '';
    this.passengerEmail = '';
    this.price = 0;
    this.commission = 0;
    this.ticketNumber = '';
    this.seatNumber = '';
    this.travelClass = '';
    this.departureDate = '';
    this.departureTime = '';
    this.arrivalTime = '';
    this.carrier = '';
    this.paymentMethod = '';
    this.notes = '';
    this.status = 'confirmed';
    this.images = [];
    this.selectedEvent = null;
  }

  onFileSelect(event: any) {
    const files: FileList = event.target.files;
    if (files.length > 0) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            this.images.push({
              name: file.name,
              dataUrl: e.target.result
            });
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }

  removeImage(index: number) {
    this.images.splice(index, 1);
  }

  openModal() {
    this.isOpen = true;
  }

  closeModal() {
    this.isOpen = false;
    this.resetModalFields();
  }

  renderEventContent(eventInfo: any) {
    const props = eventInfo.event.extendedProps;
    const transportIcon = props.transportType === 'flight'
      ? '✈️'
      : '🚌';

    const statusColor = props.status === 'confirmed'
      ? 'bg-green-500/10 text-green-700 dark:text-green-400'
      : props.status === 'pending'
      ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
      : 'bg-red-500/10 text-red-700 dark:text-red-400';

    return {
      html: `
        <div class="fc-event-main p-1.5 rounded ${statusColor}">
          <div class="flex items-center gap-1 text-xs font-medium">
            <span>${transportIcon}</span>
            <span class="truncate">${eventInfo.event.title}</span>
          </div>
          <div class="text-[10px] opacity-80 mt-0.5">
            ${props.departureTime || ''} - $${props.price || 0}
          </div>
        </div>
      `
    };
  }
}
