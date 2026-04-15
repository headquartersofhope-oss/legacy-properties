# Housing App: Manual Testing Guide

## What Changed
The entire Housing App has been transformed into an interactive command center where clicking any metric drills down into filtered data views.

---

## QUICK START TESTING

### 1. Dashboard → Properties Flow (5 min test)
**Objective**: Verify KPI cards navigate with correct filters

**Steps**:
1. Go to Dashboard (home page)
2. **Click "Houses (6)" card** → Should navigate to Properties page, show all properties
3. **Click "PER-BED PROPERTIES" box** → Should navigate to Properties page, filter to per_bed only
4. Verify: Page shows "X of Y properties" and housing_model filter is applied
5. **Click "TURNKEY PROPERTIES" box** → Should filter to turnkey_house
6. **Clear filters** → Should show all properties again

**Expected Result**: ✓ Smooth navigation, filters apply instantly, back button works

---

### 2. Dashboard → Beds Flow (5 min test)
**Objective**: Verify bed KPI drill-down works

**Steps**:
1. Go to Dashboard
2. **Click "Total Beds (53)" card** → Navigate to Beds page, no filter
3. **Go back to Dashboard**
4. **Click "Available (53)" card** → Navigate to Beds page + auto-apply status=available filter
5. Verify: "35 of 53 beds" (or similar filtered count) displays
6. Verify: Status filter dropdown shows "available" selected
7. **Click "Clear filter"** → Shows all beds again

**Expected Result**: ✓ Available filter auto-applies, filter bar shows/hides correctly

---

### 3. Dashboard → Referrals Flow (5 min test)
**Objective**: Verify referral pending count drill-down

**Steps**:
1. Go to Dashboard
2. **Click "Pending Referrals (X)" card** → Navigate to Referrals page
3. Verify: Status filter auto-applies to "under_review"
4. Verify: Shows "X of Y referrals"
5. **Clear filter** → Shows all referrals

**Expected Result**: ✓ Pending referrals filter auto-applies

---

### 4. Dashboard → Occupancy/At Capacity (3 min test)
**Objective**: Quick verification of navigation

**Steps**:
1. Go to Dashboard
2. **Click "At Capacity (X)" card** → Navigate to Properties, should show only 100% occupied
3. **Click "Near Capacity (X)" card** → Navigate to Properties, should show 80%+ occupied
4. **Click "Occupancy %" card** → Navigate to Occupancy page

**Expected Result**: ✓ All navigation works

---

## PROPERTIES PAGE TESTING (10 min)

### 1. Card View Functionality
**Steps**:
1. Navigate to Properties page
2. Verify cards show:
   - Property name + location
   - Housing model badge (Per-Bed/Turnkey)
   - Property type badge
   - Gender tags (if applicable)
   - Occupancy % + bar
   - Available beds count
   - Status badge
3. Hover over a card → Should see shadow increase, border color change
4. **Click a card** → Navigate to PropertyDetail page
5. **Click back button** → Return to Properties with filters intact

**Expected Result**: ✓ Cards render beautifully, hover states work, navigation works

### 2. Filter Bar Testing
**Steps**:
1. On Properties page
2. **Apply Housing Model filter** to "Per-Bed"
   - Verify: Count shows "X of Y" 
   - Verify: Only per-bed properties display
   - Verify: Filter bar shows "Filters active (1)"
3. **Add City filter**
   - Verify: Count updates to "X of Y"
   - Verify: "Filters active (2)" shows
   - Verify: Both filters apply (AND logic)
4. **Click "Clear filters"** → All filters reset, see all properties
5. **Apply filters, then refresh page** → Filters reset (expected behavior)

**Expected Result**: ✓ Multi-filter works, count updates, clear button works

### 3. Empty State Testing
**Steps**:
1. Apply filters that result in zero properties
   - Example: housing_model=turnkey + city=nonexistent
2. Verify: "No properties match your filters" appears
3. Verify: "Clear filters" button appears
4. **Click clear filters** → See all properties again

**Expected Result**: ✓ Empty state is clear and actionable

### 4. Table View Toggle
**Steps**:
1. On Properties page (card view)
2. **Click Table view button** → Switch to table view
3. Verify: All properties display in table format
4. Verify: Key columns show (name, location, model, beds, occupancy, status)
5. **Click a row** → Navigate to PropertyDetail
6. **Switch back to card view** → Returns to cards

**Expected Result**: ✓ View toggle works smoothly

---

## PROPERTY DETAIL PAGE (5 min)

**Steps**:
1. Navigate from Properties page → Click any property
2. Verify page shows:
   - Property name + address
   - Housing model (Per-Bed/Turnkey)
   - Property type
   - Status
   - Total/occupied/available beds
   - Occupancy %
   - Facility details (rooms, bathrooms, kitchens)
   - Amenities list
3. **Click back button** → Return to Properties page (filters preserved)

**Expected Result**: ✓ All details display, back navigation works

---

## BEDS PAGE TESTING (10 min)

### 1. Auto-Filter from Dashboard
**Steps**:
1. Go to Dashboard
2. **Click "Available" KPI card**
3. Lands on Beds page
4. Verify: Status filter dropdown shows "available" pre-selected
5. Verify: "X of 53 beds" shows (filtered count)
6. Verify: Only available beds display in table

**Expected Result**: ✓ Dashboard filter auto-applies

### 2. Manual Filter Application
**Steps**:
1. On Beds page (no filters)
2. **Click Status filter dropdown**
   - Select "occupied"
3. Verify: Table updates to show only occupied beds
4. Verify: Count changes to "X of Y"
5. **Apply second filter** (Active Status = "inactive")
6. Verify: Both filters apply together (shows inactive occupied beds)
7. **Click "Clear filters"** → All filters reset

**Expected Result**: ✓ Multi-filter works

### 3. Empty State for Filters
**Steps**:
1. Apply status="reserved" filter
2. If no reserved beds exist:
   - Verify: "No reserved beds" message appears
   - Verify: "Clear filter" button shows
   - Click button → Filters reset

**Expected Result**: ✓ Context-aware empty state

---

## REFERRALS PAGE TESTING (10 min)

### 1. Auto-Filter from Dashboard
**Steps**:
1. Go to Dashboard
2. **Click "Pending Referrals" card**
3. Lands on Referrals page
4. Verify: Status filter shows "under_review" pre-selected
5. Verify: "X of Y referrals" count shows (filtered)
6. Verify: Only under_review referrals display

**Expected Result**: ✓ Auto-filter works on Referrals

### 2. Manual Filter Application
**Steps**:
1. On Referrals page
2. **Click Status filter dropdown**
3. Select "approved"
4. Verify: Table updates to approved referrals only
5. Verify: Count updates
6. **Click "Clear filter"** → Shows all referrals

**Expected Result**: ✓ Filter works, clear works

### 3. Row Interaction
**Steps**:
1. With filtered referrals displayed
2. **Click any referral row** → Opens detail panel/modal
3. Verify: Can edit status, add notes, etc.
4. Close modal → Returns to filtered list

**Expected Result**: ✓ Row click works, filtering persists

---

## EDGE CASE TESTING

### 1. Rapid Navigation (Test Speed)
**Steps**:
1. Go to Dashboard
2. Rapidly click multiple KPI cards
   - Click Houses → click Back → click Available → click Back → click Occupancy
3. Verify: No lag, smooth transitions, correct filters apply each time

**Expected Result**: ✓ System responds quickly, no filter bleeding

### 2. Filter Persistence on Page Reload
**Steps**:
1. Navigate to Properties with filters applied
2. **Press F5 (refresh page)**
3. Verify: Filters clear (expected - sessionStorage cleared)
4. **Go to Dashboard, click filtered KPI**
5. **Don't reload** → Just click back and re-click KPI
6. Verify: Filters apply each time (sessionStorage still has data)

**Expected Result**: ✓ Filters work as designed (not in URL, so don't persist on reload)

### 3. Mobile Responsiveness
**Steps**:
1. Open app on mobile (or use browser dev tools: F12 → iPhone size)
2. Go to Dashboard
3. Verify: KPI cards stack vertically (responsive grid)
4. Click cards → Navigation still works
5. Go to Properties
6. Verify: Cards still display well
7. Verify: Filter bar is accessible

**Expected Result**: ✓ Responsive design works on mobile

### 4. Empty Data Scenarios
**Steps**:
1. If any entity type has 0 records:
   - Verify: Appropriate empty state displays
   - Verify: Action button works (if applicable)

**Expected Result**: ✓ Empty states are helpful, not confusing

---

## VISUAL POLISH VERIFICATION

### 1. Hover States
**Steps**:
1. Go to Dashboard
2. Hover over any KPI card → Should see:
   - Shadow increase
   - Border color changes
   - Slight color shift on text
3. Go to Properties
4. Hover over property cards → Should see similar effects
5. Hover over buttons → Should see color change

**Expected Result**: ✓ Hover states are visible and consistent

### 2. Color Coding
**Steps**:
1. Dashboard KPI cards:
   - Houses = blue
   - Total Beds = purple
   - Available = green
   - Occupancy = orange
2. Operations cards:
   - At Capacity = red
   - Near Capacity = amber
   - Pending = sky blue
   - System Health = emerald
3. Verify: Colors match schema

**Expected Result**: ✓ Color coding is consistent and meaningful

### 3. Cursor Indicators
**Steps**:
1. Hover over all clickable elements
2. Verify: Cursor changes to pointer (not arrow)
3. Verify: Includes: KPI cards, operation cards, property cards, filter buttons, view toggles

**Expected Result**: ✓ Pointer cursor on all clickable items

---

## PERFORMANCE VERIFICATION

### 1. No API Calls During Filtering
**Steps**:
1. Open browser DevTools (F12 → Network tab)
2. Go to Properties page with data loaded
3. **Apply filters**
4. Verify: No new network requests (filtering is client-side)

**Expected Result**: ✓ Filtering is instant (no API delays)

### 2. Page Load Times
**Steps**:
1. Open DevTools (F12 → Performance tab)
2. Navigate to Properties page from Dashboard
3. Record performance metrics
4. Verify: Page loads in < 500ms (after data fetch)
5. Filter bar renders immediately
6. Property cards render in < 1s

**Expected Result**: ✓ Performance is smooth

---

## FINAL VERIFICATION CHECKLIST

- [ ] Dashboard KPI cards all navigate correctly
- [ ] Dashboard operation cards navigate with correct filters
- [ ] Dashboard model boxes drill down to Properties with correct filters
- [ ] Properties page displays cards with all info
- [ ] Properties page filters work (single and multi)
- [ ] Properties table view works
- [ ] PropertyDetail page shows all info
- [ ] Beds page auto-filters from Dashboard
- [ ] Beds page manual filters work
- [ ] Referrals page auto-filters from Dashboard
- [ ] Referrals page manual filters work
- [ ] Back buttons preserve filter state
- [ ] Empty states are clear and helpful
- [ ] Hover states are visible
- [ ] Color coding is consistent
- [ ] Cursor pointers on clickable items
- [ ] No lag on rapid navigation
- [ ] Responsive design works on mobile
- [ ] Filter clearing works correctly
- [ ] No unexpected API calls

---

## WHAT YOU SHOULD SEE

### Before (Old Experience)
- Static dashboard
- Click Properties → generic list of all properties
- No drill-down capability
- Manual filtering experience
- Feels like a report, not a product

### After (New Experience)
- Interactive command center
- Click "At Capacity" → Properties page showing only 100% occupied
- Click property card → See full details instantly
- Click "Available Beds" → Beds page pre-filtered
- Feels like using a real SaaS platform
- Professional, intuitive, powerful

---

## KNOWN BEHAVIOR

**Filters reset on page reload**: Expected. Filters use sessionStorage (not URL), so F5 refresh clears them. This is intentional for clean state management.

**Multiple dashboard clicks don't accumulate**: Each click sends new filter state, so you can't "add filters" by clicking multiple times. Click → navigate → adjust on target page.

**Back button preserves component state**: React state management handles this automatically. You'll see the page exactly as you left it (with filters applied).

---

## Support

If something doesn't work as expected:
1. Check browser console (F12 → Console) for errors
2. Verify data exists (check Beds, Properties, Referrals have records)
3. Clear browser cache and reload
4. Check that routes are accessible (all route paths in App.jsx are correct)