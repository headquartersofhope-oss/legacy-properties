import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !['housing_admin', 'housing_manager', 'housing_staff'].includes(user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payload = await req.json();
    const {
      resident_id,
      resident_name,
      property_id,
      property_name,
      room_id,
      room_name,
      bed_id,
      bed_label,
      move_in_date,
      expected_move_out_date,
      placement_source,
      housing_model_type,
    } = payload;

    // Create Placement record
    const placement = await base44.entities.Placement.create({
      resident_id,
      resident_name,
      property_id,
      property_name,
      room_id,
      room_name,
      bed_id,
      bed_label,
      move_in_date,
      expected_move_out_date,
      placement_source: placement_source || 'direct',
      placement_status: 'active',
      housing_model_type,
      is_active: true,
    });

    // Update Bed status to occupied
    if (bed_id) {
      await base44.entities.Bed.update(bed_id, {
        bed_status: 'occupied',
        current_resident_id: resident_id,
      });
    }

    // Update HousingResident with assignment
    if (resident_id) {
      await base44.entities.HousingResident.update(resident_id, {
        room_id,
        room_name,
        bed_id,
        bed_label,
        site_id: property_id,
        site_name: property_name,
        move_in_date,
        expected_exit_date: expected_move_out_date,
        resident_status: 'active',
      });
    }

    return Response.json({
      success: true,
      placement_id: placement.id,
      message: `Placement created for ${resident_name} in ${property_name}`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});