# COMFY CUTE Email System - Quick Start Guide

## ⚡ 30-Second Setup

The email system is **already configured and ready to use**. No additional setup required!

### What You Need to Know

1. **Email Configuration** (in `settings.py`):
   - ✅ SMTP is already configured with Gmail
   - ✅ Emails will be sent FROM: `saroonsharu@gmail.com`
   - ✅ Admin emails go TO: `saroonsharu@gmail.com` (see STORE_EMAIL below)

2. **To change admin email address** (where store notifications go):
   ```python
   # Open: ComfyCute/settings.py
   # Find: STORE_EMAIL = 'saroonsharu@gmail.com'
   # Change to: STORE_EMAIL = 'your-admin-email@example.com'
   # Save and restart Django
   ```

## 🧪 Test It (2 minutes)

### Test New Order Emails

1. Open your browser: `http://localhost:8000/checkout/`
2. Make sure cart has items
3. Fill checkout form:
   ```
   Email: youremail@test.com
   Name: Test User
   Phone: 9876543210
   Address: 123 Test St
   City: Bangalore
   State: Karnataka
   Postal: 560001
   ```
4. Click "Place Order"
5. In Razorpay modal, use test card: **4111 1111 1111 1111**
6. Fill expiry and CVV (any values)
7. Click "Pay"

### Expected Results

✅ **Order success page displays** (no waiting)
✅ **Admin email arrives** in `STORE_EMAIL` inbox (within 1-2 seconds)
✅ **Customer email arrives** at test email (within 1-2 seconds)

### Test Status Change Emails

1. Go to Django Admin: `http://localhost:8000/admin/`
2. Click "Orders"
3. Click the order from your test
4. Change status dropdown from `confirmed` → `processing`
5. Click "Save"

### Expected Results

✅ **Admin page loads immediately** (no delay)
✅ **Customer email arrives** (within 1-2 seconds) with "Your Order is Being Prepared"

## 📧 What Gets Sent

### When Order is Confirmed (After Payment)

**Admin Receives**: "New Order Received - ORD-20260820-ABC123"
- All order details
- Customer information
- Full items list with prices
- Admin link to manage order

**Customer Receives**: "Order Confirmed - ORD-20260820-ABC123 | COMFY CUTE"
- Order confirmation
- Order summary and timeline
- Delivery address
- Items overview
- Continue shopping button

### When Admin Changes Status

**Customer Receives Updates For**:
- `pending` → `confirmed`: "Your Order is Confirmed"
- `confirmed` → `processing`: "Your Order is Being Prepared"
- `processing` → `shipped`: "Your Order Has Been Shipped"
- `shipped` → `delivered`: "Your Order Has Been Delivered"

## 📝 Files Created

```
ComfyCuteApp/
├── email_helpers.py          ← Email sending logic
├── signals.py                ← Signal handlers for order events
└── apps.py                   ← (updated) Signal registration

templates/emails/             ← Email templates
├── base_email.html          ← Foundation template
├── new_order_admin.html      ← Admin notification (HTML)
├── new_order_admin.txt       ← Admin notification (plain text)
├── new_order_customer.html   ← Customer confirmation (HTML)
├── new_order_customer.txt    ← Customer confirmation (plain text)
├── status_confirmed.html     ← Status email (HTML)
├── status_confirmed.txt      ← Status email (plain text)
├── status_processing.html    ← Status email (HTML)
├── status_processing.txt     ← Status email (plain text)
├── status_shipped.html       ← Status email (HTML)
├── status_shipped.txt        ← Status email (plain text)
├── status_delivered.html     ← Status email (HTML)
└── status_delivered.txt      ← Status email (plain text)

settings.py                   ← (updated) Added STORE_EMAIL
```

## 🔧 Configuration

### Current Settings (in `settings.py`)

```python
# Email Server
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'saroonsharu@gmail.com'
EMAIL_HOST_PASSWORD = 'rtpobhetadmayvul'
DEFAULT_FROM_EMAIL = 'saroonsharu@gmail.com'

# Store Email (admin/store notifications)
STORE_EMAIL = 'saroonsharu@gmail.com'  # Change this to your store email
```

### What Can Be Customized

✅ **Easy to Change**:
- `STORE_EMAIL` - Where admin notifications go
- Email template colors (in base_email.html)
- Email template text (in individual templates)
- `DEFAULT_FROM_EMAIL` - Who emails come from

❌ **Do NOT Change**:
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS` - SMTP settings
- Order model or OrderItem model
- Payment verification logic
- Checkout flow

## 🎨 Customize Brand Colors

All emails use COMFY CUTE brand colors:

```css
Primary Color:    #8CBDBC  (Teal)
Hover Color:      #6FAFAE  (Dark Teal)
Secondary Color:  #A9D6D5  (Light Teal)
Background Color: #FCFEFE  (Off-white)
```

To change them:
1. Open `templates/emails/base_email.html`
2. Find the color hex codes in the `<style>` section
3. Replace with your brand colors
4. Save and restart Django

## ❓ Troubleshooting

### "I don't see emails"

1. **Check STORE_EMAIL setting**:
   ```python
   # Open: ComfyCute/settings.py
   # Look for: STORE_EMAIL = 'your-email@example.com'
   # Verify email address is correct
   ```

2. **Check email spam folder**:
   - Gmail may put auto-generated emails in spam
   - Mark as "Not Spam" to whitelist sender

3. **Check Django logs** for errors:
   - Open terminal where Django is running
   - Look for error messages about email sending

4. **Verify SMTP credentials**:
   ```python
   # If using Gmail, make sure:
   # - Use "App Password" (not regular password)
   # - Have 2FA enabled on Gmail account
   # - Generate app-specific password from: myaccount.google.com/apppasswords
   ```

### "Emails are slow"

**This is normal and expected!**
- Emails are sent in background (async)
- Main request returns immediately
- Email sending happens in separate thread (1-2 seconds typically)
- Slow SMTP doesn't block your order/payment operations

### "Django server won't start"

1. Check for Python errors in console
2. Make sure `templates/emails/` directory exists
3. Verify `ComfyCuteApp/signals.py` has no syntax errors
4. Check that `apps.py` has `ready()` method

## 📚 More Information

**Detailed Documentation**: See `EMAIL_SYSTEM_README.md` for:
- Complete feature overview
- How it works under the hood
- Advanced customization
- Testing procedures
- Debugging guide
- Future enhancements

**Implementation Details**: See `EMAIL_IMPLEMENTATION_SUMMARY.md` for:
- What was implemented
- How threading works
- What wasn't changed
- Complete file listing

## ✅ Verification Checklist

Before going to production:

- [ ] Tested new order emails (admin receives)
- [ ] Tested new order emails (customer receives)
- [ ] Tested status change emails (customer receives)
- [ ] Verified email content is correct
- [ ] Checked email styling displays properly
- [ ] Tested with multiple orders
- [ ] Verified admin save doesn't get blocked by email
- [ ] Set production email address in STORE_EMAIL
- [ ] Set production SMTP credentials if different
- [ ] Tested from actual production domain

## 🚀 Go Live Checklist

Before deployment:

- [ ] Update `STORE_EMAIL` to production email
- [ ] Update `EMAIL_HOST_USER` if using different email
- [ ] Update `EMAIL_HOST_PASSWORD` with production credentials
- [ ] Update `DEFAULT_FROM_EMAIL` with production sender
- [ ] Test one complete order flow with production emails
- [ ] Verify emails arrive (not in spam)
- [ ] Set Django `DEBUG = False` in production settings
- [ ] Update `ALLOWED_HOSTS` with production domain
- [ ] Test on staging environment first

## 💡 Pro Tips

1. **Test emails without sending**:
   ```python
   # In Django shell:
   from django.core.mail import EmailMultiAlternatives
   email = EmailMultiAlternatives(...)
   print(email.message())  # See raw email content
   ```

2. **Monitor email sending**:
   - Check Django logs for "email sent" messages
   - Look for error logs if something fails

3. **Customize without code**:
   - Edit email templates directly (no restart needed)
   - Changes apply when template is next rendered

4. **Keep emails simple**:
   - Email clients have limited CSS support
   - Use inline styles instead of external stylesheets
   - Test in multiple email clients (Gmail, Outlook, Apple Mail)

## 🤝 Support

If you encounter issues:

1. **Check the logs**: Django console shows what's happening
2. **Read the detailed docs**: `EMAIL_SYSTEM_README.md`
3. **Review implementation**: `EMAIL_IMPLEMENTATION_SUMMARY.md`
4. **Test SMTP connection**:
   ```python
   from django.core.mail import send_mail
   send_mail('Test', 'Test message', 'from@example.com', ['to@example.com'])
   ```

---

**Ready to go!** 🎉

The email system is fully implemented and ready to use. Start testing with the steps above.

For detailed information, see the comprehensive documentation files.
