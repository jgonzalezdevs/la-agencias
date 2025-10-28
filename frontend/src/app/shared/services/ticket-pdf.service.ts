import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AdditionalService {
  type: 'hotel' | 'car' | 'luggage';
  name: string;
  details: string;
  price: string;
}

interface TicketData {
  ticketNumber: string;
  travelType: 'flight' | 'bus';
  travelNumber: string;
  origin: string;
  destination: string;
  travelDate: string;
  departureTime: string;
  arrivalTime: string;
  carrier: string;
  seller: {
    name: string;
    email: string;
  };
  buyer: {
    name: string;
    email: string;
  };
  class: string;
  quantity: number;
  price: string;
  totalAmount: string;
  saleDate: string;
  status: 'activo' | 'cancelado' | 'postpuesto';
  commission: string;
  additionalServices?: AdditionalService[];
}

@Injectable({
  providedIn: 'root'
})
export class TicketPdfService {

  generateTicketPDF(ticket: TicketData): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Colors
    const primaryColor: [number, number, number] = [70, 95, 255]; // #465FFF
    const darkGray: [number, number, number] = [55, 65, 81];
    const lightGray: [number, number, number] = [156, 163, 175];
    const successColor: [number, number, number] = [16, 185, 129];
    const warningColor: [number, number, number] = [245, 158, 11];
    const errorColor: [number, number, number] = [239, 68, 68];

    let yPos = 20;

    // Header - Company Logo/Name
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('BOLETERÍA', 15, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Travel Ticket', 15, 27);

    // Status Badge
    const statusColors: Record<string, [number, number, number]> = {
      'activo': successColor,
      'postpuesto': warningColor,
      'cancelado': errorColor
    };
    const statusColor = statusColors[ticket.status] || successColor;
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.roundedRect(pageWidth - 45, 12, 35, 10, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    const statusLabels: Record<string, string> = {
      'activo': 'ACTIVO',
      'postpuesto': 'POSTPUESTO',
      'cancelado': 'CANCELADO'
    };
    doc.text(statusLabels[ticket.status] || ticket.status.toUpperCase(), pageWidth - 27.5, 18.5, { align: 'center' });

    yPos = 45;

    // Ticket Number
    doc.setTextColor(...darkGray);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Ticket: ${ticket.ticketNumber}`, 15, yPos);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...lightGray);
    doc.text(`Sale Date: ${ticket.saleDate}`, pageWidth - 15, yPos, { align: 'right' });

    yPos += 10;

    // Travel Type Icon and Info
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(15, yPos, pageWidth - 15, yPos);

    yPos += 8;

    // Travel Type
    doc.setFontSize(10);
    doc.setTextColor(...darkGray);
    doc.setFont('helvetica', 'bold');
    const travelTypeText = ticket.travelType === 'flight' ? '✈ FLIGHT' : '🚌 BUS';
    doc.text(travelTypeText, 15, yPos);

    doc.setFont('helvetica', 'normal');
    doc.text(`${ticket.carrier} - ${ticket.travelNumber}`, 50, yPos);

    yPos += 10;

    // Route Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, yPos, pageWidth - 30, 35, 3, 3, 'F');

    // Origin
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkGray);
    doc.text('From:', 20, yPos + 8);
    doc.setFontSize(13);
    doc.text(ticket.origin, 20, yPos + 15);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...lightGray);
    doc.text(ticket.departureTime, 20, yPos + 20);

    // Arrow
    doc.setTextColor(...primaryColor);
    doc.setFontSize(16);
    doc.text('→', pageWidth / 2 - 3, yPos + 15);

    // Destination
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkGray);
    doc.text('To:', pageWidth - 80, yPos + 8);
    doc.setFontSize(13);
    doc.text(ticket.destination, pageWidth - 80, yPos + 15);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...lightGray);
    doc.text(ticket.arrivalTime, pageWidth - 80, yPos + 20);

    // Travel Date
    doc.setFontSize(9);
    doc.setTextColor(...darkGray);
    doc.text(`Travel Date: ${ticket.travelDate}`, 20, yPos + 30);

    yPos += 45;

    // Passenger Information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkGray);
    doc.text('Passenger Information', 15, yPos);

    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Name:', 20, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(ticket.buyer.name, 50, yPos);

    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.text('Email:', 20, yPos);
    doc.text(ticket.buyer.email, 50, yPos);

    yPos += 6;
    doc.text('Class:', 20, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(ticket.class, 50, yPos);

    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.text('Quantity:', 20, yPos);
    doc.text(ticket.quantity.toString(), 50, yPos);

    yPos += 12;

    // Additional Services
    if (ticket.additionalServices && ticket.additionalServices.length > 0) {
      doc.setFillColor(254, 252, 232);
      doc.roundedRect(15, yPos, pageWidth - 30, 8 + (ticket.additionalServices.length * 8), 3, 3, 'F');

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkGray);
      doc.text('Additional Services', 20, yPos + 6);

      yPos += 12;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      ticket.additionalServices.forEach((service) => {
        const icon = service.type === 'hotel' ? '🏨' : service.type === 'car' ? '🚗' : '🧳';
        doc.text(`${icon} ${service.name}`, 20, yPos);
        doc.setTextColor(...lightGray);
        doc.text(service.details, 20, yPos + 4);
        doc.setTextColor(...darkGray);
        doc.setFont('helvetica', 'bold');
        doc.text(service.price, pageWidth - 30, yPos, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        yPos += 8;
      });

      yPos += 6;
    }

    // Price Details
    yPos += 5;

    doc.setDrawColor(...lightGray);
    doc.setLineWidth(0.3);
    doc.line(15, yPos, pageWidth - 15, yPos);

    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      head: [['Description', 'Amount']],
      body: [
        ['Ticket Price', ticket.price],
        ...(ticket.additionalServices?.map(s => [s.name, s.price]) || []),
        ['Total Amount', ticket.totalAmount],
        ['Commission', ticket.commission]
      ],
      theme: 'plain',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: pageWidth - 70 },
        1: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 15, right: 15 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    yPos += 10;

    // Seller Information (Footer)
    doc.setDrawColor(...lightGray);
    doc.line(15, yPos, pageWidth - 15, yPos);

    yPos += 6;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...lightGray);
    doc.text('Sold by:', 15, yPos);
    doc.setTextColor(...darkGray);
    doc.text(`${ticket.seller.name} (${ticket.seller.email})`, 35, yPos);

    yPos += 5;
    doc.setTextColor(...lightGray);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 15, yPos);

    // Footer - Terms and Conditions
    if (yPos < pageHeight - 30) {
      doc.setFontSize(7);
      doc.setTextColor(...lightGray);
      const terms = 'This e-ticket is valid only for the passenger named above. Please arrive at least 2 hours before departure for international flights and 1 hour for domestic flights.';
      const splitTerms = doc.splitTextToSize(terms, pageWidth - 30);
      doc.text(splitTerms, 15, pageHeight - 20);
    }

    // Download PDF
    const fileName = `ticket-${ticket.ticketNumber}-${Date.now()}.pdf`;
    doc.save(fileName);
  }
}
