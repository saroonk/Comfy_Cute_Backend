"""
PDF invoice generation using xhtml2pdf.

Renders templates/invoice.html to PDF, keeping the invoice generation
logic separate from views so it can be reused by customer/admin downloads
and email confirmations.

Invoices are never written to disk: HTML is rendered directly to an
in-memory PDF buffer.
"""
import base64
import logging
from io import BytesIO

from django.template.loader import render_to_string
from django.utils import timezone
from xhtml2pdf import pisa

logger = logging.getLogger(__name__)

THUMB_SIZE = (110, 110)


def _product_image_data_uri(product):
    """
    Best-effort inline thumbnail for the invoice table.
    Returns None if the product or its image is missing/unreadable.
    The invoice must never fail to generate just because one product photo
    can't be embedded.
    """
    if not product or not product.main_image:
        return None
    try:
        from PIL import Image
        with Image.open(product.main_image.path) as img:
            img = img.convert("RGB")
            img.thumbnail(THUMB_SIZE)
            buffer = BytesIO()
            img.save(buffer, format="PNG")
            encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
            return f"data:image/png;base64,{encoded}"
    except Exception as e:
        logger.warning(f"Could not generate product thumbnail: {e}")
        return None


def render_invoice_pdf(order):
    """
    Render the invoice template for this order and return the finished PDF as bytes.

    Args:
        order: Order instance with all related data

    Returns:
        bytes: PDF document data

    Raises:
        Exception: If PDF rendering fails
    """
    try:
        # Prepare order items with inline images
        items = list(order.items.select_related("product", "variant", "variant__color", "size").all())
        for item in items:
            item.invoice_image = _product_image_data_uri(item.product)

        # Prepare context
        context = {
            "order": order,
            "items": items,
            "invoice_date": order.created_at or timezone.now(),
        }

        # Render HTML template
        html = render_to_string("invoice.html", context)

        # Convert HTML to PDF
        buffer = BytesIO()
        pisa_status = pisa.CreatePDF(
            src=html,
            dest=buffer,
            encoding="utf-8",
            show_error_as_pdf=False,
        )

        if pisa_status.err:
            logger.error(f"PDF rendering error for order {order.order_number}: {pisa_status.err}")
            raise Exception(f"Failed to generate PDF: {pisa_status.err}")

        buffer.seek(0)
        logger.info(f"Invoice PDF generated successfully for order {order.order_number}")
        return buffer.getvalue()

    except Exception as e:
        logger.error(f"Error generating invoice PDF for order {order.order_number}: {str(e)}", exc_info=True)
        raise


def invoice_filename(order):
    """Generate invoice filename."""
    return f"COMFY-CUTE-Invoice-{order.order_number}.pdf"
