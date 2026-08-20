# Email System Testing Checklist

Complete this checklist to verify the email notification system is working correctly.

---

## Phase 1: Setup Verification (5 minutes)

### Files Exist
- [ ] `ComfyCuteApp/email_helpers.py` exists
- [ ] `ComfyCuteApp/signals.py` exists
- [ ] `ComfyCuteApp/apps.py` has `ready()` method
- [ ] `templates/emails/` directory exists with 13 template files
- [ ] `ComfyCute/settings.py` has `STORE_EMAIL` configured

### Django Starts Without Errors
```bash
python manage.py runserver
```
- [ ] Server starts successfully
- [ ] No import errors about signals
- [ ] No errors about email templates

### Settings Configured
```python
# In Django shell:
from django.conf import settings
print(settings.EMAIL_HOST_USER)
print(settings.STORE_EMAIL)
```
- [ ] OUTPUT shows correct email addresses
- [ ] OUTPUT is not empty or None

---

## Phase 2: New Order Email Test (10 minutes)

### Checkout Flow
1. Open `http://localhost:8000/checkout/`
2. Verify cart has items (if empty, add some products)
3. Fill checkout form:
   ```
   Email: test123@example.com
   First Name: Test
   Last Name: User
   Phone: 9876543210
   Address: 123 Main Street
   Apartment: Suite 100
   City: Bangalore
   State: Karnataka
   Postal Code: 560001
   ```
4. Click "Place Order" button

### Razorpay Payment
5. In Razorpay modal that opens:
   - Card Number: `4111 1111 1111 1111`
   - Expiry: Any future date (e.g., 12/25)
   - CVV: Any 3 digits (e.g., 123)
6. Click "Pay" button

### Results - Admin Email
- [ ] Order success page displays (within 2 seconds)
- [ ] Admin email arrives in `STORE_EMAIL` inbox (within 2 seconds)
- [ ] Subject line: "New Order Received - ORD-..."
- [ ] Contains order number
- [ ] Contains customer name
- [ ] Contains customer email
- [ ] Contains customer phone
- [ ] Contains delivery address
- [ ] Contains all ordered items
- [ ] Contains prices for each item
- [ ] Contains subtotal
- [ ] Contains shipping charge
- [ ] Contains grand total
- [ ] Email styling looks professional
- [ ] All colors are correct (COMFY CUTE branding)

### Results - Customer Email
- [ ] Customer email arrives at `test123@example.com` (within 2 seconds)
- [ ] Subject line: "Order Confirmed - ORD-... | COMFY CUTE"
- [ ] Contains "Thank you for shopping"
- [ ] Contains order number
- [ ] Contains delivery address
- [ ] Contains all ordered items
- [ ] Contains order totals
- [ ] Contains "Continue Shopping" button
- [ ] Email is formatted with COMFY CUTE colors
- [ ] "Download Invoice" section visible (as placeholder)

### Timing Test
- [ ] Success page loaded BEFORE emails arrived (async verification)
- [ ] Admin page responsive (order created fast)
- [ ] No waiting for email delivery

---

## Phase 3: Status Change Email Test (10 minutes)

### Test Status: confirmed → processing

1. Go to Django Admin: `http://localhost:8000/admin/`
2. Click "Orders" in sidebar
3. Click the order from Phase 2 test
4. Scroll down to "Order Status" section
5. Change status dropdown: `confirmed` → `processing`
6. Click "Save" button

### Results
- [ ] Admin console saves immediately (no delay)
- [ ] Processing email arrives at customer email within 2 seconds
- [ ] Subject line contains order number
- [ ] Subject line says "Your Order is Being Prepared"
- [ ] Email contains "⏳ Your Order is Being Prepared"
- [ ] Email shows current status is "🔄 Being Prepared"
- [ ] Email contains order items
- [ ] Email contains order total
- [ ] Email contains timeline

### Test Status: processing → shipped

7. Go back to same order in Admin
8. Change status: `processing` → `shipped`
9. Click "Save"

### Results
- [ ] Shipped email arrives within 2 seconds
- [ ] Subject line says "Your Order Has Been Shipped"
- [ ] Email contains "🎉 Your Order Has Been Shipped!"
- [ ] Email contains tracking information section
- [ ] Email shows package contents
- [ ] Email contains expected delivery timeline

### Test Status: shipped → delivered

10. Go back to same order in Admin
11. Change status: `shipped` → `delivered`
12. Click "Save"

### Results
- [ ] Delivered email arrives within 2 seconds
- [ ] Subject line says "Your Order Has Been Delivered"
- [ ] Email contains "🎁 Your Order Has Been Delivered!"
- [ ] Email contains feedback request
- [ ] Email contains return/exchange information
- [ ] Email has "Shop Again" and "Send Feedback" buttons

---

## Phase 4: No Duplicate Email Test (5 minutes)

### Setup
1. Go to any order in Admin
2. Current status should be: `delivered`
3. Note the customer email address

### Test
4. Click "Save" WITHOUT making any changes
5. Click "Save" again WITHOUT making any changes
6. Click "Save" a third time WITHOUT making any changes

### Results
- [ ] NO emails sent (because status didn't change)
- [ ] Customer inbox shows same number of emails as before
- [ ] Admin page saved successfully each time
- [ ] No errors in Django console

---

## Phase 5: Email Content Validation (10 minutes)

### Open Most Recent Customer Email

Open the "New Order" customer email received in Phase 2.

### Verify All Content Sections
- [ ] Header shows COMFY CUTE branding
- [ ] Header color is correct (#8CBDBC)
- [ ] "Order Confirmed" badge visible
- [ ] Order number visible: ORD-...
- [ ] Order date visible and correct
- [ ] "Your Information" section shows customer name
- [ ] Customer email visible
- [ ] Customer phone visible
- [ ] "Delivery Address" shows full address with all parts
- [ ] Order items table shows:
  - [ ] Product names
  - [ ] Variant/color information
  - [ ] Size information
  - [ ] Quantities
  - [ ] Unit prices
  - [ ] Item totals
- [ ] Subtotal line visible
- [ ] Shipping charge line visible
- [ ] Grand total line (bold)
- [ ] "What's Next?" section explains timeline
- [ ] "Download Invoice" section visible
- [ ] "Track Your Order" button present
- [ ] "Continue Shopping" button present
- [ ] Footer shows COMFY CUTE © year
- [ ] Footer links work (clickable)

### Test Plain Text Version
- [ ] Request plain text version from your email client
- [ ] All text is readable without HTML
- [ ] Order details are clear in plain text
- [ ] No HTML tags visible
- [ ] Line breaks are proper

---

## Phase 6: Email Styling Test (5 minutes)

### Test in Multiple Email Clients (if possible)

#### Gmail
- [ ] Email displays correctly
- [ ] Colors show properly
- [ ] Images load (if any)
- [ ] Buttons are clickable
- [ ] Text is readable

#### Outlook (if available)
- [ ] Email displays correctly
- [ ] Styling intact
- [ ] No broken layout
- [ ] Text is readable

#### Apple Mail (if available)
- [ ] Email displays correctly
- [ ] Alignment is correct
- [ ] Colors display properly
- [ ] Mobile responsive

### Mobile Responsiveness
On a mobile phone or use browser mobile view:
- [ ] Email width adjusts properly
- [ ] Text is readable
- [ ] Buttons are clickable
- [ ] Layout doesn't break
- [ ] Images scale correctly

---

## Phase 7: Error Handling Test (5 minutes)

### Test Email Failure Doesn't Block Order

1. Temporarily break SMTP configuration:
   ```python
   # In settings.py, change:
   EMAIL_HOST_PASSWORD = 'wrong-password'
   ```
2. Restart Django
3. Go through complete checkout flow again

### Results
- [ ] Order success page still displays
- [ ] Payment verification succeeds
- [ ] Order status changes to confirmed
- [ ] Stock is reduced
- [ ] Cart is cleared
- [ ] Error appears in Django console (but doesn't block operation)
- [ ] Orders table shows the order
- [ ] Can manually resend emails later if needed

### Restore Configuration
4. Fix the email password
5. Restart Django
6. Test again to verify emails work

---

## Phase 8: Multiple Orders Test (5 minutes)

### Create Three Orders

1. **Order 1**: Test with different customer email
   - Complete checkout and payment
   - Verify both emails arrive

2. **Order 2**: Test status changes
   - Create order
   - Change status multiple times
   - Verify each email arrives

3. **Order 3**: Test edge case
   - Different product types
   - Different quantities
   - Verify email shows correct items

### Results
- [ ] Each order generates unique emails
- [ ] No emails get mixed up
- [ ] Each customer receives correct information
- [ ] Emails arrive sequentially
- [ ] No duplicate emails

---

## Phase 9: Signal Firing Test (5 minutes)

### Enable Debug Logging (Optional)

Add to `settings.py`:
```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG',
    },
}
```

### Watch Django Console

1. Complete a checkout flow
2. Watch Django console output
3. Look for log messages like:
   ```
   INFO: New order created: ORD-20260820-ABC123
   INFO: Sending new order confirmation emails for ORD-20260820-ABC123
   INFO: Admin new order email sent
   INFO: Customer new order email sent
   ```

### Results
- [ ] Log messages appear for new order
- [ ] Log messages appear for status changes
- [ ] Signal is firing correctly
- [ ] No error messages in logs

---

## Phase 10: Production Readiness (5 minutes)

### Before Going Live

- [ ] All tests in Phases 1-9 passed
- [ ] Email configuration is production-ready
- [ ] STORE_EMAIL is set to actual admin email
- [ ] EMAIL_HOST_USER uses production credentials
- [ ] DEFAULT_FROM_EMAIL shows professional sender
- [ ] Django DEBUG is False for production
- [ ] ALLOWED_HOSTS has production domain
- [ ] Email templates are customized if needed
- [ ] Brand colors match your company
- [ ] Email content is reviewed and approved
- [ ] Tested one complete flow in production environment

### Post-Deployment

- [ ] Monitor first few orders for email issues
- [ ] Check spam folder for any emails
- [ ] Collect customer feedback
- [ ] Monitor Django logs for errors
- [ ] Set up email monitoring if available

---

## Summary Table

| Test | Status | Notes |
|------|--------|-------|
| Setup verification | ☐ | Files and config check |
| New order admin email | ☐ | Admin receives notification |
| New order customer email | ☐ | Customer receives confirmation |
| Status: confirmed | ☐ | Email on status change |
| Status: processing | ☐ | Email on status change |
| Status: shipped | ☐ | Email on status change |
| Status: delivered | ☐ | Email on status change |
| No duplicate emails | ☐ | Verify signal logic works |
| Email content | ☐ | All sections present |
| Email styling | ☐ | Mobile and desktop views |
| Error handling | ☐ | Order succeeds if email fails |
| Multiple orders | ☐ | No mixing or duplicates |
| Signal logging | ☐ | Correct log messages |
| Production readiness | ☐ | All checks passed |

---

## Issues Found

### Issue 1
**Date**: ___________
**Symptom**: ___________
**Root Cause**: ___________
**Resolution**: ___________
**Status**: ☐ Resolved ☐ Pending

### Issue 2
**Date**: ___________
**Symptom**: ___________
**Root Cause**: ___________
**Resolution**: ___________
**Status**: ☐ Resolved ☐ Pending

---

## Sign-Off

- [ ] All tests completed
- [ ] No critical issues found
- [ ] System ready for production
- [ ] Documentation reviewed
- [ ] Team trained on system

**Date Tested**: ___________
**Tested By**: ___________
**Approved By**: ___________

---

## Quick Reference

**If emails not sending**:
1. Check `STORE_EMAIL` in settings
2. Check EMAIL credentials
3. Look at Django console for errors
4. Test SMTP manually with Django shell

**If emails going to spam**:
1. Use proper sender email (not generic)
2. Set up SPF/DKIM records (for production)
3. Ask customers to mark as "Not Spam"

**If status emails not sending**:
1. Verify status actually changed
2. Check Django console logs
3. Confirm signal is firing (check logs)

**If emails are slow**:
1. This is normal (async)
2. Order operations not blocked
3. Check SMTP server response times

---

**Good luck! 🚀**
