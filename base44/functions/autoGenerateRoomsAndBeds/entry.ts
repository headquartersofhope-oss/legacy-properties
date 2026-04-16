import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { property_id, room_configs } = body;
    // room_configs: [{ room_name, capacity, notes }]

    if (!property_id || !room_configs) {
      return Response.json({ error: 'property_id and room_configs are required' }, { status: 400 });
    }

    const property = await base44.asServiceRole.entities.Property.get(property_id);
    if (!property) return Response.json({ error: 'Property not found' }, { status: 404 });

    // Get existing rooms for this property
    const existingRooms = await base44.asServiceRole.entities.Room.filter({ site_id: property_id });

    const results = { rooms_created: 0, rooms_updated: 0, beds_created: 0, beds_skipped: 0, conflicts: [] };

    for (const config of room_configs) {
      const { room_name, capacity, notes } = config;
      if (!room_name || !capacity) continue;

      const cap = parseInt(capacity) || 0;

      // Find or create room
      let room = existingRooms.find(r => r.room_name === room_name);
      if (!room) {
        room = await base44.asServiceRole.entities.Room.create({
          site_id: property_id,
          site_name: property.property_name,
          room_name,
          capacity: cap,
          status: 'active',
          notes: notes || '',
        });
        results.rooms_created++;
      } else {
        // Update capacity if changed
        if (room.capacity !== cap) {
          await base44.asServiceRole.entities.Room.update(room.id, { capacity: cap });
        }
        results.rooms_updated++;
      }

      // Get existing beds for this room
      const existingBeds = await base44.asServiceRole.entities.Bed.filter({ room_id: room.id });
      const existingCount = existingBeds.length;

      if (existingCount < cap) {
        // Create missing beds
        for (let i = existingCount + 1; i <= cap; i++) {
          const bedLabel = `${room_name} – Bed ${i}`;
          await base44.asServiceRole.entities.Bed.create({
            site_id: property_id,
            site_name: property.property_name,
            room_id: room.id,
            room_name,
            bed_label: bedLabel,
            bed_status: 'available',
            bed_type: 'standard',
            status: 'active',
          });
          results.beds_created++;
        }
      } else if (existingCount > cap) {
        // Check if extra beds are occupied
        const sorted = existingBeds.sort((a, b) => a.bed_label.localeCompare(b.bed_label));
        const toRemove = sorted.slice(cap);
        for (const bed of toRemove) {
          if (bed.bed_status === 'occupied') {
            results.conflicts.push(`Cannot remove occupied bed: ${bed.bed_label}`);
          } else {
            await base44.asServiceRole.entities.Bed.update(bed.id, { status: 'inactive', bed_status: 'out_of_service' });
          }
        }
      } else {
        results.beds_skipped += existingCount;
      }
    }

    // Update property room_count and total_bed_count
    const allRooms = await base44.asServiceRole.entities.Room.filter({ site_id: property_id, status: 'active' });
    const allBeds = await base44.asServiceRole.entities.Bed.filter({ site_id: property_id, status: 'active' });
    await base44.asServiceRole.entities.Property.update(property_id, {
      room_count: allRooms.length,
      total_bed_count: allBeds.length,
    });

    return Response.json({ success: true, results, total_rooms: allRooms.length, total_beds: allBeds.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});