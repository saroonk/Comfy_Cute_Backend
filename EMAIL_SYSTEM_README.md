# COMFY CUTE Order Email Notification System

## Overview

This document describes the order email notification system for COMFY CUTE. The system uses Django signals to detect order creation and status changes, and sends emails asynchronously using background threading to avoid blocking the main request.

## Features

### 1. New Order Emails
When an order transitions from `pending` → `confirmed` status (after successful payment):
- **Admin/Store Email**: Detailed notification with all order details, customer info, and items
- **Customer Email**: Professional confirmation with order summary, next steps, and order tracking

### 2. Status Change Emails
When order status changes to any of the following:
- **confirmed**: "Your Order is Confirmed" email
- **processing**: "Your Order is Being Prepared" email
- **shipped**: "Your Order Has Been Shipped" email
- **delivered**: "Your Order Has Been Delivered" email

## Architecture

### Files Created/Modified

```
ComfyCuteApp/
├── signals.py                    # NEW: Django signal handlers
├── email_helpers.py              # NEW: Email sending helpers with async threading
├── apps.py                       # MODIFIED: Added ready() method to load signals
└── admin.py                      # EXISTING: No changes (order status changes here trigger emails)

templates/emails/                 # NEW: Email templates
├── base_email.html              # Base template with COMFY CUTE branding
├── new_order_admin.html         # Admin notification (new order)
├── new_order_admin.txt          # Admin notification (plain text)
├── new_order_customer.html      # Customer confirmation (new order)
├── new_order_customer.txt       # Customer confirmation (plain text)
├── status_confirmed.html        # Customer notification (confirmed status)
├── status_confirmed.txt         # Customer notification (plain text)
├── status_processing.html       # Customer notification (processing status)
├── status_processing.txt        # Customer notification (plain text)
├── status_shipped.html          # Customer notification (shipped status)
├── status_shipped.txt           # Customer notification (plain text)
├── status_delivered.html        # Customer notification (delivered status)
└── status_delivered.txt         # Customer notification (plain text)

settings.py                       # MODIFIED: Added STORE_EMAIL configuration
```

## How It Works

### Signal Flow

1. **Order Creation** (in `place_order()` view):
   - Order is created with `status='pending'`
   - No email sent at this stage

2. **Payment Verification** (in `verify_order_payment()` view):
   - Payment is verified
   - Order status changes from `pending` → `confirmed`
   - `order.save()` triggers the signal

3. **Signal Detection**:
   - `pre_save` signal: Captures the old status (`pending`)
   - `post_save` signal: Detects that status changed to `confirmed`
   - Triggers `send_email_async('new_order', order_id)`

4. **Async Email Sending**:
   - Background thread starts immediately
   - Main request continues (no blocking)
   - Thread sends both admin and customer emails

5. **Admin Status Changes** (in Django Admin):
   - Admin changes order status (e.g., `confirmed` → `processing`)
   - Order is saved
   - Signal detects status change
   - Appropriate customer email is sent asynchronously

### Threading Safety

**Important**: The email sending happens in a daemon thread with a fresh database connection:

```python
# In email_helpers.py:
# 1. Backend thread receives only: email_type and order_id (no ORM objects)
# 2. Thread retrieves the Order fresh from database
# 3. Email is sent independently
# 4. Order/payment operations are NOT blocked if email fails
```

This approach ensures:
- ✅ Order creation is never blocked by email delivery
- ✅ Payment verification is never blocked by email delivery
- ✅ Admin status updates are never blocked by email delivery
- ✅ Email failures don't cause transaction rollbacks
- ✅ No stale ORM data in background threads

## Configuration

### Settings (ComfyCute/settings.py)

```python
# Email configuration (already in settings)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'your-app-password'
DEFAULT_FROM_EMAIL = 'your-email@gmail.com'

# Store email for admin/store notifications
STORE_EMAIL = 'admin@comfycute.com'  # Change to your store email
```

### Email Address Customization

To change which email receives admin/store notifications:
1. Open `ComfyCute/settings.py`
2. Find the `STORE_EMAIL` setting
3. Update to your desired email address
4. Restart Django development server

## Email Templates

### Base Template (`base_email.html`)

Contains:
- Professional header with COMFY CUTE branding
- Color scheme matching brand (primary: #8CBDBC)
- Responsive design for mobile/desktop
- Footer with links and copyright

### Email Types

#### 1. New Order Emails (triggered when payment is confirmed)

**Admin Email** (`new_order_admin.html`):
- Alert notification style
- Full order details
- Customer information
- All items with prices
- Financial summary
- Admin action link

**Customer Email** (`new_order_customer.html`):
- Friendly confirmation style
- Order summary
- Delivery address
- Items overview
- Order timeline
- CTA buttons (View Order, Continue Shopping)
- Invoice download placeholder (ready for future implementation)

#### 2. Status Change Emails (customer only)

**Confirmed** (`status_confirmed.html`):
- Order confirmation details
- Order summary
- Timeline with step indicators
- Delivery address
- Expected processing timeframe

**Processing** (`status_processing.html`):
- "Being Prepared" message
- Item packing timeline
- Current status indicators
- What's being done with items
- Delivery information

**Shipped** (`status_shipped.html`):
- "On its way" celebration
- Tracking information details
- Items in package summary
- Delivery timeline
- Important notes for recipient

**Delivered** (`status_delivered.html`):
- Delivery confirmation
- Item confirmation
- Next steps (inspect, try on, feedback)
- Feedback/review request
- Return/exchange information
- Thank you message

## Testing

### Test Scenario 1: New Order Email

1. **Open checkout**: `http://localhost:8000/checkout/`
2. **Add items to cart** (if empty)
3. **Fill checkout form** with test data:
   - Email: test@example.com
   - Name: John Doe
   - Phone: 9876543210
   - Address: 123 Main St
   - City: Bangalore
   - State: Karnataka
   - Postal Code: 560001
4. **Click "Place Order"**
5. **In Razorpay modal**: Complete test payment
6. **Expected**:
   - Order success page displays
   - ✅ Admin receives "New Order Received" email to STORE_EMAIL
   - ✅ Customer receives "Order Confirmed" email to test@example.com
   - ✅ Both emails arrive within 1-2 seconds (async)

### Test Scenario 2: Status Change Emails

1. **Go to Django Admin**: `http://localhost:8000/admin/`
2. **Navigate to Orders**: Find the order from Scenario 1
3. **Change status** from `confirmed` → `processing`
4. **Click Save**
5. **Expected**:
   - ✅ Customer receives "Your Order is Being Prepared" email within 1-2 seconds
   - ✅ Admin panel status changes immediately (no waiting for email)

**Repeat for other status changes**:
- `processing` → `shipped`: Customer receives shipping notification
- `shipped` → `delivered`: Customer receives delivery confirmation

### Test Scenario 3: Verify No Duplicate Emails

1. **Go to Django Admin**
2. **Open the same order**
3. **Change status** `processing` → `shipped`
4. **Click Save**
5. **Without changing anything, click Save again**
6. **Expected**:
   - ✅ First save: Email sent
   - ✅ Second save: NO email sent (status didn't change)
   - ✅ Only one "Shipped" email received by customer

### Test Scenario 4: Email Failure Doesn't Block Order

1. **Temporarily misconfigure** email settings:
   - Change `STORE_EMAIL` to an invalid format
   - Change `EMAIL_PASSWORD` to wrong password
2. **Go through checkout** and complete payment
3. **Expected**:
   - ✅ Order creation succeeds
   - ✅ Payment verification succeeds
   - ✅ Order success page displays immediately
   - ✅ Error logged in Django console (but operation not blocked)
   - ✅ Cart is cleared
   - ✅ Stock is reduced

### Test Scenario 5: Plain Text Fallback

1. **Use email client that doesn't support HTML** (rare)
2. **Send status change email**
3. **Expected**:
   - ✅ Email displays with plain text version
   - ✅ All information is readable
   - ✅ No broken formatting

## Logging & Debugging

### View Email Logs

Emails are logged when sent. Check Django console for:

```
INFO: Customer new order email sent for order ORD-20260820-ABC123 to customer@example.com
INFO: Admin new order email sent for order ORD-20260820-ABC123 to admin@comfycute.com
INFO: Status change email (processing) sent for order ORD-20260820-ABC123 to customer@example.com
```

### If Emails Aren't Sending

1. **Check email configuration**:
   ```python
   # In Django shell:
   from django.conf import settings
   print(settings.EMAIL_HOST_USER)
   print(settings.STORE_EMAIL)
   ```

2. **Test email sending directly**:
   ```python
   from django.core.mail import send_mail
   
   send_mail(
       'Test Email',
       'This is a test.',
       'from@example.com',
       ['to@example.com'],
       fail_silently=False,
   )
   ```

3. **Check Gmail requirements**:
   - Use "App Password" not regular password
   - Enable "Less secure app access" or generate app-specific password
   - Check if account has 2FA enabled

4. **View Django logs**:
   - Look for error messages in Django console
   - Check if `fail_silently=False` in `email.send()`

## Customization Guide

### Change Email Sender

Edit `ComfyCute/settings.py`:
```python
DEFAULT_FROM_EMAIL = 'noreply@comfycute.com'
```

### Change Store Email

Edit `ComfyCute/settings.py`:
```python
STORE_EMAIL = 'orders@comfycute.com'
```

### Modify Email Content

1. Find the template (e.g., `templates/emails/new_order_customer.html`)
2. Edit the HTML content
3. Save and restart Django server
4. Next email will use updated template

### Change Email Colors/Branding

Edit `templates/emails/base_email.html`:
```css
/* Primary color */
#8CBDBC

/* Hover color */
#6FAFAE

/* Secondary color */
#A9D6D5

/* Background color */
#FCFEFE
```

### Add Custom Context to Emails

Edit `ComfyCuteApp/email_helpers.py`:
```python
def _prepare_order_context(order):
    context = _prepare_order_context(order)
    
    # Add custom data
    context['custom_field'] = 'custom_value'
    
    return context
```

Then use in template:
```html
{{ custom_field }}
```

## Future Enhancements

### Planned (Not Yet Implemented)

1. **Invoice PDF Generation**
   - Generate PDF invoices when order is confirmed
   - Attach to new order customer email
   - Replace "Download Invoice" placeholder

2. **SMS Notifications**
   - Send SMS for major status changes
   - Integrate with Twilio or similar service

3. **Email Template Editor**
   - Admin interface to customize email templates
   - Without needing to edit HTML files

4. **Delivery Tracking Integration**
   - Auto-fetch tracking URL from courier API
   - Automatically send tracking email

5. **Retry Logic**
   - Retry failed email sends after timeout
   - Queue system for delivery confirmation

6. **Email Analytics**
   - Track email opens
   - Track link clicks
   - Monitor bounce rates

## Important Notes

### Do NOT Modify

❌ **Never change**:
- Order model structure
- Cart functionality
- Razorpay payment logic
- Checkout flow
- Payment verification

✅ **Safe to modify**:
- Email template content
- Email colors/styling
- Store email address
- Status transitions
- Signal logic

### Thread Safety

The system is designed to be thread-safe:
- ✅ Only passes `order_id`, not ORM objects
- ✅ Retrieves fresh Order instance in thread
- ✅ No database connection sharing
- ✅ Daemon threads don't keep processes alive

### Performance

Email sending is async:
- ✅ Request completes immediately
- ✅ Email sent in background (1-2 seconds typically)
- ✅ If SMTP is slow, background thread waits (not main request)
- ✅ Multiple emails can send in parallel (one thread each)

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Emails not sending | SMTP credentials wrong | Update EMAIL_HOST_USER, EMAIL_HOST_PASSWORD in settings |
| Emails going to spam | Domain/sender reputation | Use domain email (not Gmail) or verify SPF/DKIM |
| Slow email sending | SMTP server slow | This won't block main request (async) |
| Duplicate emails | Signal firing twice | Should not happen, signal has guards |
| Wrong email address | STORE_EMAIL misconfigured | Check STORE_EMAIL in settings.py |
| Template not found | Template path wrong | Check templates/emails/ directory exists |

## Support

For issues or questions:
1. Check Django console logs for error messages
2. Review email_helpers.py exception handling
3. Test SMTP connection independently
4. Verify email configuration in settings.py

---

**Created**: August 2026
**Status**: Production Ready
**Last Updated**: August 20, 2026
