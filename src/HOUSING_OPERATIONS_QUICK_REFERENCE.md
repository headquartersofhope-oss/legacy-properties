# Housing Operations Platform — Quick Reference Guide

## Entities Summary

| Entity | Purpose | Key Fields |
|--------|---------|-----------|
| **Placement** | Resident assignment to room/bed | resident_id, property_id, room_id, bed_id, move_in_date, placement_status |
| **RoomTransfer** | Audit trail for moves | from_property, to_property, from_bed, to_bed, transfer_date, initiated_by |
| **PaymentSource** | Payer configuration | placement_id, payer_type, payer_name, monthly_amount, payment_percentage |
| **Invoice** | Billing document | invoice_number, placement_id, total_amount_due, amount_paid, remaining_balance |
| **Payment** | Payment record | invoice_id, payment_amount, payment_date, payment_method, reference_number |
| **HouseExpense** | Operational cost | property_id, expense_category, amount, paid_status, due_date |
| **FinancialSummary** | Monthly metrics | property_id, report_month, occupancy_count, revenue, expenses, net_profit |

---

## Backend Functions

### Placement Operations
```javascript
// Create placement (resident → room/bed)
POST /functions/createPlacement
{
  "resident_id": "res_123",
  "resident_name": "John Smith",
  "property_id": "prop_456",
  "room_id": "room_789",
  "bed_id": "bed_101",
  "move_in_date": "2026-04-15"
}
```

### Transfer Operations
```javascript
// Transfer resident (bed → bed, house → house)
POST /functions/transferResident
{
  "resident_id": "res_123",
  "from_property_id": "prop_456",
  "from_bed_id": "bed_101",
  "to_property_id": "prop_789",
  "to_bed_id": "bed_202",
  "transfer_date": "2026-04-20",
  "transfer_reason": "capacity_management"
}
```

### Invoicing
```javascript
// Generate invoice
POST /functions/generateInvoice
{
  "property_id": "prop_456",
  "placement_id": "place_123",
  "payment_source_id": "ps_001",
  "billing_period_start": "2026-04-01",
  "billing_period_end": "2026-04-30",
  "line_items": [
    {"description": "Bed Fee", "amount": 500, "category": "bed_fee"}
  ],
  "due_date": "2026-05-10"
}
```

### Payments
```javascript
// Record payment
POST /functions/recordPayment
{
  "invoice_id": "inv_123",
  "payment_amount": 300,
  "payment_method": "check",
  "reference_number": "CHK-12345"
}
```

### Financial Reports
```javascript
// House-level financials
POST /functions/calculateHouseFinancials
{
  "property_id": "prop_456",
  "report_month": "2026-04"
}

// Portfolio-wide financials
POST /functions/calculatePortfolioFinancials
{
  "report_month": "2026-04"
}
```

---

## Dashboard Metrics (Property Level)

```
Occupancy: 8/10 beds (80%)
Expected Revenue: $4,500 (April)
Payments Received: $3,800
Outstanding: $700
Total Expenses: $2,500
Net Profit: $1,300 (29% margin)
```

---

## Dashboard Metrics (Portfolio Level)

```
Total Expected Revenue: $18,500
Payments Received: $15,200
Outstanding: $3,300
Total Expenses: $9,500
Net Profit: $5,700 (31% margin)

Top Performer: Hope House Downtown (35% margin)
Underperformer: West Side (8% margin, negative)
```

---

## Access Control

### Who Can See Financial Data?
- **housing_admin**: Everything
- **billing_staff**: Invoices, payments, analytics
- **housing_manager**: House summary, invoices
- **housing_staff**: Occupancy only (no amounts)
- **referral_partner**: Nothing (blocked by RLS)

---

## Key Workflows

### Complete Placement Lifecycle
1. **Day 1**: Staff creates Placement → resident assigned to bed
2. **Day 2**: Staff creates PaymentSource(s) → configure payers
3. **Day 5**: Billing generates Invoice → $500 due
4. **Day 7**: Payment received $300 → Invoice marked partial
5. **Day 10**: Payment received $200 → Invoice marked paid
6. **Day 15**: Resident needs new room → Staff initiates transfer
7. **Day 15**: System releases old bed, assigns new bed, creates RoomTransfer record
8. **Month 30**: Diagnostics audit all records → verify integrity

---

## Common Data Checks

### Diagnostics Will Flag
- ❌ Residents without bed assignment
- ❌ Occupied beds without resident linkage
- ❌ Invoices with zero amount
- ❌ Payments not linked to invoice
- ❌ Placements without payment source
- ❌ Houses with revenue but no occupancy
- ❌ Hybrid payments missing split amounts
- ❌ Rooms with capacity mismatch

---

## Hybrid Payment Example

**Scenario**: Resident + Nonprofit + Sponsor

```
Placement: place_123 (resident John Smith, bed $500/month)

PaymentSource 1:
  Type: self_pay
  Name: John Smith
  Amount: $200/month (40%)

PaymentSource 2:
  Type: nonprofit
  Name: Headquarters of Hope
  Amount: $200/month (40%)

PaymentSource 3:
  Type: sponsor
  Name: United Way
  Amount: $100/month (20%)

Total Expected: $500/month
```

**Invoicing**:
- Option A: One $500 invoice, track 3 payers
- Option B: Three split invoices ($200, $200, $100)
- System supports both

---

## Financial Margin Calculation

```
Occupancy: 8 beds @ $500/month = $4,000 expected
Actual Received: $3,800 (95%)
Expenses: Lease $2,000 + Utilities $300 + Maintenance $200 = $2,500
Net Profit: $3,800 - $2,500 = $1,300
Margin: ($1,300 / $4,000) × 100 = 32.5%
```

---

## Occupancy Accuracy

**System Ensures**:
- Occupied bed count = Active placement count
- Active resident count = Active occupancy records
- Room capacity ≥ beds in room
- All occupied beds have placement record
- All active placements have bed assignment

**Diagnostics Verify**: No orphaned records on either side

---

## Transferring Residents

**What Happens Automatically**:
1. Old bed → status = available
2. New bed → status = occupied
3. Old occupancy → status = transferred
4. New occupancy → status = active
5. Placement record → updated with new location
6. RoomTransfer record → created with audit trail
7. HousingResident → updated with new room/bed
8. Invoice history → preserved, new invoices start

**No Manual Sync Needed**: All updates atomic and consistent

---

## Invoice Terminology

| Term | Meaning |
|------|---------|
| **draft** | Created, not sent to payer |
| **sent** | Delivered to payer |
| **viewed** | Payer acknowledged |
| **partial** | Some amount paid, balance due |
| **paid** | Fully paid, balance = $0 |
| **overdue** | Past due date, unpaid |
| **cancelled** | No longer valid |

---

## Diagnostic Health Check

```bash
POST /functions/runFullDiagnostics
→ Returns:
  - Critical issues: Must fix before production
  - Warnings: Review and address
  - Recommendations: Best practices
  - Data quality %: Completeness by entity
  - Billing issues: Financial-specific problems
```

---

## To Test (Manual)

1. ✅ Create placement (resident → property → room → bed)
2. ✅ Verify occupancy updates
3. ✅ Create payment sources (multi-payer test)
4. ✅ Generate invoice
5. ✅ Record payment (partial + full)
6. ✅ Check invoice status updates
7. ✅ Transfer resident
8. ✅ Verify old bed available, new bed occupied
9. ✅ Run house financials
10. ✅ Run portfolio financials
11. ✅ Run diagnostics
12. ✅ Verify financial data hidden from housing_staff role

---

## Hidden Financial Fields (Non-Admin)

```
housing_staff CANNOT see:
- Invoice amounts
- Payment amounts
- Payer information
- Expense details
- House profit/loss
- Financial summaries

housing_staff CAN see:
- Resident names
- Room assignments
- Occupancy status
- Move-in dates
- Transfer history
```

---

**Everything above is ready to test and use. All backend functions deployed and audit diagnostics enhanced.**