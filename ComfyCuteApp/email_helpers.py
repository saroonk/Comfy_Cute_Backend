"""
Email helper functions for COMFY CUTE order notifications.
Provides async email sending using background threading.
"""

import logging
import threading
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from decimal import Decimal

logger = logging.getLogger(__name__)


def send_email_async(email_type, order_id, **kwargs):
    """
    Send an order email asynchronously using a background thread.

    This function starts a daemon thread that sends the email independently,
    ensuring the original request is not blocked by SMTP delivery.

    Args:
        email_type: Type of email ('new_order', 'confirmed', 'processing', 'shipped', 'delivered')
        order_id: ID of the Order object to send email for
        **kwargs: Additional context data
    """
    thread = threading.Thread(
        target=_send_order_email,
        args=(email_type, order_id),
        kwargs=kwargs,
        daemon=True
    )
    thread.start()


def _send_order_email(email_type, order_id, **kwargs):
    """
    Internal function that actually sends the order email.
    Runs in a background thread.

    Important: This function retrieves the Order from the database directly
    to avoid using stale ORM objects from the calling thread.
    """
    from .models import Order

    try:
        # Retrieve order fresh from database
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found for email type {email_type}")
        return

    try:
        if email_type == 'new_order':
            _send_new_order_admin_email(order)
            _send_new_order_customer_email(order)
        elif email_type == 'confirmed':
            _send_status_change_customer_email(order, 'confirmed')
        elif email_type == 'processing':
            _send_status_change_customer_email(order, 'processing')
        elif email_type == 'shipped':
            _send_status_change_customer_email(order, 'shipped')
        elif email_type == 'delivered':
            _send_status_change_customer_email(order, 'delivered')
        else:
            logger.warning(f"Unknown email type: {email_type}")

    except Exception as e:
        logger.error(f"Error sending {email_type} email for order {order_id}: {str(e)}", exc_info=True)


def _send_new_order_admin_email(order):
    """Send new order notification email to admin/store."""
    try:
        store_email = getattr(settings, 'STORE_EMAIL', settings.DEFAULT_FROM_EMAIL)

        context = _prepare_order_context(order)

        # Render HTML and plain text
        html_content = render_to_string('emails/new_order_admin.html', context)
        text_content = render_to_string('emails/new_order_admin.txt', context)

        email = EmailMultiAlternatives(
            subject=f"New Order Received - {order.order_number}",
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[store_email]
        )
        email.attach_alternative(html_content, "text/html")
        email.send(fail_silently=False)

        logger.info(f"Admin new order email sent for order {order.order_number} to {store_email}")

    except Exception as e:
        logger.error(f"Failed to send admin new order email for order {order.order_number}: {str(e)}", exc_info=True)


def _send_new_order_customer_email(order):
    """Send order confirmation email to customer."""
    try:
        context = _prepare_order_context(order)

        # Render HTML and plain text
        html_content = render_to_string('emails/new_order_customer.html', context)
        text_content = render_to_string('emails/new_order_customer.txt', context)

        email = EmailMultiAlternatives(
            subject=f"Order Confirmed - {order.order_number} | COMFY CUTE",
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[order.email]
        )
        email.attach_alternative(html_content, "text/html")
        email.send(fail_silently=False)

        logger.info(f"Customer new order email sent for order {order.order_number} to {order.email}")

    except Exception as e:
        logger.error(f"Failed to send customer new order email for order {order.order_number}: {str(e)}", exc_info=True)


def _send_status_change_customer_email(order, status):
    """Send order status change notification to customer."""
    try:
        # Determine email template and subject based on status
        status_subjects = {
            'confirmed': f"Your Order is Confirmed - {order.order_number}",
            'processing': f"Your Order is Being Prepared - {order.order_number}",
            'shipped': f"Your Order Has Been Shipped - {order.order_number}",
            'delivered': f"Your Order Has Been Delivered - {order.order_number}",
        }

        template_map = {
            'confirmed': 'emails/status_confirmed.html',
            'processing': 'emails/status_processing.html',
            'shipped': 'emails/status_shipped.html',
            'delivered': 'emails/status_delivered.html',
        }

        text_template_map = {
            'confirmed': 'emails/status_confirmed.txt',
            'processing': 'emails/status_processing.txt',
            'shipped': 'emails/status_shipped.txt',
            'delivered': 'emails/status_delivered.txt',
        }

        if status not in status_subjects:
            logger.warning(f"Unknown status for email: {status}")
            return

        context = _prepare_order_context(order)
        subject = status_subjects[status]

        # Render HTML and plain text
        html_content = render_to_string(template_map[status], context)
        text_content = render_to_string(text_template_map[status], context)

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[order.email]
        )
        email.attach_alternative(html_content, "text/html")
        email.send(fail_silently=False)

        logger.info(f"Status change email ({status}) sent for order {order.order_number} to {order.email}")

    except Exception as e:
        logger.error(f"Failed to send status change email ({status}) for order {order.order_number}: {str(e)}", exc_info=True)


def _prepare_order_context(order):
    """
    Prepare context dictionary for email templates.
    Includes all order details, items, and pricing information.
    """
    # Get all order items
    order_items = order.items.select_related(
        'product', 'variant', 'variant__color', 'size'
    ).all()

    items_list = []
    for item in order_items:
        items_list.append({
            'product_name': item.product.name,
            'variant_color': item.variant.color.name,
            'size': item.size.name,
            'quantity': item.quantity,
            'unit_price': item.unit_price,
            'total_price': item.total_price,
        })

    # Get status display name
    status_display_map = {
        'pending': 'Pending',
        'confirmed': 'Confirmed',
        'processing': 'Processing',
        'shipped': 'Shipped',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled',
    }

    payment_status_display_map = {
        'pending': 'Pending',
        'paid': 'Paid',
        'failed': 'Failed',
        'refunded': 'Refunded',
    }

    # Prepare full name
    customer_name = f"{order.first_name} {order.last_name}".strip()

    # Full shipping address
    address_parts = [order.address]
    if order.address_2:
        address_parts.append(order.address_2)
    address_parts.extend([order.city, order.state, order.postal_code])
    full_address = ', '.join(filter(None, address_parts))

    return {
        'order': order,
        'order_number': order.order_number,
        'order_date': order.created_at,
        'customer_name': customer_name,
        'customer_email': order.email,
        'customer_phone': order.phone_number,
        'shipping_address': full_address,
        'items': items_list,
        'item_count': len(items_list),
        'subtotal': order.subtotal,
        'shipping_charge': order.shipping_charge,
        'total_amount': order.total_amount,
        'payment_status': payment_status_display_map.get(order.payment_status, order.payment_status),
        'order_status': status_display_map.get(order.status, order.status),
        'store_name': 'COMFY CUTE',
        'store_email': getattr(settings, 'STORE_EMAIL', settings.DEFAULT_FROM_EMAIL),
    }
