import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const ALLOWED_ROLES = ['admin', 'housing_admin', 'housing_manager', 'turnkey_operator'];
    if (!ALLOWED_ROLES.includes(user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { move_request_id } = body;

    const moveReq = await base44.asServiceRole.entities.MoveRequest.get(move_request_id);
    if (!moveReq) return Response.json({ error: 'Move request not found' }, { status: 404 });

    // House-scope enforcement for turnkey operators
    if (user.role === 'turnkey_operator') {
      const clients = await base44.asServiceRole.entities.TurnkeyClient.list();
      const myClient = clients.find(c => {
        const emails = (c.operator_user_emails || '').split(',').map(e => e.trim().toLowerCase());
        return emails.includes(user.email.toLowerCase());
      });
      if (!myClient) return Response.json({ error: 'No turnkey client record found' }, { status: 403 });

      const authorizedIds = [];
      if (myClient.property_ids) myClient.property_ids.split(',').map(s => s.trim()).filter(Boolean).forEach(id => authorizedIds.push(id));
      if (myClient.property_id) authorizedIds.push(myClient.property_id);

      if (!authorizedIds.includes(moveReq.from_property_id)) {
        return Response.json({ error: 'You are not authorized to execute moves for this property' }, { status: 403 });
      }
      // Turnkey operators can self-approve if client allows it
      if (moveReq.request_status === 'submitted' && myClient.self_approve_moves !== false) {
        await base44.asServiceRole.entities.MoveRequest.update(move_request_id, {
          request_status: 'approved',
          reviewed_by_email: user.email,
          reviewed_by_name: user.full_name,
          review_date: new Date().toISOString().split('T')[0],
        });
        moveReq.request_status = 'approved';
      }
    }

    if (moveReq.request_status !== 'approved') {
      return Response.json({ error: 'Move request must be approved before execution' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];

    if (moveReq.from_bed_id) {
      await base44.asServiceRole.entities.Bed.update(moveReq.from_bed_id, {
        bed_status: 'available',
        current_resident_id: '',
      });
    }

    const oldOcc = await base44.asServiceRole.entities.OccupancyRecord.filter({ housing_resident_id: moveReq.resident_id, occupancy_status: 'active' });
    for (const occ of oldOcc) {
      await base44.asServiceRole.entities.OccupancyRecord.update(occ.id, { occupancy_status: 'transferred', end_date: today });
    }

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

    await base44.asServiceRole.entities.HousingResident.update(moveReq.resident_id, {
      site_id: moveReq.to_property_id || moveReq.from_property_id,
      site_name: moveReq.to_property_name || moveReq.from_property_name,
      room_id: moveReq.to_room_id || '',
      room_name: moveReq.to_room_name || '',
      bed_id: moveReq.to_bed_id || '',
      bed_label: newBed?.bed_label || moveReq.to_bed_label || '',
      move_in_date: today,
    });

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

    await base44.asServiceRole.entities.MoveRequest.update(move_request_id, {
      request_status: 'completed',
      completed_date: today,
    });

    return Response.json({ success: true, message: 'Move executed successfully' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});