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
      invoice_id,
      payment_amount,
      payment_method,
      reference_number,
      notes,
    } = payload;

    // Fetch invoice
    const invoice = await base44.entities.Invoice.get(invoice_id);
    if (!invoice) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Calculate new balance
    const new_amount_paid = (invoice.amount_paid || 0) + payment_amount;
    const new_remaining_balance = invoice.total_amount_due - new_amount_paid;
    const is_partial = new_remaining_balance > 0;

    // Determine invoice status
    let invoice_status = 'partial';
    if (new_remaining_balance <= 0) {
      invoice_status = 'paid';
    }

    // Create Payment record
    const payment = await base44.entities.Payment.create({
      payment_date: new Date().toISOString().split('T')[0],
      invoice_id,
      invoice_number: invoice.invoice_number,
      property_id: invoice.property_id,
      property_name: invoice.property_name,
      payment_source_id: invoice.payment_source_id,
      payer_name: invoice.payer_name,
      payment_amount,
      payment_method,
      reference_number,
      is_partial,
      payment_status: 'processed',
      notes,
    });

    // Update Invoice
    await base44.entities.Invoice.update(invoice_id, {
      amount_paid: new_amount_paid,
      remaining_balance: Math.max(0, new_remaining_balance),
      invoice_status,
    });

    return Response.json({
      success: true,
      payment_id: payment.id,
      new_balance: Math.max(0, new_remaining_balance),
      message: `Payment of $${payment_amount} recorded for invoice ${invoice.invoice_number}`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});