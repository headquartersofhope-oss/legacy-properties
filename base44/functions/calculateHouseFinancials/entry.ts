import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !['housing_admin', 'housing_manager', 'billing_staff'].includes(user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payload = await req.json();
    const { property_id, report_month } = payload;

    // Fetch all invoices for this house in this month
    const invoices = await base44.entities.Invoice.filter({
      property_id,
    });

    // Filter by report_month
    const filteredInvoices = invoices.filter(inv => {
      const invMonth = inv.billing_period_start?.substring(0, 7);
      return invMonth === report_month;
    });

    // Calculate revenue metrics
    const expected_monthly_revenue = filteredInvoices.reduce((sum, inv) => sum + (inv.total_amount_due || 0), 0);
    const amount_received = filteredInvoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);
    const amount_outstanding = filteredInvoices.reduce((sum, inv) => sum + (inv.remaining_balance || 0), 0);

    const invoices_paid = filteredInvoices.filter(inv => inv.invoice_status === 'paid').length;
    const invoices_partial = filteredInvoices.filter(inv => inv.invoice_status === 'partial').length;
    const invoices_overdue = filteredInvoices.filter(inv => inv.invoice_status === 'overdue').length;

    // Fetch expenses for this house in this month
    const expenses = await base44.entities.HouseExpense.filter({
      property_id,
    });

    const filteredExpenses = expenses.filter(exp => {
      const expMonth = exp.expense_date?.substring(0, 7);
      return expMonth === report_month;
    });

    const total_expenses_due = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const expenses_paid = filteredExpenses.reduce((sum, exp) => sum + (exp.amount_paid || 0), 0);

    const lease_expense = filteredExpenses
      .filter(exp => exp.expense_category === 'lease_rent')
      .reduce((sum, exp) => sum + (exp.amount || 0), 0);

    const other_expenses = total_expenses_due - lease_expense;

    // Calculate profitability
    const net_profit_loss = amount_received - total_expenses_due;
    const profit_margin_percentage = expected_monthly_revenue > 0 
      ? Math.round((net_profit_loss / expected_monthly_revenue) * 100)
      : 0;

    // Fetch occupancy
    const placements = await base44.entities.Placement.filter({
      property_id,
      placement_status: 'active',
    });

    const occupancy_count = placements.length;

    // Fetch property for capacity
    const property = await base44.entities.Property.get(property_id);
    const total_capacity = property?.total_bed_count || 0;
    const occupancy_percentage = total_capacity > 0 
      ? Math.round((occupancy_count / total_capacity) * 100)
      : 0;

    // Group revenue by housing model, payer type
    const revenue_by_model = {};
    const revenue_by_payer = {};

    filteredInvoices.forEach(inv => {
      // Sum by model (would need to fetch placement to know model)
      revenue_by_payer[inv.payer_type] = (revenue_by_payer[inv.payer_type] || 0) + (inv.total_amount_due || 0);
    });

    return Response.json({
      success: true,
      summary: {
        property_id,
        report_month,
        occupancy_count,
        total_capacity,
        occupancy_percentage,
        expected_monthly_revenue,
        amount_received,
        amount_outstanding,
        invoices_paid,
        invoices_partial,
        invoices_overdue,
        total_expenses_due,
        expenses_paid,
        lease_expense,
        other_expenses,
        net_profit_loss,
        profit_margin_percentage,
        revenue_by_payer_type: revenue_by_payer,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});