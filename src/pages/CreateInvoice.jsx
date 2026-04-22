import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Eye, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TYPES = ['resident_fee','partner_fee','software_license','va_per_diem','consulting','other'];
const TYPE_LABELS = { resident_fee:'Resident Fee', partner_fee:'Partner Fee', software_license:'Software License', va_per_diem:'VA Per Diem', consulting:'Consulting', other:'Other' };

function fmt(n) { return `$${(n||0).toLocaleString('en-US', {minimumFractionDigits:2})}`; }

export default function CreateInvoice() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [form, setForm] = useState({
    billed_to_name: '', billed_to_email: '', billed_to_organization: '',
    invoice_type: 'resident_fee', due_date: '', notes: '', tax_rate: 0,
  });
  const [lineItems, setLineItems] = useState([{ description: '', quantity: 1, unit_price: 0, total: 0 }]);

  function updateLine(idx, field, value) {
    setLineItems(prev => prev.map((li, i) => {
      if (i !== idx) return li;
      const updated = { ...li, [field]: value };
      if (field === 'quantity' || field === 'unit_price') {
        updated.total = (parseFloat(updated.quantity) || 0) * (parseFloat(updated.unit_price) || 0);
      }
      return updated;
    }));
  }

  function addLine() { setLineItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0, total: 0 }]); }
  function removeLine(idx) { setLineItems(prev => prev.filter((_, i) => i !== idx)); }

  const subtotal = lineItems.reduce((s, li) => s + (li.total || 0), 0);
  const taxAmount = subtotal * ((parseFloat(form.tax_rate) || 0) / 100);
  const totalAmount = subtotal + taxAmount;

  async function handleSave(status = 'draft') {
    setSaving(true);
    const numRes = await base44.functions.invoke('generateInvoiceNumber', {});
    const invoice_number = numRes.data.invoice_number;
    await base44.entities.Invoice.create({
      invoice_number,
      invoice_type: form.invoice_type,
      billed_to_name: form.billed_to_name,
      billed_to_email: form.billed_to_email,
      billed_to_organization: form.billed_to_organization,
      line_items: JSON.stringify(lineItems),
      subtotal,
      tax_rate: parseFloat(form.tax_rate) || 0,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      status,
      due_date: form.due_date,
      notes: form.notes,
    });
    setSaving(false);
    navigate('/billing');
  }

  const labelClass = "block text-xs font-semibold text-muted-label mb-1 uppercase tracking-wide";
  const inputClass = "w-full bg-input border border-card-border rounded px-3 py-2 text-sm text-heading placeholder-muted-label focus:outline-none focus:border-primary";

  if (preview) return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-heading">Invoice Preview</h1>
        <Button variant="outline" onClick={() => setPreview(false)}>← Edit</Button>
      </div>
      <div className="bg-white text-gray-900 rounded-lg p-8 shadow-xl">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-bold text-indigo-700">RE Jones Global</h2>
            <p className="text-sm text-gray-500 mt-1">Legacy Properties Operations</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">INVOICE</div>
            <div className="text-sm text-gray-500">HOH-{new Date().getFullYear()}-XXXX</div>
            <div className="text-sm text-gray-500 mt-1">Due: {form.due_date || 'TBD'}</div>
          </div>
        </div>
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Bill To</p>
          <p className="font-semibold">{form.billed_to_name || '—'}</p>
          {form.billed_to_organization && <p className="text-sm">{form.billed_to_organization}</p>}
          {form.billed_to_email && <p className="text-sm text-gray-500">{form.billed_to_email}</p>}
        </div>
        <table className="w-full text-sm mb-6">
          <thead><tr className="border-b-2 border-gray-200">
            <th className="text-left py-2">Description</th>
            <th className="text-right py-2">Qty</th>
            <th className="text-right py-2">Unit Price</th>
            <th className="text-right py-2">Total</th>
          </tr></thead>
          <tbody>{lineItems.map((li, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-2">{li.description}</td>
              <td className="text-right py-2">{li.quantity}</td>
              <td className="text-right py-2">{fmt(li.unit_price)}</td>
              <td className="text-right py-2">{fmt(li.total)}</td>
            </tr>
          ))}</tbody>
        </table>
        <div className="flex justify-end">
          <div className="w-48 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            {form.tax_rate > 0 && <div className="flex justify-between"><span>Tax ({form.tax_rate}%)</span><span>{fmt(taxAmount)}</span></div>}
            <div className="flex justify-between font-bold text-base border-t pt-1 mt-1"><span>Total</span><span>{fmt(totalAmount)}</span></div>
          </div>
        </div>
        {form.notes && <div className="mt-6 text-sm text-gray-500 border-t pt-4"><p className="font-semibold mb-1">Notes:</p><p>{form.notes}</p></div>}
      </div>
      <div className="flex gap-3">
        <Button onClick={() => handleSave('draft')} variant="outline" disabled={saving}>Save as Draft</Button>
        <Button onClick={() => handleSave('sent')} disabled={saving} className="gap-2"><Send className="w-4 h-4" />Send Invoice</Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-heading">Create Invoice</h1>
          <p className="text-sm text-muted-label mt-1">Build and send a new invoice</p>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-heading">Billing Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Billed To Name *</label>
            <input className={inputClass} value={form.billed_to_name} onChange={e => setForm(f=>({...f, billed_to_name: e.target.value}))} placeholder="Full name" />
          </div>
          <div>
            <label className={labelClass}>Organization</label>
            <input className={inputClass} value={form.billed_to_organization} onChange={e => setForm(f=>({...f, billed_to_organization: e.target.value}))} placeholder="Organization name" />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input className={inputClass} type="email" value={form.billed_to_email} onChange={e => setForm(f=>({...f, billed_to_email: e.target.value}))} placeholder="email@example.com" />
          </div>
          <div>
            <label className={labelClass}>Invoice Type</label>
            <select className={inputClass} value={form.invoice_type} onChange={e => setForm(f=>({...f, invoice_type: e.target.value}))}>
              {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Due Date</label>
            <input className={inputClass} type="date" value={form.due_date} onChange={e => setForm(f=>({...f, due_date: e.target.value}))} />
          </div>
          <div>
            <label className={labelClass}>Tax Rate (%)</label>
            <input className={inputClass} type="number" min="0" step="0.1" value={form.tax_rate} onChange={e => setForm(f=>({...f, tax_rate: e.target.value}))} placeholder="0" />
          </div>
        </div>
        <div>
          <label className={labelClass}>Notes</label>
          <textarea className={inputClass} rows={2} value={form.notes} onChange={e => setForm(f=>({...f, notes: e.target.value}))} placeholder="Payment terms, special instructions..." />
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-card border border-card-border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-heading">Line Items</h2>
          <Button variant="outline" size="sm" onClick={addLine} className="gap-1"><Plus className="w-3 h-3" />Add Item</Button>
        </div>
        <div className="space-y-3">
          {lineItems.map((li, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-5">
                {idx === 0 && <label className={labelClass}>Description</label>}
                <input className={inputClass} value={li.description} onChange={e => updateLine(idx,'description',e.target.value)} placeholder="Service description" />
              </div>
              <div className="col-span-2">
                {idx === 0 && <label className={labelClass}>Qty</label>}
                <input className={inputClass} type="number" min="1" value={li.quantity} onChange={e => updateLine(idx,'quantity',e.target.value)} />
              </div>
              <div className="col-span-2">
                {idx === 0 && <label className={labelClass}>Unit Price</label>}
                <input className={inputClass} type="number" min="0" step="0.01" value={li.unit_price} onChange={e => updateLine(idx,'unit_price',e.target.value)} />
              </div>
              <div className="col-span-2">
                {idx === 0 && <label className={labelClass}>Total</label>}
                <div className="bg-elevated border border-card-border rounded px-3 py-2 text-sm text-heading font-semibold">{fmt(li.total)}</div>
              </div>
              <div className="col-span-1">
                {idx === 0 && <label className={labelClass}>&nbsp;</label>}
                <button onClick={() => removeLine(idx)} className="p-2 text-accent-rose hover:bg-accent-rose/10 rounded transition"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-card-border pt-4 flex justify-end">
          <div className="w-56 space-y-2 text-sm">
            <div className="flex justify-between text-muted-label"><span>Subtotal</span><span className="text-heading">{fmt(subtotal)}</span></div>
            {form.tax_rate > 0 && <div className="flex justify-between text-muted-label"><span>Tax ({form.tax_rate}%)</span><span className="text-heading">{fmt(taxAmount)}</span></div>}
            <div className="flex justify-between font-bold text-base border-t border-card-border pt-2"><span className="text-heading">Total</span><span className="text-primary">{fmt(totalAmount)}</span></div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => setPreview(true)} className="gap-2"><Eye className="w-4 h-4" />Preview</Button>
        <Button variant="outline" onClick={() => handleSave('draft')} disabled={saving}>Save Draft</Button>
        <Button onClick={() => handleSave('sent')} disabled={saving} className="gap-2"><Send className="w-4 h-4" />Send Invoice</Button>
      </div>
    </div>
  );
}