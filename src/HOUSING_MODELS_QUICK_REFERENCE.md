# Housing Models Quick Reference Guide

## At a Glance

| Aspect | Per-Bed Model | Turnkey House Model |
|--------|---------------|-------------------|
| **What Is It** | Individual beds/rooms available for referral | Entire house leased to single client |
| **Referral Flow** | Referral → Search beds → Assign to bed | Blocked (client manages occupancy) |
| **Who Controls** | RE Jones staff place residents | Client/operator controls house |
| **Visibility** | Beds shown in search (if visible_to_partners) | House NOT shown in bed search |
| **Placement Tracking** | Per-resident (who lives in which bed) | House-level (total occupancy count) |
| **Use Case** | Traditional transitional housing, sober living | Contracted programs, nonprofit partnerships |
| **Example** | Veterans House with 12 individual beds | Entire house leased to nonprofit for youth program |
| **Pathway Integration** | ✓ Include in bed inventory | ✗ Skip, show as reserved |

---

## How to Create a Per-Bed Property

1. **Go to Properties page → Add New**
2. **Set:**
   - `housing_model` = "per_bed" (default)
   - `open_for_referrals` = true
   - `total_bed_count` = [number of beds]
3. **Save → Go to Rooms page**
4. **Create Rooms** (e.g., "Room 1", "Room 2")
5. **Go to Beds page → Add Beds**
   - Assign each bed to a room
   - Set `bed_status` = "available"
6. **Done!** Property now accepts referrals

---

## How to Create a Turnkey Property

1. **Go to TurnkeyClient page (if exists) → Add New Client**
   - Fill: client_name, client_type, contact info, lease dates
   - Set: `status` = "active"
   - Save client ID (e.g., "tclient_456")

2. **Go to Properties page → Create New Property**
   - Fill: name, address, type, amenities
   - Set:
     - `housing_model` = "turnkey_house"
     - `open_for_referrals` = false
     - `turnkey_client_id` = "tclient_456"
     - `turnkey_client_name` = "[client name]"

3. **Go to HousingModelConfig page → Add New Config**
   - Set:
     - `property_id` = [the property you just created]
     - `current_model` = "turnkey_house"
     - `model_is_locked` = true (optional)
     - `turnkey_client_id` = "tclient_456"
     - `allows_individual_referrals` = false

4. **Done!** Property is now turnkey-exclusive

---

## How to Switch a Property Between Models

### Per-Bed → Turnkey

```
1. Create TurnkeyClient record (see above)
2. Go to Property → Edit
   - Change: housing_model = "turnkey_house"
   - Add: turnkey_client_id & turnkey_client_name
   - Change: open_for_referrals = false
3. Create HousingModelConfig entry
   - current_model = "turnkey_house"
   - transition_notes = "Converted to turnkey for Nonprofit XYZ"
4. Save & audit
```

### Turnkey → Per-Bed

```
1. Go to TurnkeyClient → archive or change status to "completed"
2. Go to Property → Edit
   - Change: housing_model = "per_bed"
   - Clear: turnkey_client_id & turnkey_client_name
   - Change: open_for_referrals = true (if accepting referrals)
3. Create new HousingModelConfig entry
   - current_model = "per_bed"
   - transition_notes = "Contract ended, converted back to per-bed"
4. Save & audit
```

---

## Understanding Housing Model Fields

### On Property Entity

```
housing_model: "per_bed" | "turnkey_house" | "mixed_flex"
  → What operational model this property uses

model_is_fixed: true | false
  → If true: cannot change model (locked)
  → If false: can change between per_bed/turnkey

open_for_referrals: true | false
  → If true: accepts individual bed referrals
  → If false: no referrals (usually for turnkey houses)

turnkey_client_id: string
  → Links to TurnkeyClient record (only for turnkey houses)

turnkey_client_name: string
  → Cached name of current operator (for quick display)
```

### On TurnkeyClient Entity

```
status: "active" | "pending" | "completed" | "terminated" | "on_hold"
  → active = currently operating this house
  → completed/terminated = contract ended, archive

lease_start_date & lease_end_date
  → Contract period for whole-house lease

authorized_occupancy_count
  → Max occupants allowed per contract

current_occupancy_count
  → How many people currently living there
  → Updated by admin as client reports

use_case_notes
  → Program type: "Housing for at-risk youth", "Sober living for veterans", etc.
```

### On HousingModelConfig Entity

```
current_model: "per_bed" | "turnkey_house" | "mixed_flex"
  → Snapshot of current model

model_effective_date
  → When this model became active

model_is_locked: true | false
  → Prevents accidental model changes

config_status: "current" | "archived" | "pending_transition"
  → current = this is the active config
  → archived = old config, kept for history
  → pending_transition = scheduled to change

allows_bed_search: true | false
  → If false: property does NOT appear in /bed-search

allows_individual_referrals: true | false
  → If false: no individual bed referrals accepted

bed_inventory_visible: true | false
  → If false: bed counts hidden from external users
```

---

## Testing Model Setup (5 min)

1. **Go to /housing-models page**
2. **Click "Run Model Audit"**
3. **Verify:**
   - Summary shows your per-bed and turnkey properties
   - Per-bed properties show bed counts
   - Turnkey properties show client names
   - Critical issues = 0 (or expected warnings only)

---

## Common Issues & Fixes

### Issue: Per-bed property shows as "needs work" in audit

**Cause:** Property declared but has 0 bed records

**Fix:**
1. Go to Property → confirm total_bed_count
2. Go to Rooms → create rooms if missing
3. Go to Beds → create beds for each room
4. Re-run audit

---

### Issue: Turnkey property marked as "incorrect" in audit

**Cause:** Turnkey property marked open_for_referrals=true

**Fix:**
1. Go to Property → Edit
2. Change: open_for_referrals = false
3. Save → Re-run audit

---

### Issue: Turnkey property has no client

**Cause:** turnkey_client_id is empty

**Fix:**
1. Go to TurnkeyClient → Create new
2. Fill: client_name, client_type, status
3. Save → Copy client ID
4. Go to Property → Edit
5. Set: turnkey_client_id = [client ID]
6. Save → Re-run audit

---

### Issue: Staff still seeing turnkey property in bed search

**Cause:** bed_inventory_visible is true or bed_search filtering not respecting model

**Fix:**
1. Go to HousingModelConfig → Edit this property's config
2. Set: bed_inventory_visible = false
3. Set: allows_bed_search = false
4. Save
5. Clear browser cache (Ctrl+Shift+Del)
6. Refresh /bed-search

---

## What Admins Should Know

- **Per-bed properties** drive referral volume → track utilization %
- **Turnkey properties** are whole contracts → track by client lease dates
- **Model changes** should be logged in HousingModelConfig with notes
- **Bed search visibility** automatically excludes turnkey houses (if set correctly)
- **Referral blocking** for turnkey houses prevents routing errors
- **Audit regularly** (weekly or monthly) to catch model mismatches

---

## What Partners/Pathway Should Know

- **Open for referrals field** = can/cannot place someone here
- **housing_model field** = tells us if it's per-bed or turnkey
- **available_beds count** = only accurate for per-bed, not turnkey
- **For turnkey houses:** Don't route referrals; show client info instead
- **For per-bed houses:** Route referrals to available beds normally

---

## Next Steps

1. **Familiarize:** Read full implementation guide (HOUSING_BUSINESS_MODELS_IMPLEMENTATION.md)
2. **Test:** Run model audit on your current data
3. **Document:** Add notes to your properties indicating model
4. **Train staff:** Brief team on distinction
5. **Monitor:** Check audit weekly for mismatches
6. **Integrate:** Ensure Pathway correctly interprets housing_model field

---

## Questions?

Refer to:
- **Full details:** `HOUSING_BUSINESS_MODELS_IMPLEMENTATION.md`
- **Audit results:** Go to `/housing-models` page
- **Data structure:** Check Property, TurnkeyClient, HousingModelConfig entities