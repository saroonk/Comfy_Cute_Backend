# Multiple Orders Support - Code Changes Reference

## Change 1: Backend API Response

### File: `ComfyCuteApp/views.py`
**Location:** Lines 1751-1808

#### OLD: Single Order Response
```python
# Search for orders
orders = Order.objects.select_related('user').prefetch_related(...).filter(query_filter)

# ... filtering logic ...

# Get only the last order
order = orders.last()

# Build single order response
order_data = {
    'order_number': order.order_number,
    'status': order.status,
    ...
}

return JsonResponse(order_data)
```

#### NEW: Multiple Orders Response
```python
# Search for orders
orders = Order.objects.select_related('user').prefetch_related(...).filter(query_filter)

# ... filtering logic ...

# Exclude orders with failed payment status
orders = orders.exclude(payment_status='failed')

if not orders.exists():
    return JsonResponse({
        'error': 'No orders found matching your search criteria'
    }, status=404)

# Build response with ALL matching orders
orders_list = []
for order in orders.order_by('-created_at'):
    order_data = {
        'order_number': order.order_number,
        'status': order.status,
        'created_at': order.created_at.isoformat(),
        'total_amount': float(order.total_amount),
        'first_name': order.first_name,
        'last_name': order.last_name,
        'email': order.email,
        'phone_number': order.phone_number,
        'address': order.address,
        'city': order.city,
        'state': order.state,
        'postal_code': order.postal_code,
        'items': [
            {
                'product_name': item.product.name,
                'variant_color': item.variant.color.name,
                'size': item.size.name,
                'quantity': item.quantity,
                'unit_price': float(item.unit_price),
                'total_price': float(item.total_price),
            }
            for item in order.items.all()
        ]
    }
    orders_list.append(order_data)

logger.info(f"Orders tracked via search: {len(orders_list)} order(s) found")
return JsonResponse({'orders': orders_list})
```

---

## Change 2: Frontend Response Handling

### File: `static/js/track-order.js`
**Location:** Lines 102-129

#### OLD: Single Order Handling
```javascript
.then(data => {
  if (data.error) {
    showAlert('error', data.error);
    return;
  }

  // Display the single order
  displayOrderStatus(data);
  document.getElementById('orderStatusSection').scrollIntoView({ behavior: 'smooth' });
})
```

#### NEW: Multiple Orders Handling
```javascript
.then(data => {
  if (data.error) {
    showAlert('error', data.error);
    return;
  }

  // Handle both single order (legacy) and multiple orders (new format)
  if (data.orders) {
    // New format: array of orders
    displayMultipleOrders(data.orders);
  } else {
    // Legacy format: single order object
    displayOrderStatus(data);
  }
  document.getElementById('orderStatusSection').scrollIntoView({ behavior: 'smooth' });
})
```

---

## Change 3: New JavaScript Functions

### Function 1: displayMultipleOrders()
```javascript
function displayMultipleOrders(ordersArray) {
  const statusSection = document.getElementById('orderStatusSection');

  // Clear existing content
  statusSection.innerHTML = '';

  // Create container
  const container = document.createElement('div');
  container.className = 'container';

  // Create a card for each order
  ordersArray.forEach((order, index) => {
    const orderCard = createOrderCard(order, index);
    container.appendChild(orderCard);
  });

  statusSection.appendChild(container);
  statusSection.style.display = 'block';
}
```

### Function 2: createOrderCard()
```javascript
function createOrderCard(order, index) {
  const card = document.createElement('div');
  card.className = 'tracking-card';

  // Build HTML for order card with:
  // - Order header (number, date, amount)
  // - Timeline (with unique IDs using index)
  // - Order items list
  // - Dividers

  card.innerHTML = `
    <!-- HTML structure with data-order-index="${index}" -->
    <div class="tracking-card">
      <div class="tracking-card-header">
        <h3 class="order-title">Order #<span>${order.order_number}</span></h3>
        ...
      </div>
      <div class="timeline-track" data-order-index="${index}">
        <!-- Timeline with indexed IDs -->
        <div id="status-confirmed-multi-${index}">...</div>
        ...
      </div>
      <div class="tracking-items-container-multi" id="items-${index}">...</div>
    </div>
  `;

  // Populate items and update timeline for this order
  const itemsContainer = card.querySelector(`#items-${index}`);
  // ... render items ...

  updateTimelineForOrder(order.status, index);

  return card;
}
```

### Function 3: updateTimelineForOrder()
```javascript
function updateTimelineForOrder(status, orderIndex) {
  const statusStages = ['confirmed', 'processing', 'packed', 'shipped', 'out-for-delivery', 'delivered'];

  // Map status to index
  let currentIndex = -1;
  switch (status) {
    case 'confirmed': currentIndex = 0; break;
    case 'processing': currentIndex = 1; break;
    case 'shipped': currentIndex = 3; break;
    case 'delivered': currentIndex = 5; break;
    case 'cancelled':
      markOrderCancelledForMultiple(orderIndex);
      return;
  }

  // Update timeline steps with indexed IDs
  statusStages.forEach((stage, index) => {
    const element = document.getElementById(`status-${stage}-multi-${orderIndex}`);
    if (element) {
      if (index < currentIndex) {
        element.classList.add('completed');
      } else if (index === currentIndex) {
        element.classList.add('active');
      }
    }
  });

  // Update progress line for this order
  const timelineTrack = document.querySelector(`[data-order-index="${orderIndex}"]`);
  if (timelineTrack) {
    updateTimelineProgress(timelineTrack);
  }
}
```

### Function 4: markOrderCancelledForMultiple()
```javascript
function markOrderCancelledForMultiple(orderIndex) {
  const timelineTrack = document.querySelector(`[data-order-index="${orderIndex}"]`);
  if (timelineTrack) {
    timelineTrack.innerHTML = '<p style="color: #d32f2f; text-align: center; font-weight: 600; padding: 30px;">This order has been cancelled</p>';
  }
}
```

---

## Key Implementation Details

### Backend: Payment Status Exclusion
```python
# Uses existing Order model field
orders = orders.exclude(payment_status='failed')

# payment_status choices from Order.PAYMENT_STATUS_CHOICES:
# - 'pending'
# - 'paid'
# - 'failed'  ← This one is excluded
# - 'refunded'
```

### Backend: Ordering
```python
# Returns orders sorted newest first
.order_by('-created_at')
```

### Frontend: Indexed Elements
```javascript
// Each order gets unique IDs to prevent conflicts
<div id="status-confirmed-multi-0">...</div>  // First order
<div id="status-confirmed-multi-1">...</div>  // Second order
<div data-order-index="0">...</div>           // First order's timeline
<div data-order-index="1">...</div>           // Second order's timeline
```

### Frontend: Backward Compatibility
```javascript
// Detects response format automatically
if (data.orders) {
  // New format: array of orders
  displayMultipleOrders(data.orders);
} else {
  // Legacy format: single order
  displayOrderStatus(data);
}
```

---

## Response Format Comparison

### Old Format (Single Order)
```json
{
  "order_number": "ORD-123",
  "status": "shipped",
  "items": [...],
  ...
}
```

### New Format (Multiple Orders)
```json
{
  "orders": [
    {
      "order_number": "ORD-123",
      "status": "shipped",
      "items": [...],
      ...
    },
    {
      "order_number": "ORD-124",
      "status": "delivered",
      "items": [...],
      ...
    }
  ]
}
```

### Error Format (Unchanged)
```json
{
  "error": "No orders found matching your search criteria"
}
```

---

## CSS Classes Used

All existing classes, no new CSS required:
- `.tracking-card` - Order card container
- `.tracking-card-header` - Order info header
- `.tracking-timeline` - Timeline container
- `.timeline-track` - Timeline track (with data-order-index)
- `.timeline-line` - Progress line (dynamic width)
- `.timeline-step` - Individual status step
- `.tracking-items-list` - Items list container
- `.tracking-item` - Individual item

---

## Data Attributes Used

**New attributes added to distinguish multiple orders:**
```html
<!-- data-order-index used to identify each order's timeline -->
<div class="timeline-track" data-order-index="0">...</div>
<div class="timeline-track" data-order-index="1">...</div>

<!-- Indexed IDs to prevent conflicts -->
id="status-confirmed-multi-0"
id="status-confirmed-multi-1"
id="items-0"
id="items-1"
```

---

## Summary

**Backend Changes:**
- Exclude failed payment orders
- Return all matching orders (not just one)
- Wrap response in `{"orders": [...]}` object

**Frontend Changes:**
- Detect response format
- Display multiple orders with individual cards
- Each order has own timeline with dynamic progress
- Backward compatible with old single-order format

**No CSS Changes Required** - Uses existing styling
