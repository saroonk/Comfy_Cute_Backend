/**
 * Razorpay Payment Integration for Checkout
 * Handles payment flow from order placement to payment verification
 */

document.addEventListener('DOMContentLoaded', function() {
  const checkoutForm = document.getElementById('checkoutForm');

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', handleCheckoutSubmit);
  }
});

/**
 * Handle checkout form submission
 * Validates form, creates order, and initiates Razorpay payment
 */
async function handleCheckoutSubmit(e) {
  e.preventDefault();

  // Validate form using checkout.js helper if available
  if (typeof validateCheckoutForm === 'function' && !validateCheckoutForm()) {
    showNotification('Please fill in all required fields correctly.', 'error');
    return;
  }

  // Show loading state
  const submitButton = document.querySelector('[type="submit"][form="checkoutForm"]');
  if (!submitButton) return;

  const originalText = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

  try {
    // Get form data
    const formData = new FormData(document.getElementById('checkoutForm'));

    // Map form field names to backend format
    const mappedData = new FormData();

    // IMPORTANT: Include CSRF token from the form for Django CSRF protection
    const csrfToken = formData.get('csrfmiddlewaretoken');
    if (csrfToken) {
      mappedData.append('csrfmiddlewaretoken', csrfToken);
    }

    mappedData.append('email', formData.get('email'));
    mappedData.append('first_name', formData.get('fullName'));
    mappedData.append('last_name', formData.get('lastName'));
    mappedData.append('phone_number', formData.get('phone'));
    mappedData.append('address', formData.get('address'));
    mappedData.append('address_2', formData.get('apartment') || '');
    mappedData.append('city', formData.get('city'));
    mappedData.append('state', formData.get('state'));
    mappedData.append('postal_code', formData.get('pincode'));

    // Include current cart ID so backend can identify which cart we're checking out
    if (window.checkoutCartId) {
      mappedData.append('cart_id', window.checkoutCartId);
    }

    // Call place-order endpoint
    // IMPORTANT: credentials: 'include' sends session cookie so backend can identify current Cart
    const response = await fetch('/api/place-order/', {
      method: 'POST',
      credentials: 'include',  // Include session cookie
      body: mappedData,
    });

    const data = await response.json();

    // DEBUG: Log the response from place_order
    console.log('=== PLACE ORDER RESPONSE ===');
    console.log('Success:', data.success);
    console.log('Message:', data.message);
    if (data.success) {
      console.log('Django order_id:', data.order_id);
      console.log('Django order_number:', data.order_number);
      console.log('Razorpay order_id:', data.razorpay_order_id);
      console.log('Amount (paise):', data.amount);
      console.log('Amount display (rupees):', data.amount_display);
    }

    if (!data.success) {
      showNotification(data.message || 'Order creation failed', 'error');
      submitButton.disabled = false;
      submitButton.innerHTML = originalText;
      return;
    }

    // Order created successfully, initiate Razorpay payment
    console.log('=== CALLING INITIATE RAZORPAY PAYMENT ===');
    initiateRazorpayPayment(data);

  } catch (error) {
    console.error('Error:', error);
    showNotification('An error occurred. Please try again.', 'error');
    submitButton.disabled = false;
    submitButton.innerHTML = originalText;
  }
}

/**
 * Initiate Razorpay payment checkout
 */
function initiateRazorpayPayment(orderData) {
  // DEBUG: Log what we're about to initialize
  console.log('=== RAZORPAY INITIALIZATION ===');
  console.log('Django order_id:', orderData.order_id);
  console.log('Django order_number:', orderData.order_number);
  console.log('Razorpay order_id to use:', orderData.razorpay_order_id);
  console.log('Key ID:', orderData.razorpay_key_id ? orderData.razorpay_key_id.substring(0, 10) + '...' : 'MISSING');
  console.log('Amount (paise):', orderData.amount);

  const options = {
    key: orderData.razorpay_key_id,
    amount: orderData.amount, // in paise
    currency: 'INR',
    order_id: orderData.razorpay_order_id,  // CRITICAL: This MUST be the Razorpay order ID, not Django order.id
    name: 'COMFY CUTE',
    description: `Order ${orderData.order_number}`,
    image: '/static/images/logo.jpeg',
    email: orderData.email,
    contact: orderData.contact,

    handler: function(response) {
      console.log('=== RAZORPAY PAYMENT SUCCESS ===');
      console.log('Razorpay returned payment_id:', response.razorpay_payment_id);
      console.log('Razorpay returned order_id:', response.razorpay_order_id);
      verifyPayment(response, orderData);
    },

    prefill: {
      name: '', // Can be set to customer name if available
      email: orderData.email,
      contact: orderData.contact
    },

    notes: {
      order_number: orderData.order_number
    },

    theme: {
      color: '#6c757d'
    },

    modal: {
      ondismiss: function() {
        console.log('=== RAZORPAY MODAL DISMISSED ===');
        handlePaymentCancelled(orderData);
      }
    }
  };

  console.log('=== OPENING RAZORPAY MODAL ===');
  const rzp = new Razorpay(options);
  rzp.open();
}

/**
 * Verify payment with backend
 */
async function verifyPayment(razorpayResponse, orderData) {
  const submitButton = document.querySelector('[type="submit"][form="checkoutForm"]');
  if (submitButton) {
    submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying Payment...';
  }

  try {
    // DEBUG: Log what Razorpay returned
    console.log('=== RAZORPAY RESPONSE ===');
    console.log('razorpay_payment_id:', razorpayResponse.razorpay_payment_id);
    console.log('razorpay_order_id:', razorpayResponse.razorpay_order_id);
    console.log('razorpay_signature:', razorpayResponse.razorpay_signature ? razorpayResponse.razorpay_signature.substring(0, 20) + '...' : 'MISSING');

    // DEBUG: Log what orderData contains
    console.log('=== ORDER DATA ===');
    console.log('order_id (Django):', orderData.order_id);
    console.log('razorpay_order_id (from place order response):', orderData.razorpay_order_id);
    console.log('order_number:', orderData.order_number);

    // DEBUG: Check for mismatches
    if (razorpayResponse.razorpay_order_id !== orderData.razorpay_order_id) {
      console.error('⚠️ RAZORPAY ORDER ID MISMATCH!');
      console.error('Razorpay returned:', razorpayResponse.razorpay_order_id);
      console.error('Place Order response had:', orderData.razorpay_order_id);
    }

    const verifyPayloadBody = {
      razorpay_payment_id: razorpayResponse.razorpay_payment_id,
      razorpay_order_id: razorpayResponse.razorpay_order_id,
      razorpay_signature: razorpayResponse.razorpay_signature,
      order_id: orderData.order_id,
    };

    console.log('=== SENDING TO BACKEND ===');
    console.log('Payload:', verifyPayloadBody);

    // IMPORTANT: credentials: 'include' sends session cookie for cart clearing
    const verifyResponse = await fetch('/api/verify-payment/', {
      method: 'POST',
      credentials: 'include',  // Include session cookie
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': document.querySelector('[name="csrfmiddlewaretoken"]')?.value || '',
      },
      body: JSON.stringify(verifyPayloadBody),
    });

    const verifyData = await verifyResponse.json();
    console.log('=== VERIFICATION RESPONSE ===');
    console.log('Success:', verifyData.success);
    console.log('Message:', verifyData.message);

    if (verifyData.success) {
      // Payment verified successfully, redirect to success page
      showNotification('Payment successful! Redirecting...', 'success');

      setTimeout(() => {
        window.location.href = `/order-success/?order_id=${orderData.order_id}`;
      }, 1500);
    } else {
      // Payment verification failed
      showNotification(verifyData.message || 'Payment verification failed', 'error');

      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Place Order &rarr;';
      }
    }

  } catch (error) {
    console.error('Verification error:', error);
    showNotification('Payment verification error. Please contact support.', 'error');

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = 'Place Order &rarr;';
    }
  }
}

/**
 * Handle payment cancellation
 */
async function handlePaymentCancelled(orderData) {
  try {
    // Notify backend that payment was cancelled
    // IMPORTANT: credentials: 'include' sends session cookie
    await fetch('/api/payment-failure/', {
      method: 'POST',
      credentials: 'include',  // Include session cookie
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': document.querySelector('[name="csrfmiddlewaretoken"]')?.value || '',
      },
      body: JSON.stringify({
        order_id: orderData.order_id,
      }),
    });

    showNotification('Payment cancelled. You can try again.', 'info');

    const submitButton = document.querySelector('[type="submit"][form="checkoutForm"]');
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = 'Place Order &rarr;';
    }

  } catch (error) {
    console.error('Cancellation error:', error);
  }
}

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
  const existing = document.querySelector('.checkout-notification');
  if (existing) {
    existing.remove();
  }

  const notification = document.createElement('div');
  notification.className = `checkout-notification checkout-notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fa-solid fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${message}</span>
    </div>
  `;

  if (!document.querySelector('style[data-checkout-notify]')) {
    const style = document.createElement('style');
    style.setAttribute('data-checkout-notify', '');
    style.textContent = `
      .checkout-notification {
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        max-width: 500px;
        width: 90%;
        padding: 1rem;
        border-radius: 0.375rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        animation: slideDown 0.3s ease;
      }

      .checkout-notification-success {
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      }

      .checkout-notification-error {
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }

      .checkout-notification-info {
        background-color: #d1ecf1;
        color: #0c5460;
        border: 1px solid #bee5eb;
      }

      .notification-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideDown 0.3s ease reverse';
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}
