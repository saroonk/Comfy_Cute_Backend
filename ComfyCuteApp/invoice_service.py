"""
Invoice PDF generation service for COMFY CUTE.

Provides centralized invoice generation for both customer and admin downloads.
Uses xhtml2pdf to render professional invoices from HTML templates.

This module wraps invoice_utils.py to provide a consistent interface
for both customer and admin invoice downloads.
"""

import logging
from io import BytesIO
from .invoice_utils import render_invoice_pdf

logger = logging.getLogger(__name__)


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

        Raises:
            Exception: If PDF generation fails
        """
        try:
            # Render the invoice HTML template to PDF
            pdf_bytes = render_invoice_pdf(order)

            # Return as BytesIO for consistency with views
            buffer = BytesIO(pdf_bytes)
            buffer.seek(0)

            logger.info(f"Invoice PDF generated successfully for order {order.order_number}")
            return buffer

        except Exception as e:
            logger.error(f"Error generating invoice PDF for order {order.order_number}: {str(e)}", exc_info=True)
            raise
