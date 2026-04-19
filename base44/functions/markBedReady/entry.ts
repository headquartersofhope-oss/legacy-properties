import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const ALLOWED_ROLES = ['admin', 'housing_admin', 'housing_manager', 'housing_staff'];
    if (!ALLOWED_ROLES.includes(user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { bed_id } = await req.json();
    if (!bed_id) return Response.json({ error: 'bed_id is required' }, { status: 400 });

    const bed = await base44.asServiceRole.entities.Bed.get(bed_id);
    if (!bed) return Response.json({ error: 'Bed not found' }, { status: 404 });
    if (bed.bed_status !== 'needs_cleaning') {
      return Response.json({ error: `Bed is not in needs_cleaning status (current: ${bed.bed_status})` }, { status: 409 });
    }

    // Calculate time spent in cleaning state
    let cleaningDurationMinutes = null;
    if (bed.cleaning_started_at) {
      const start = new Date(bed.cleaning_started_at);
      const end = new Date();
      cleaningDurationMinutes = Math.round((end - start) / 60000);
    }

    await base44.asServiceRole.entities.Bed.update(bed_id, {
      bed_status: 'available',
      cleaning_started_at: null,
      current_resident_id: '',
    });

    return Response.json({
      success: true,
      message: `${bed.bed_label} is now available`,
      cleaning_duration_minutes: cleaningDurationMinutes,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});