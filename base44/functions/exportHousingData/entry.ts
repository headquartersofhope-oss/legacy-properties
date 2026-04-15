import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins or property managers can export
    if (!['admin', 'housing_admin', 'property_manager'].includes(user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all data
    const [properties, leases, owners, amenities, beds, applications, residents] = await Promise.all([
      base44.asServiceRole.entities.Property.list(),
      base44.asServiceRole.entities.Lease.list(),
      base44.asServiceRole.entities.PropertyOwner.list(),
      base44.asServiceRole.entities.PropertyAmenity.list(),
      base44.asServiceRole.entities.Bed.list(),
      base44.asServiceRole.entities.HousingApplication.list(),
      base44.asServiceRole.entities.HousingResident.list(),
    ]);

    // Structure for Pathway integration (clean, scoped data)
    const exportData = {
      timestamp: new Date().toISOString(),
      properties: properties.map(p => ({
        id: p.id,
        name: p.property_name,
        address: p.full_address,
        city: p.city,
        state: p.state,
        zip: p.zip,
        type: p.property_type,
        gender_restriction: p.gender_restriction,
        demographic_focus: p.demographic_focus,
        beds_total: p.total_bed_count,
        beds_available: beds.filter(b => b.site_id === p.id && b.bed_status === 'available').length,
        visible_to_partners: p.visible_to_partners,
      })),
      availability: properties
        .filter(p => p.visible_to_partners)
        .map(p => ({
          property_id: p.id,
          property_name: p.property_name,
          city: p.city,
          available_beds: beds.filter(b => b.site_id === p.id && b.bed_status === 'available').length,
          demographic_focus: p.demographic_focus,
        })),
      occupancy: residents
        .filter(r => r.resident_status === 'active')
        .map(r => ({
          resident_id: r.id,
          name: `${r.first_name} ${r.last_name}`,
          property_id: r.site_id,
          move_in_date: r.move_in_date,
          status: r.resident_status,
        })),
      applications_pending: applications
        .filter(a => ['new', 'under_review', 'pending_documents'].includes(a.application_status))
        .map(a => ({
          id: a.id,
          name: `${a.applicant_first_name} ${a.applicant_last_name}`,
          status: a.application_status,
          submitted: a.created_date,
          assigned_property: a.assigned_property_name,
        })),
    };

    return Response.json(exportData);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});