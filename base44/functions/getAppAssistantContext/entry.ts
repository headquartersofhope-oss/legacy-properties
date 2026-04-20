import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all required data in parallel
    const [properties, beds, occupancyRecords, referrals, incidents, fees, auditLogs] = await Promise.all([
      base44.asServiceRole.entities.Property.list(),
      base44.asServiceRole.entities.Bed.list(),
      base44.asServiceRole.entities.OccupancyRecord.filter({ occupancy_status: 'active' }),
      base44.asServiceRole.entities.Referral.filter({ referral_status: 'submitted' }),
      base44.asServiceRole.entities.IncidentReport.list(),
      base44.asServiceRole.entities.ProgramFee.filter({ fee_status: 'due' }),
      base44.asServiceRole.entities.AuditLog.list('-created_date', 100),
    ]);

    // Calculate bed counts
    const bedCounts = {
      total: beds.length,
      occupied: beds.filter(b => b.bed_status === 'occupied').length,
      available: beds.filter(b => b.bed_status === 'available').length,
      needs_cleaning: beds.filter(b => b.bed_status === 'needs_cleaning').length,
      reserved: beds.filter(b => b.bed_status === 'reserved').length,
    };

    // Filter recent AuditLog (last 24 hours)
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentAuditLogs = auditLogs.filter(log => {
      const logDate = new Date(log.created_date);
      return logDate >= oneDayAgo;
    }).slice(0, 10);

    // Count open incidents
    const openIncidents = incidents.filter(inc => !['closed', 'resolved'].includes(inc.incident_status)).length;

    // Get occupancy mismatches (from fixOccupancyMismatch if available)
    let occupancyMismatches = [];
    try {
      const mismatchRes = await base44.asServiceRole.functions.invoke('fixOccupancyMismatch', {});
      if (mismatchRes && mismatchRes.data && mismatchRes.data.mismatches) {
        occupancyMismatches = mismatchRes.data.mismatches.slice(0, 5);
      }
    } catch (err) {
      // Function may not exist or may error — continue gracefully
    }

    const context = {
      timestamp: new Date().toISOString(),
      properties: {
        total: properties.length,
        active: properties.filter(p => p.house_status === 'active').length,
      },
      beds: bedCounts,
      occupancy: {
        active_records: occupancyRecords.length,
      },
      referrals: {
        pending: referrals.length,
      },
      incidents: {
        open: openIncidents,
      },
      fees: {
        due: fees.length,
      },
      occupancy_mismatches: occupancyMismatches,
      recent_audit_logs: recentAuditLogs.map(log => ({
        event_type: log.event_type,
        status: log.status,
        message: log.message,
        created_date: log.created_date,
      })),
      user_role: user.role,
    };

    return Response.json(context);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});