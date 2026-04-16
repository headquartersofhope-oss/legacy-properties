import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { resident_id, property_id, room_id, bed_id, move_in_date } = body;

    if (!resident_id || !property_id || !bed_id) {
      return Response.json({ error: 'resident_id, property_id, and bed_id are required' }, { status: 400 });
    }

    // Validate bed is available
    const bed = await base44.asServiceRole.entities.Bed.get(bed_id);
    if (!bed) return Response.json({ error: 'Bed not found' }, { status: 404 });
    if (bed.bed_status !== 'available') {
      return Response.json({ error: `Bed is not available (status: ${bed.bed_status})` }, { status: 409 });
    }

    const resident = await base44.asServiceRole.entities.HousingResident.get(resident_id);
    if (!resident) return Response.json({ error: 'Resident not found' }, { status: 404 });

    const property = await base44.asServiceRole.entities.Property.get(property_id);
    const room = room_id ? await base44.asServiceRole.entities.Room.get(room_id) : null;
    const today = move_in_date || new Date().toISOString().split('T')[0];

    // End any existing active occupancy for this resident
    const existing = await base44.asServiceRole.entities.OccupancyRecord.filter({ housing_resident_id: resident_id, occupancy_status: 'active' });
    for (const occ of existing) {
      await base44.asServiceRole.entities.OccupancyRecord.update(occ.id, { occupancy_status: 'ended', end_date: today });
      // Release old bed
      if (occ.bed_id) {
        await base44.asServiceRole.entities.Bed.update(occ.bed_id, { bed_status: 'available', current_resident_id: '' });
      }
    }

    // Update resident record
    await base44.asServiceRole.entities.HousingResident.update(resident_id, {
      site_id: property_id,
      site_name: property?.property_name || '',
      room_id: room_id || '',
      room_name: room?.room_name || bed.room_name || '',
      bed_id,
      bed_label: bed.bed_label,
      move_in_date: today,
      resident_status: 'active',
    });

    // Mark bed as occupied
    await base44.asServiceRole.entities.Bed.update(bed_id, {
      bed_status: 'occupied',
      current_resident_id: resident_id,
    });

    // Create occupancy record
    await base44.asServiceRole.entities.OccupancyRecord.create({
      housing_resident_id: resident_id,
      resident_name: `${resident.first_name} ${resident.last_name}`,
      site_id: property_id,
      site_name: property?.property_name || '',
      room_id: room_id || bed.room_id || '',
      room_name: room?.room_name || bed.room_name || '',
      bed_id,
      bed_label: bed.bed_label,
      start_date: today,
      occupancy_status: 'active',
    });

    return Response.json({ success: true, message: `${resident.first_name} ${resident.last_name} assigned to ${bed.bed_label}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});