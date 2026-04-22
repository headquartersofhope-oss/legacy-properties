import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function getNextDate(currentDate, cycle) {
  const d = new Date(currentDate);
  if (cycle === 'weekly') d.setDate(d.getDate() + 7);
  else if (cycle === 'monthly') d.setMonth(d.getMonth() + 1);
  else if (cycle === 'quarterly') d.setMonth(d.getMonth() + 3);
  return d.toISOString().split('T')[0];
}

function generateInvoiceNumber(allInvoices) {
  const year = new Date().getFullYear();
  const prefix = `HOH-${year}-`;
  let maxNum = 0;
  for (const inv of allInvoices) {
    if (inv.invoice_number && inv.invoice_number.startsWith(prefix)) {
      const numPart = parseInt(inv.invoice_number.replace(prefix, ''), 10);
      if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
    }
  }
  return `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const today = new Date().toISOString().split('T')[0];
    const rules = await base44.asServiceRole.entities.RecurringBillingRule.filter({ active: true });
    const allInvoices = await base44.asServiceRole.entities.Invoice.list('-created_date', 500);

    const dueRules = rules.filter(r => r.next_billing_date === today);
    const created = [];

    let invoiceCounter = 0;

    for (const rule of dueRules) {
      const lineItems = [{ description: rule.rule_name, quantity: 1, unit_price: rule.amount, total: rule.amount }];
      
      // Generate unique invoice number for each rule
      const tempInvoices = [...allInvoices, ...created];
      const year = new Date().getFullYear();
      const prefix = `HOH-${year}-`;
      let maxNum = 0;
      for (const inv of tempInvoices) {
        if (inv.invoice_number && inv.invoice_number.startsWith(prefix)) {
          const numPart = parseInt(inv.invoice_number.replace(prefix, ''), 10);
          if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
        }
      }
      invoiceCounter = maxNum + 1;
      const invoice_number = `${prefix}${String(invoiceCounter).padStart(4, '0')}`;

      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + 14);

      const newInvoice = await base44.asServiceRole.entities.Invoice.create({
        invoice_number,
        invoice_type: rule.billing_type.includes('partner') ? 'partner_fee' : rule.billing_type.includes('license') ? 'software_license' : 'resident_fee',
        billed_to_name: rule.rule_name,
        line_items: JSON.stringify(lineItems),
        subtotal: rule.amount,
        tax_rate: 0,
        tax_amount: 0,
        total_amount: rule.amount,
        status: rule.auto_send ? 'sent' : 'draft',
        due_date: dueDate.toISOString().split('T')[0],
        organization_id: rule.organization_id || '',
      });

      created.push(newInvoice);

      await base44.asServiceRole.entities.RecurringBillingRule.update(rule.id, {
        next_billing_date: getNextDate(today, rule.billing_cycle),
      });
    }

    return Response.json({ success: true, processed: dueRules.length, created: created.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});