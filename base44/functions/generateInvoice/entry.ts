import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !['housing_admin', 'billing_staff'].includes(user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payload = await req.json();
    const {
      property_id,
      property_name,
      placement_id,
      payment_source_id,
      billing_period_start,
      billing_period_end,
      line_items,
      payer_name,
      payer_email,
      payer_type,
      due_date,
      notes,
    } = payload;

    // Calculate totals
    const subtotal = line_items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const tax_amount = 0; // Configurable
    const total_amount_due = subtotal + tax_amount;

    // Generate invoice number (YYYY-MM-XXXXX format)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const randomNum = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    const invoice_number = `${year}${month}-${randomNum}`;

    // Create Invoice
    const invoice = await base44.entities.Invoice.create({
      invoice_number,
      invoice_date: today.toISOString().split('T')[0],
      billing_period_start,
      billing_period_end,
      property_id,
      property_name,
      placement_id,
      payment_source_id,
      payer_name,
      payer_email,
      payer_type,
      line_items: JSON.stringify(line_items),
      subtotal,
      tax_amount,
      total_amount_due,
      amount_paid: 0,
      remaining_balance: total_amount_due,
      due_date,
      invoice_status: 'draft',
      notes,
    });

    return Response.json({
      success: true,
      invoice_id: invoice.id,
      invoice_number,
      total_amount_due,
      message: `Invoice ${invoice_number} created for ${payer_name}`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});