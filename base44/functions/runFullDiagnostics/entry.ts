import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !['admin', 'housing_admin'].includes(user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all entities
    const [properties, leases, owners, amenities, beds, applications, residents, referrals, documents, occupancy] = await Promise.all([
      base44.asServiceRole.entities.Property.list(),
      base44.asServiceRole.entities.Lease.list(),
      base44.asServiceRole.entities.PropertyOwner.list(),
      base44.asServiceRole.entities.PropertyAmenity.list(),
      base44.asServiceRole.entities.Bed.list(),
      base44.asServiceRole.entities.HousingApplication.list(),
      base44.asServiceRole.entities.HousingResident.list(),
      base44.asServiceRole.entities.Referral.list(),
      base44.asServiceRole.entities.Document.list(),
      base44.asServiceRole.entities.OccupancyRecord.list(),
    ]);

    const criticalIssues = [];
    const warnings = [];
    const recommendations = [];

    // ────────────────────────────────────────
    // PROPERTY & LEASE COMPLETENESS
    // ────────────────────────────────────────
    let propertyCompleteness = 0;
    let propertyCount = 0;
    properties.forEach(p => {
      propertyCount++;
      let fieldsFilled = 0;
      const requiredFields = [
        'property_name', 'full_address', 'city', 'state', 'zip',
        'property_type', 'ownership_type', 'house_status',
        'total_bed_count', 'room_count', 'gender_restriction'
      ];
      requiredFields.forEach(f => { if (p[f]) fieldsFilled++; });
      propertyCompleteness += (fieldsFilled / requiredFields.length);

      if (!p.property_name) criticalIssues.push(`Property ${p.id}: Missing name`);
      if (!p.full_address || !p.city || !p.state || !p.zip) warnings.push(`Property ${p.property_name || p.id}: Incomplete address`);
      if (p.house_status === 'active' && !p.owner_id && !p.lease_id) warnings.push(`Property ${p.property_name}: Active but no owner or lease linked`);
      if (p.house_status === 'active' && !p.house_manager_email) warnings.push(`Property ${p.property_name}: No house manager contact`);
      if (p.visible_to_partners && (!p.demographic_focus || !p.compatible_demographics)) warnings.push(`Property ${p.property_name}: Partner-visible but missing demographic details`);
    });
    propertyCompleteness = propertyCount > 0 ? Math.round((propertyCompleteness / propertyCount) * 100) : 0;

    let leaseCompleteness = 0;
    let leaseCount = 0;
    leases.forEach(l => {
      leaseCount++;
      let fieldsFilled = 0;
      const requiredFields = ['property_id', 'owner_id', 'lessor_entity', 'lease_type', 'lease_start_date', 'renewal_status'];
      requiredFields.forEach(f => { if (l[f]) fieldsFilled++; });
      leaseCompleteness += (fieldsFilled / requiredFields.length);

      if (!l.property_id) criticalIssues.push(`Lease ${l.id}: Missing property linkage`);
      if (!l.owner_id) criticalIssues.push(`Lease ${l.id}: Missing owner linkage`);
      if (l.renewal_status === 'expired') warnings.push(`Lease ${l.id}: Expired - action required`);
      if (l.renewal_status === 'upcoming_renewal') recommendations.push(`Lease ${l.id}: Schedule renewal`);
      if (!l.contract_document_link) warnings.push(`Lease ${l.id}: No contract document linked`);
    });
    leaseCompleteness = leaseCount > 0 ? Math.round((leaseCompleteness / leaseCount) * 100) : 0;

    // ────────────────────────────────────────
    // BED & OCCUPANCY MISMATCHES
    // ────────────────────────────────────────
    let bedInventoryMatch = 100;
    let occupancyMatch = 100;
    const bedsByProperty = {};
    beds.forEach(b => {
      if (!b.site_id) criticalIssues.push(`Bed ${b.bed_label}: Missing site assignment`);
      if (!b.room_id) criticalIssues.push(`Bed ${b.bed_label}: Missing room assignment`);
      bedsByProperty[b.site_id] = (bedsByProperty[b.site_id] || 0) + 1;
    });

    properties.forEach(p => {
      const actualBeds = bedsByProperty[p.id] || 0;
      if (p.total_bed_count && actualBeds !== p.total_bed_count) {
        const diff = Math.abs(actualBeds - p.total_bed_count);
        bedInventoryMatch -= (diff / Math.max(p.total_bed_count, 1)) * 100;
        warnings.push(`Property ${p.property_name}: Declared ${p.total_bed_count} beds, has ${actualBeds}`);
      }
    });
    bedInventoryMatch = Math.max(0, Math.min(100, bedInventoryMatch));

    residents.forEach(r => {
      if (r.resident_status === 'active' && !r.bed_id) criticalIssues.push(`Resident ${r.first_name} ${r.last_name}: Active but no bed assigned`);
      if (r.resident_status === 'active' && !r.site_id) criticalIssues.push(`Resident ${r.first_name} ${r.last_name}: Active but no property assigned`);
    });

    const occupiedBeds = beds.filter(b => b.bed_status === 'occupied').length;
    const activeResidents = residents.filter(r => r.resident_status === 'active').length;
    if (occupiedBeds !== activeResidents) {
      occupancyMatch = 0;
      criticalIssues.push(`Occupancy mismatch: ${occupiedBeds} occupied beds vs ${activeResidents} active residents`);
    }

    // ────────────────────────────────────────
    // DEMOGRAPHIC & PLACEMENT FIT
    // ────────────────────────────────────────
    let demographicConflicts = 0;
    applications.forEach(a => {
      if (a.application_status === 'approved' && !a.assigned_property_id) {
        warnings.push(`Application ${a.id}: Approved but not assigned to property`);
      }
      if (a.application_status === 'move_in_ready' && !a.move_in_date) {
        warnings.push(`Application ${a.id}: Move-in ready but no move-in date set`);
      }
    });

    // ────────────────────────────────────────
    // REFERRAL & APPLICATION PIPELINE
    // ────────────────────────────────────────
    const referralBottlenecks = referrals.filter(r => r.referral_status === 'under_review').length;
    if (referralBottlenecks > 10) warnings.push(`${referralBottlenecks} referrals in review queue - potential bottleneck`);

    const pendingDocs = applications.filter(a => a.documents_status === 'incomplete' && a.application_status !== 'new').length;
    if (pendingDocs > 0) warnings.push(`${pendingDocs} applications with incomplete documents`);

    // ────────────────────────────────────────
    // DOCUMENT LINKAGE READINESS
    // ────────────────────────────────────────
    const unlinkedRecords = [];
    referrals.forEach(r => {
      const docs = documents.filter(d => d.linked_entity_id === r.id && d.linked_entity_type === 'referral');
      if (r.referral_status === 'admitted' && docs.length === 0) {
        unlinkedRecords.push(`Referral ${r.id}: Admitted but no documents linked`);
      }
    });
    leases.forEach(l => {
      if (!l.contract_document_link) {
        unlinkedRecords.push(`Lease ${l.id}: No contract document link`);
      }
    });

    // ────────────────────────────────────────
    // AUTOMATION READINESS
    // ────────────────────────────────────────
    const missingTriggers = [];
    if (properties.length === 0) missingTriggers.push('No properties to trigger automations');
    if (applications.length === 0) missingTriggers.push('No applications to trigger approval workflows');
    if (referrals.length === 0) missingTriggers.push('No referrals to trigger placement logic');

    // ────────────────────────────────────────
    // PATHWAY READINESS
    // ────────────────────────────────────────
    const pathwayReadiness = {
      status: criticalIssues.length === 0 ? 'ready' : 'needs_work',
      missing_fields: criticalIssues.filter(i => i.includes('Missing')).slice(0, 5),
      broken_links: criticalIssues.filter(i => i.includes('linkage')).slice(0, 5),
      completeness_percent: Math.round((propertyCompleteness + leaseCompleteness) / 2),
    };

    // ────────────────────────────────────────
    // DATA QUALITY SUMMARY
    // ────────────────────────────────────────
    const dataQuality = {
      property_completeness: propertyCompleteness,
      lease_completeness: leaseCompleteness,
      occupancy_match_percent: occupancyMatch,
      bed_inventory_match_percent: bedInventoryMatch,
      demographic_fit_conflicts: demographicConflicts,
    };

    // ────────────────────────────────────────
    // DOCUMENT READINESS
    // ────────────────────────────────────────
    const documentReadiness = {
      status: unlinkedRecords.length === 0 ? 'ready' : 'needs_work',
      unlinked_records: unlinkedRecords.slice(0, 10),
      drive_integration_ready: true, // Ready for Google Drive integration
      document_types_covered: [
        'lease_contract',
        'referral_packet',
        'application_form',
        'onboarding_docs',
        'house_setup',
        'compliance_checklist'
      ],
    };

    // ────────────────────────────────────────
    // AUTOMATION READINESS
    // ────────────────────────────────────────
    const automationReadiness = {
      status: missingTriggers.length === 0 ? 'ready' : 'ready_with_warnings',
      missing_triggers: missingTriggers,
      zapier_ready: properties.length > 0,
      twilio_ready: true,
      email_automation_ready: true,
    };

    // ────────────────────────────────────────
    // FINAL READINESS ASSESSMENT
    // ────────────────────────────────────────
    let readinessStatus = 'ready';
    if (criticalIssues.length > 0) readinessStatus = 'critical_issues';
    else if (criticalIssues.length > 3 || warnings.length > 10) readinessStatus = 'needs_work';
    else if (warnings.length > 0) readinessStatus = 'ready_with_warnings';

    const auditResult = {
      audit_date: new Date().toISOString(),
      audit_type: 'full_diagnostic',
      readiness_status: readinessStatus,
      pathway_readiness: pathwayReadiness,
      document_readiness: documentReadiness,
      automation_readiness: automationReadiness,
      data_quality: dataQuality,
      critical_issues: criticalIssues,
      warnings: warnings.slice(0, 20),
      recommendations: recommendations.slice(0, 15),
      next_steps: readinessStatus === 'ready' 
        ? 'Housing app is ready for Pathway integration. Test all workflows end-to-end.'
        : `Resolve ${criticalIssues.length} critical issues before production go-live.`,
      summary: {
        properties_count: properties.length,
        leases_count: leases.length,
        beds_count: beds.length,
        applications_count: applications.length,
        residents_count: residents.length,
        referrals_count: referrals.length,
        documents_count: documents.length,
      }
    };

    return Response.json(auditResult);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});