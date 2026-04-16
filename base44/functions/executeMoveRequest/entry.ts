import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'housing_admin', 'housing_manager'].includes(user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { move_request_id } = body;

    const moveReq = await base44.asServiceRole.entities.MoveRequest.get(move_request_id);
    if (!moveReq) return Response.json({ error: 'Move request not found' }, { status: 404 });
    if (moveReq.request_status !== 'approved') {
      return Response.json({ error: 'Move request must be approved before execution' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Release old bed
    if (moveReq.from_bed_id) {
      await base44.asServiceRole.entities.Bed.update(moveReq.from_bed_id, {
        bed_status: 'available',
        current_resident_id: '',
      });
    }

    // End old occupancy
    const oldOcc = await base44.asServiceRole.entities.OccupancyRecord.filter({ housing_resident_id: moveReq.resident_id, occupancy_status: 'active' });
    for (const occ of oldOcc) {
      await base44.asServiceRole.entities.OccupancyRecord.update(occ.id, { occupancy_status: 'transferred', end_date: today });
    }

    // Occupy new bed
    let newBed = null;
    if (moveReq.to_bed_id) {
      newBed = await base44.asServiceRole.entities.Bed.get(moveReq.to_bed_id);
      if (newBed && newBed.bed_status !== 'available') {
        return Response.json({ error: 'Target bed is no longer available' }, { status: 409 });
      }
      await base44.asServiceRole.entities.Bed.update(moveReq.to_bed_id, {
        bed_status: 'occupied',
        current_resident_id: moveReq.resident_id,
      });
    }

    // Update resident
    await base44.asServiceRole.entities.HousingResident.update(moveReq.resident_id, {
      site_id: moveReq.to_property_id || moveReq.from_property_id,
      site_name: moveReq.to_property_name || moveReq.from_property_name,
      room_id: moveReq.to_room_id || '',
      room_name: moveReq.to_room_name || '',
      bed_id: moveReq.to_bed_id || '',
      bed_label: newBed?.bed_label || moveReq.to_bed_label || '',
      move_in_date: today,
    });

    // Create new occupancy record
    await base44.asServiceRole.entities.OccupancyRecord.create({
      housing_resident_id: moveReq.resident_id,
      resident_name: moveReq.resident_name,
      site_id: moveReq.to_property_id || moveReq.from_property_id,
      site_name: moveReq.to_property_name || moveReq.from_property_name,
      room_id: moveReq.to_room_id || '',
      room_name: moveReq.to_room_name || '',
      bed_id: moveReq.to_bed_id || '',
      bed_label: newBed?.bed_label || moveReq.to_bed_label || '',
      start_date: today,
      occupancy_status: 'active',
    });

    // Mark move request completed
    await base44.asServiceRole.entities.MoveRequest.update(move_request_id, {
      request_status: 'completed',
      completed_date: today,
    });

    return Response.json({ success: true, message: 'Move executed successfully' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});