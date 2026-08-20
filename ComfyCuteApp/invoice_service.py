"""
Invoice PDF generation service for COMFY CUTE.

Provides centralized invoice generation for both customer and admin downloads.
Uses ReportLab for professional PDF generation with COMFY CUTE branding.
"""

import logging
from io import BytesIO
from decimal import Decimal
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageTemplate, Frame, HRFlowable
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

logger = logging.getLogger(__name__)

# COMFY CUTE Brand Colors
BRAND_PRIMARY = colors.HexColor('#8CBDBC')
BRAND_SECONDARY = colors.HexColor('#A9D6D5')
BRAND_LIGHT = colors.HexColor('#FCFEFE')
TEXT_DARK = colors.HexColor('#333333')
TEXT_GRAY = colors.HexColor('#666666')
BORDER_COLOR = colors.HexColor('#DDDDDD')


class InvoiceGenerator:
    """Generate professional COMFY CUTE invoices as PDF."""

    @staticmethod
    def generate_pdf(order):
        """
        Generate a professional invoice PDF for an order.

        Args:
            order: Order instance with all related data

        Returns:
            BytesIO buffer containing the PDF data
        """
        try:
            buffer = BytesIO()

            # Create PDF document with custom page template
            doc = SimpleDocTemplate(
                buffer,
                pagesize=A4,
                topMargin=0.5 * inch,
                bottomMargin=0.5 * inch,
                leftMargin=0.75 * inch,
                rightMargin=0.75 * inch,
            )

            # Build PDF content
            elements = []

            # Add header
            elements.extend(InvoiceGenerator._build_header(order))

            # Add invoice info section
            elements.extend(InvoiceGenerator._build_invoice_info(order))

            # Add customer and delivery address
            elements.extend(InvoiceGenerator._build_addresses(order))

            # Add items table
            elements.extend(InvoiceGenerator._build_items_table(order))

            # Add totals section
            elements.extend(InvoiceGenerator._build_totals(order))

            # Add footer
            elements.extend(InvoiceGenerator._build_footer())

            # Build PDF
            doc.build(elements)
            buffer.seek(0)

            logger.info(f"Invoice PDF generated successfully for order {order.order_number}")
            return buffer

        except Exception as e:
            logger.error(f"Error generating invoice PDF for order {order.order_number}: {str(e)}", exc_info=True)
            raise

    @staticmethod
    def _build_header(order):
        """Build invoice header with logo and title."""
        styles = getSampleStyleSheet()
        elements = []

        # Company name
        title_style = ParagraphStyle(
            'CompanyTitle',
            parent=styles['Heading1'],
            fontSize=28,
            textColor=BRAND_PRIMARY,
            spaceAfter=2,
            fontName='Helvetica-Bold',
        )

        # "INVOICE" text
        invoice_title_style = ParagraphStyle(
            'InvoiceTitle',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=TEXT_DARK,
            spaceAfter=12,
            fontName='Helvetica-Bold',
        )

        # Create header table for layout
        header_data = [
            [
                Paragraph('<font size=28><b>COMFY CUTE</b></font>', styles['Normal']),
                Paragraph(f'<font size=11><b>INVOICE</b></font>', styles['Normal'])
            ]
        ]

        header_table = Table(header_data, colWidths=[4 * inch, 2 * inch])
        header_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ]))

        elements.append(header_table)

        # Add divider line
        elements.append(Spacer(1, 0.15 * inch))
        hr = HRFlowable(width=6.5 * inch, thickness=2, color=BRAND_PRIMARY)
        elements.append(hr)
        elements.append(Spacer(1, 0.2 * inch))

        return elements

    @staticmethod
    def _build_invoice_info(order):
        """Build invoice information (number, date, status)."""
        styles = getSampleStyleSheet()
        elements = []

        # Status display
        status_map = {
            'pending': 'Pending',
            'confirmed': 'Confirmed',
            'processing': 'Processing',
            'shipped': 'Shipped',
            'delivered': 'Delivered',
            'cancelled': 'Cancelled',
        }

        payment_status_map = {
            'pending': 'Pending',
            'paid': 'Paid',
            'failed': 'Failed',
            'refunded': 'Refunded',
        }

        # Create info table
        info_data = [
            [
                Paragraph('<b>Invoice Number</b>', styles['Normal']),
                Paragraph(f'<b>{order.order_number}</b>', styles['Normal']),
                Paragraph('<b>Order Date</b>', styles['Normal']),
                Paragraph(f'<b>{order.created_at.strftime("%d %b %Y")}</b>', styles['Normal']),
            ],
            [
                Paragraph('<b>Order Status</b>', styles['Normal']),
                Paragraph(status_map.get(order.status, order.status), styles['Normal']),
                Paragraph('<b>Payment Status</b>', styles['Normal']),
                Paragraph(payment_status_map.get(order.payment_status, order.payment_status), styles['Normal']),
            ]
        ]

        info_table = Table(info_data, colWidths=[1.3 * inch, 1.3 * inch, 1.3 * inch, 1.3 * inch])
        info_table.setStyle(TableStyle([
            ('TEXTCOLOR', (0, 0), (-1, -1), TEXT_DARK),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
        ]))

        elements.append(info_table)
        elements.append(Spacer(1, 0.25 * inch))

        return elements

    @staticmethod
    def _build_addresses(order):
        """Build customer and delivery address sections."""
        styles = getSampleStyleSheet()
        elements = []

        customer_name = f"{order.first_name} {order.last_name}".strip()

        # Address parts
        address_parts = [order.address]
        if order.address_2:
            address_parts.append(order.address_2)
        address_parts.extend([order.city, order.state, order.postal_code])
        full_address = ', '.join(filter(None, address_parts))

        # Create two-column layout for addresses
        address_data = [
            [
                Paragraph('<b>Bill To</b>', styles['Normal']),
                Paragraph('<b>Delivery Address</b>', styles['Normal']),
            ],
            [
                Paragraph(f'{customer_name}<br/>{order.email}<br/>{order.phone_number}', styles['Normal']),
                Paragraph(full_address, styles['Normal']),
            ]
        ]

        address_table = Table(address_data, colWidths=[3.25 * inch, 3.25 * inch])
        address_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TEXTCOLOR', (0, 0), (-1, -1), TEXT_DARK),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('BORDER', (0, 0), (-1, -1), 1, BORDER_COLOR),
            ('BACKGROUND', (0, 0), (-1, 0), BRAND_LIGHT),
        ]))

        elements.append(address_table)
        elements.append(Spacer(1, 0.2 * inch))

        return elements

    @staticmethod
    def _build_items_table(order):
        """Build order items table."""
        styles = getSampleStyleSheet()
        elements = []

        # Get order items
        order_items = order.items.select_related(
            'product', 'variant', 'variant__color', 'size'
        ).all()

        # Build table data
        items_data = [
            [
                Paragraph('<b>Product</b>', styles['Normal']),
                Paragraph('<b>Variant</b>', styles['Normal']),
                Paragraph('<b>Size</b>', styles['Normal']),
                Paragraph('<b>Qty</b>', styles['Normal']),
                Paragraph('<b>Unit Price</b>', styles['Normal']),
                Paragraph('<b>Total</b>', styles['Normal']),
            ]
        ]

        for item in order_items:
            items_data.append([
                Paragraph(item.product.name, styles['Normal']),
                Paragraph(item.variant.color.name, styles['Normal']),
                Paragraph(item.size.name, styles['Normal']),
                Paragraph(str(item.quantity), styles['Normal']),
                Paragraph(f'₹{item.unit_price}', styles['Normal']),
                Paragraph(f'₹{item.total_price}', styles['Normal']),
            ])

        # Create table
        items_table = Table(
            items_data,
            colWidths=[2 * inch, 1.2 * inch, 0.8 * inch, 0.6 * inch, 1 * inch, 1 * inch]
        )

        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), BRAND_PRIMARY),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('TOPPADDING', (0, 0), (-1, 0), 8),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (3, 0), (-1, -1), 'CENTER'),
            ('ALIGN', (4, 0), (-1, -1), 'RIGHT'),
            ('ALIGN', (5, 0), (-1, -1), 'RIGHT'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BRAND_LIGHT]),
            ('GRID', (0, 0), (-1, -1), 1, BORDER_COLOR),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))

        elements.append(items_table)
        elements.append(Spacer(1, 0.25 * inch))

        return elements

    @staticmethod
    def _build_totals(order):
        """Build totals section."""
        styles = getSampleStyleSheet()
        elements = []

        # Totals layout - right-aligned
        totals_data = [
            [Paragraph('<b>Subtotal:</b>', styles['Normal']), Paragraph(f'₹{order.subtotal}', styles['Normal'])],
            [Paragraph('<b>Shipping:</b>', styles['Normal']), Paragraph(f'₹{order.shipping_charge}', styles['Normal'])],
            [Paragraph('<b>Grand Total:</b>', styles['Normal']), Paragraph(f'₹{order.total_amount}', styles['Normal'])],
        ]

        totals_table = Table(totals_data, colWidths=[1.5 * inch, 0.8 * inch])
        totals_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('TEXTCOLOR', (0, 0), (-1, -1), TEXT_DARK),
            ('FONTSIZE', (0, 0), (-1, 1), 10),
            ('FONTSIZE', (0, 2), (-1, 2), 12),
            ('FONTNAME', (0, 2), (-1, 2), 'Helvetica-Bold'),
            ('TEXTCOLOR', (0, 2), (-1, 2), BRAND_PRIMARY),
            ('TOPPADDING', (0, 2), (-1, 2), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 2), 4),
            ('BORDER', (0, 2), (-1, 2), 2, BRAND_PRIMARY),
        ]))

        elements.append(Spacer(1, 0.1 * inch))
        elements.append(totals_table)
        elements.append(Spacer(1, 0.3 * inch))

        return elements

    @staticmethod
    def _build_footer():
        """Build invoice footer."""
        styles = getSampleStyleSheet()
        elements = []

        # Divider line
        hr = HRFlowable(width=6.5 * inch, thickness=1, color=BORDER_COLOR)
        elements.append(hr)
        elements.append(Spacer(1, 0.15 * inch))

        # Footer text
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=10,
            textColor=TEXT_GRAY,
            alignment=TA_CENTER,
        )

        footer_text = "Thank you for shopping with COMFY CUTE."
        elements.append(Paragraph(footer_text, footer_style))

        return elements
