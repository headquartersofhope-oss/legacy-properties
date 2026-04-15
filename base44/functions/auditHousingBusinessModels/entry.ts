import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin' && user?.role !== 'housing_admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all properties and related data
    const properties = await base44.asServiceRole.entities.Property.list('-created_date', 1000);
    const turnkeyClients = await base44.asServiceRole.entities.TurnkeyClient.list('-created_date', 500);
    const housingModelConfigs = await base44.asServiceRole.entities.HousingModelConfig.list('-created_date', 1000);
    const beds = await base44.asServiceRole.entities.Bed.list('-created_date', 5000);
    const residents = await base44.asServiceRole.entities.HousingResident.list('-created_date', 5000);

    const issues = [];
    const warnings = [];
    const perBedProperties = [];
    const turnkeyProperties = [];
    const mixedFlexProperties = [];
    
    let perBedBedInventory = 0;
    let perBedOccupiedBeds = 0;
    let perBedAvailableBeds = 0;
    let turnkeyPropertiesWithoutClient = 0;
    let propertiesOpenWhenTurnkey = 0;
    let propertiesTurnkeyWithoutLease = 0;

    // Audit each property
    for (const prop of properties) {
      const model = prop.housing_model || 'per_bed'; // default
      const bedsByProperty = beds.filter(b => b.site_id === prop.property_id || b.site_id === prop.id);
      const residentsByProperty = residents.filter(r => r.site_id === prop.property_id || r.site_id === prop.id);
      const config = housingModelConfigs.find(c => c.property_id === prop.property_id || c.property_id === prop.id);

      // Track properties by model
      if (model === 'per_bed') {
        perBedProperties.push({
          id: prop.id,
          name: prop.property_name,
          beds: bedsByProperty.length,
          residents: residentsByProperty.length,
          available: bedsByProperty.filter(b => b.bed_status === 'available').length
        });
        
        // Track bed inventory for per-bed
        perBedBedInventory += bedsByProperty.length;
        perBedOccupiedBeds += bedsByProperty.filter(b => b.bed_status === 'occupied').length;
        perBedAvailableBeds += bedsByProperty.filter(b => b.bed_status === 'available').length;
      } else if (model === 'turnkey_house') {
        turnkeyProperties.push({
          id: prop.id,
          name: prop.property_name,
          client_id: prop.turnkey_client_id,
          client_name: prop.turnkey_client_name,
          beds: bedsByProperty.length,
          residents: residentsByProperty.length
        });

        // Audit turnkey-specific issues
        if (!prop.turnkey_client_id || !prop.turnkey_client_name) {
          turnkeyPropertiesWithoutClient++;
          issues.push(`Turnkey property "${prop.property_name}" (${prop.id}) missing client assignment`);
        }

        if (prop.open_for_referrals !== false) {
          propertiesOpenWhenTurnkey++;
          warnings.push(`Turnkey property "${prop.property_name}" is marked open_for_referrals=true (should be false)`);
        }

        if (!prop.lease_id && model === 'turnkey_house') {
          propertiesTurnkeyWithoutLease++;
          warnings.push(`Turnkey property "${prop.property_name}" missing lease_id reference`);
        }
      } else if (model === 'mixed_flex') {
        mixedFlexProperties.push({
          id: prop.id,
          name: prop.property_name,
          beds: bedsByProperty.length,
          residents: residentsByProperty.length
        });
      }

      // Check for missing housing_model field
      if (!prop.housing_model) {
        warnings.push(`Property "${prop.property_name}" missing housing_model field (defaulting to per_bed)`);
      }

      // Check for per-bed properties with no bed inventory
      if (model === 'per_bed' && bedsByProperty.length === 0 && prop.total_bed_count && prop.total_bed_count > 0) {
        issues.push(`Per-bed property "${prop.property_name}" declares ${prop.total_bed_count} beds but has 0 bed records`);
      }

      // Check for model/referral visibility mismatch
      if (model === 'turnkey_house' && prop.visible_to_partners && !prop.open_for_referrals) {
        warnings.push(`Turnkey property "${prop.property_name}" is visible to partners but referrals closed (confusing)`);
      }

      // Check for turnkey with bed inventory exposed
      if (model === 'turnkey_house' && bedsByProperty.length > 0 && config?.bed_inventory_visible !== false) {
        warnings.push(`Turnkey property "${prop.property_name}" may have bed inventory visible externally`);
      }
    }

    // Calculate per-bed utilization
    const perBedUtilization = perBedBedInventory > 0 ? Math.round((perBedOccupiedBeds / perBedBedInventory) * 100) : 0;

    // Summary statistics
    const summary = {
      total_properties: properties.length,
      per_bed_properties: perBedProperties.length,
      turnkey_properties: turnkeyProperties.length,
      mixed_flex_properties: mixedFlexProperties.length,
      total_bed_inventory: perBedBedInventory,
      per_bed_occupied: perBedOccupiedBeds,
      per_bed_available: perBedAvailableBeds,
      per_bed_utilization_percent: perBedUtilization,
      turnkey_missing_client: turnkeyPropertiesWithoutClient,
      turnkey_incorrectly_open: propertiesOpenWhenTurnkey,
      turnkey_missing_lease: propertiesTurnkeyWithoutLease
    };

    const recommendations = [];
    if (turnkeyPropertiesWithoutClient > 0) {
      recommendations.push(`Assign clients to ${turnkeyPropertiesWithoutClient} unassigned turnkey properties`);
    }
    if (propertiesOpenWhenTurnkey > 0) {
      recommendations.push(`Close referrals for ${propertiesOpenWhenTurnkey} turnkey properties (set open_for_referrals=false)`);
    }
    if (issues.length > 0) {
      recommendations.push(`Resolve ${issues.length} critical issues before full production use`);
    }

    return Response.json({
      status: 'audit_complete',
      timestamp: new Date().toISOString(),
      summary,
      per_bed_properties: perBedProperties,
      turnkey_properties: turnkeyProperties,
      mixed_flex_properties: mixedFlexProperties,
      critical_issues: issues,
      warnings,
      recommendations,
      housing_model_readiness: {
        per_bed_ready: perBedProperties.length > 0 && issues.filter(i => i.includes('Per-bed')).length === 0,
        turnkey_ready: turnkeyPropertiesWithoutClient === 0 && propertiesOpenWhenTurnkey === 0,
        pathway_clarity: 'Both models now clearly distinguishable for Pathway integration'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});