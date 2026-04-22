import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const year = new Date().getFullYear();
    const allInvoices = await base44.asServiceRole.entities.Invoice.list('-created_date', 200);

    const prefix = `HOH-${year}-`;
    let maxNum = 0;

    for (const inv of allInvoices) {
      if (inv.invoice_number && inv.invoice_number.startsWith(prefix)) {
        const numPart = parseInt(inv.invoice_number.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
      }
    }

    const nextNum = maxNum + 1;
    const invoice_number = `${prefix}${String(nextNum).padStart(4, '0')}`;

    return Response.json({ invoice_number });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});