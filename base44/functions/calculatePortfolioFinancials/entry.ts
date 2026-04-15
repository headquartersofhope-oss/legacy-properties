import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !['housing_admin', 'billing_staff'].includes(user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payload = await req.json();
    const { report_month } = payload;

    // Fetch all invoices
    const allInvoices = await base44.entities.Invoice.list();
    const filteredInvoices = allInvoices.filter(inv => {
      const invMonth = inv.billing_period_start?.substring(0, 7);
      return invMonth === report_month;
    });

    // Fetch all expenses
    const allExpenses = await base44.entities.HouseExpense.list();
    const filteredExpenses = allExpenses.filter(exp => {
      const expMonth = exp.expense_date?.substring(0, 7);
      return expMonth === report_month;
    });

    // Portfolio totals
    const total_monthly_expected_revenue = filteredInvoices.reduce((sum, inv) => sum + (inv.total_amount_due || 0), 0);
    const total_received = filteredInvoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);
    const total_outstanding = filteredInvoices.reduce((sum, inv) => sum + (inv.remaining_balance || 0), 0);
    const total_expenses_due = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const total_expenses_paid = filteredExpenses.reduce((sum, exp) => sum + (exp.amount_paid || 0), 0);

    const portfolio_net = total_received - total_expenses_due;

    // By house
    const properties = await base44.entities.Property.list();
    const by_house = properties.map(prop => {
      const propInvoices = filteredInvoices.filter(inv => inv.property_id === prop.id);
      const propExpenses = filteredExpenses.filter(exp => exp.property_id === prop.id);

      const prop_revenue = propInvoices.reduce((sum, inv) => sum + (inv.total_amount_due || 0), 0);
      const prop_received = propInvoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);
      const prop_expenses = propExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const prop_net = prop_received - prop_expenses;

      return {
        property_id: prop.id,
        property_name: prop.property_name,
        expected_revenue: prop_revenue,
        received: prop_received,
        expenses: prop_expenses,
        net_profit: prop_net,
        margin_percent: prop_revenue > 0 ? Math.round((prop_net / prop_revenue) * 100) : 0,
      };
    });

    // Revenue by payer type
    const revenue_by_payer = {};
    filteredInvoices.forEach(inv => {
      revenue_by_payer[inv.payer_type] = (revenue_by_payer[inv.payer_type] || 0) + (inv.total_amount_due || 0);
    });

    return Response.json({
      success: true,
      portfolio: {
        report_month,
        total_monthly_expected_revenue,
        total_received,
        total_outstanding,
        total_expenses_due,
        total_expenses_paid,
        portfolio_net,
        portfolio_margin_percent: total_monthly_expected_revenue > 0 
          ? Math.round((portfolio_net / total_monthly_expected_revenue) * 100)
          : 0,
        by_house,
        revenue_by_payer_type: revenue_by_payer,
        top_performing_houses: by_house.sort((a, b) => b.net_profit - a.net_profit).slice(0, 5),
        underperforming_houses: by_house.filter(h => h.net_profit < 0).sort((a, b) => a.net_profit - b.net_profit).slice(0, 5),
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});