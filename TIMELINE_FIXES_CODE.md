# Timeline Fixes - Code Changes Reference

## Change 1: Exclude Failed Payments (Backend)

### File: `ComfyCuteApp/views.py`
**Location:** Line 470

```python
# BEFORE
orders = Order.objects.filter(user=request.user).prefetch_related('items__product', 'items__variant')

# AFTER
orders = Order.objects.filter(user=request.user).exclude(payment_status='failed').prefetch_related('items__product', 'items__variant')
```

**Impact:** Authenticated users no longer see orders with `payment_status='failed'`

---

## Change 2: Fix Timeline for Guest Orders (Frontend)

### File: `static/js/track-order.js`

#### Part 1: Update createOrderCard()

**Location:** Lines 161-279

**BEFORE:**
```javascript
function createOrderCard(order, index) {
  // ... card creation ...
  updateTimelineForOrder(order.status, index);  // ❌ Fails - element not in DOM yet
  return card;
}
```

**AFTER:**
```javascript
function createOrderCard(order, index) {
  // ... card creation ...
  
  // Update timeline for this order - pass the timeline track element
  const timelineTrack = card.querySelector('[data-order-index]');
  if (timelineTrack) {
    updateTimelineForOrderElement(order.status, index, timelineTrack);  // ✅ Element passed directly
  }

  return card;
}
```

---

#### Part 2: Split Timeline Update Function

**Location:** Lines 283-355

**BEFORE:** (Single function)
```javascript
function updateTimelineForOrder(status, orderIndex) {
  // ... map status to index ...
  
  // PROBLEM: Searches globally in document
  const timelineTrack = document.querySelector(`[data-order-index="${orderIndex}"]`);
  if (timelineTrack) {
    updateTimelineProgress(timelineTrack);
  }
}
```

**AFTER:** (Two functions)
```javascript
function updateTimelineForOrder(status, orderIndex) {
  // Legacy: used for single guest order (template-based)
  const statusStages = ['confirmed', 'processing', 'packed', 'shipped', 'out-for-delivery', 'delivered'];

  // Map status to index (same logic as authenticated)
  let currentIndex = -1;
  switch (status) {
    case 'confirmed': currentIndex = 0; break;
    case 'processing': currentIndex = 1; break;
    case 'shipped': currentIndex = 3; break;
    case 'delivered': currentIndex = 5; break;
    case 'pending': currentIndex = -1; break;
    case 'cancelled':
      markOrderCancelled();
      return;
  }

  // Update timeline steps (non-indexed IDs)
  statusStages.forEach((stage, index) => {
    const element = document.getElementById(`status-${stage}`);
    if (element) {
      if (index < currentIndex) {
        element.classList.remove('active');
        element.classList.add('completed');
      } else if (index === currentIndex) {
        element.classList.remove('completed');
        element.classList.add('active');
      } else {
        element.classList.remove('active', 'completed');
      }
    }
  });

  // Update progress line (legacy)
  const timelineTrack = document.querySelector('.timeline-track');
  if (timelineTrack) {
    updateTimelineProgress(timelineTrack);
  }
}

function updateTimelineForOrderElement(status, orderIndex, timelineTrack) {
  // New: used for multiple orders (element passed directly)
  const statusStages = ['confirmed', 'processing', 'packed', 'shipped', 'out-for-delivery', 'delivered'];

  // Map status to index (identical to authenticated logic)
  let currentIndex = -1;
  switch (status) {
    case 'confirmed': currentIndex = 0; break;
    case 'processing': currentIndex = 1; break;
    case 'shipped': currentIndex = 3; break;
    case 'delivered': currentIndex = 5; break;
    case 'pending': currentIndex = -1; break;
    case 'cancelled':
      markOrderCancelledForMultiple(orderIndex);
      return;
  }

  // Update timeline steps (indexed IDs)
  statusStages.forEach((stage, index) => {
    const element = document.getElementById(`status-${stage}-multi-${orderIndex}`);
    if (element) {
      if (index < currentIndex) {
        element.classList.remove('active');
        element.classList.add('completed');
      } else if (index === currentIndex) {
        element.classList.remove('completed');
        element.classList.add('active');
      } else {
        element.classList.remove('active', 'completed');
      }
    }
  });

  // Update progress line for this specific timeline
  updateTimelineProgress(timelineTrack);
}
```

---

## Key Changes Summary

| Change | Location | Type | Impact |
|--------|----------|------|--------|
| Exclude failed payments | `views.py:470` | Backend | Authenticated users don't see failed payment orders |
| Pass element to timeline | `track-order.js:275` | Frontend | Timeline elements found correctly |
| Split timeline function | `track-order.js:283-355` | Frontend | Separate logic for single vs multiple orders |

---

## Status Mapping (Unchanged - Used by Both)

Both authenticated and guest users use the same status-to-index mapping:

```javascript
'pending'      → currentIndex = -1  (no steps active)
'confirmed'    → currentIndex = 0   (confirmed active)
'processing'   → currentIndex = 1   (processing active)
'shipped'      → currentIndex = 3   (shipped active, packed skipped)
'delivered'    → currentIndex = 5   (all active)
'cancelled'    → special handling
```

---

## Class Application (Unchanged - Used by Both)

```javascript
if (index < currentIndex) {
  // Previous steps get 'completed'
  classList.add('completed');
} else if (index === currentIndex) {
  // Current step gets 'active'
  classList.add('active');
} else {
  // Future steps get neither
  classList.remove('active', 'completed');
}
```

---

## Lines Changed

**Total:** ~100 lines
- Backend: 1 line modified
- Frontend: ~99 lines modified (function refactoring + element passing)

---

## Backward Compatibility

✅ Both functions work independently:
- Legacy single guest order uses `updateTimelineForOrder()`
- Multiple orders use `updateTimelineForOrderElement()`
- Authenticated users unaffected

✅ No breaking changes to:
- API endpoints
- Response formats
- HTML structure
- CSS classes
- URL patterns
