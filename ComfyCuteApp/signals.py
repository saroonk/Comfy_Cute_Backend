"""
Django signals for COMFY CUTE order email notifications.

This module sets up signal handlers to:
1. Send "new order" emails when an Order is created and status changes from pending→confirmed
2. Send "status change" emails when Order.status changes (detected via pre_save and post_save)

Important threading notes:
- pre_save: Get the old status before saving
- post_save: Trigger async email sending after save
- Email sending uses background threading, does NOT block the request
"""

import logging
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from .models import Order
from .email_helpers import send_email_async

logger = logging.getLogger(__name__)

# Store the previous status for each order instance during pre_save
# This allows us to detect actual status changes in post_save
_order_previous_status = {}


@receiver(pre_save, sender=Order)
def order_pre_save(sender, instance, **kwargs):
    """
    Pre-save signal handler: Capture the previous status before the order is saved.

    This is called BEFORE the order is actually saved to the database.
    We store the old status so we can detect changes in the post_save handler.
    """
    try:
        if instance.pk:  # Only if it's an existing order (has a primary key)
            old_instance = Order.objects.get(pk=instance.pk)
            _order_previous_status[instance.pk] = old_instance.status
        else:
            # New order being created
            _order_previous_status[instance.pk] = None
    except Order.DoesNotExist:
        _order_previous_status[instance.pk] = None
    except Exception as e:
        logger.error(f"Error in order_pre_save: {str(e)}")


@receiver(post_save, sender=Order)
def order_post_save(sender, instance, created, **kwargs):
    """
    Post-save signal handler: Trigger email notifications after order is saved.

    Handles two cases:
    1. New order created (created=True): Send new order emails
    2. Order status changed: Send status change emails
    """
    try:
        if created:
            # New order created - but status starts as 'pending', so wait for confirmation
            # We'll send "new order" email when status changes to 'confirmed'
            logger.info(f"New order created: {instance.order_number} (status={instance.status})")

        else:
            # Existing order being updated
            old_status = _order_previous_status.get(instance.pk)

            # Check if status actually changed
            if old_status != instance.status:
                logger.info(f"Order {instance.order_number} status changed: {old_status} → {instance.status}")

                # When order transitions from pending→confirmed, send the "new order" confirmation emails
                if old_status == 'pending' and instance.status == 'confirmed':
                    logger.info(f"Sending new order confirmation emails for {instance.order_number}")
                    send_email_async('new_order', instance.pk)

                # For other status transitions, send customer notification
                elif instance.status in ['confirmed', 'processing', 'shipped', 'delivered']:
                    # Only send status change emails if transitioning to one of these statuses
                    # Skip if this was the pending→confirmed transition (already handled above)
                    if not (old_status == 'pending' and instance.status == 'confirmed'):
                        logger.info(f"Sending {instance.status} status email for {instance.order_number}")
                        send_email_async(instance.status, instance.pk)

    except Exception as e:
        logger.error(f"Error in order_post_save for order {instance.pk}: {str(e)}", exc_info=True)

    finally:
        # Clean up the stored status to avoid memory leak
        if instance.pk in _order_previous_status:
            del _order_previous_status[instance.pk]
