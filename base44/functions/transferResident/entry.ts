import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !['housing_admin', 'housing_manager'].includes(user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payload = await req.json();
    const {
      resident_id,
      resident_name,
      from_property_id,
      from_property_name,
      from_room_id,
      from_room_name,
      from_bed_id,
      from_bed_label,
      to_property_id,
      to_property_name,
      to_room_id,
      to_room_name,
      to_bed_id,
      to_bed_label,
      transfer_date,
      transfer_reason,
      notes,
    } = payload;

    // Create RoomTransfer record
    const transfer = await base44.entities.RoomTransfer.create({
      resident_id,
      resident_name,
      from_property_id,
      from_property_name,
      from_room_id,
      from_room_name,
      from_bed_id,
      from_bed_label,
      to_property_id,
      to_property_name,
      to_room_id,
      to_room_name,
      to_bed_id,
      to_bed_label,
      transfer_date,
      transfer_reason,
      initiated_by_email: user.email,
      initiated_by_name: user.full_name,
      transfer_status: 'completed',
      notes,
    });

    // Update old bed to available
    if (from_bed_id) {
      await base44.entities.Bed.update(from_bed_id, {
        bed_status: 'available',
        current_resident_id: null,
      });
    }

    // Update new bed to occupied
    if (to_bed_id) {
      await base44.entities.Bed.update(to_bed_id, {
        bed_status: 'occupied',
        current_resident_id: resident_id,
      });
    }

    // Update occupancy record (mark old as transferred)
    const oldOccupancy = await base44.entities.OccupancyRecord.filter({
      housing_resident_id: resident_id,
      occupancy_status: 'active',
    });
    if (oldOccupancy.length > 0) {
      await base44.entities.OccupancyRecord.update(oldOccupancy[0].id, {
        occupancy_status: 'transferred',
        end_date: transfer_date,
      });
    }

    // Create new occupancy record
    await base44.entities.OccupancyRecord.create({
      housing_resident_id: resident_id,
      resident_name,
      site_id: to_property_id,
      site_name: to_property_name,
      room_id: to_room_id,
      room_name: to_room_name,
      bed_id: to_bed_id,
      bed_label: to_bed_label,
      start_date: transfer_date,
      occupancy_status: 'active',
      notes: `Transferred from ${from_property_name}/${from_room_name}`,
    });

    // Update Placement record
    const placements = await base44.entities.Placement.filter({
      resident_id,
      placement_status: 'active',
    });
    if (placements.length > 0) {
      await base44.entities.Placement.update(placements[0].id, {
        property_id: to_property_id,
        property_name: to_property_name,
        room_id: to_room_id,
        room_name: to_room_name,
        bed_id: to_bed_id,
        bed_label: to_bed_label,
      });
    }

    // Update HousingResident
    if (resident_id) {
      await base44.entities.HousingResident.update(resident_id, {
        site_id: to_property_id,
        site_name: to_property_name,
        room_id: to_room_id,
        room_name: to_room_name,
        bed_id: to_bed_id,
        bed_label: to_bed_label,
      });
    }

    return Response.json({
      success: true,
      transfer_id: transfer.id,
      message: `${resident_name} transferred to ${to_property_name}/${to_room_name}`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});