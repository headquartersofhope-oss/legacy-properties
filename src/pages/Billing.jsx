import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Plus, Download, CheckCircle, DollarSign, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/StatusBadge';
import PremiumStatCard from '@/components/PremiumStatCard';

const TYPE_LABELS = {
  resident_fee: 'Resident Fee', partner_fee: 'Partner Fee',
  software_license: 'License', va_per_diem: 'VA Per Diem',
  consulting: 'Consulting', other: 'Other',
};

function fmt(n) { return `$${(n || 0).toLocaleString()}`; }

export default function Billing() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => { loadInvoices(); }, []);

  async function loadInvoices() {
    setLoading(true);
    const data = await base44.entities.Invoice.list('-created_date', 200);
    setInvoices(data);
    setLoading(false);
  }

  async function markPaid(inv) {
    await base44.entities.Invoice.update(inv.id, {
      status: 'paid',
      paid_date: new Date().toISOString().split('T')[0],
    });
    loadInvoices();
  }

  function exportCSV() {
    const rows = [['Invoice #', 'Billed To', 'Type', 'Amount', 'Due Date', 'Status']];
    filtered.forEach(inv => rows.push([
      inv.invoice_number, inv.billed_to_name,
      TYPE_LABELS[inv.invoice_type] || inv.invoice_type,
      inv.total_amount, inv.due_date, inv.status,
    ]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv,' + encodeURIComponent(csv);
    a.download = 'invoices.csv';
    a.click();
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const nextWeek = new Date(now.getTime() + 7 * 86400000).toISOString().split('T')[0];

  const outstanding = invoices.filter(i => ['sent', 'draft'].includes(i.status));
  const paidThisMonth = invoices.filter(i => i.status === 'paid' && i.paid_date >= startOfMonth);
  const overdue = invoices.filter(i => i.status === 'overdue');
  const upcomingWeek = invoices.filter(i => i.due_date <= nextWeek && ['sent', 'draft'].includes(i.status));

  const filtered = invoices.filter(inv => {
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
    if (typeFilter !== 'all' && inv.invoice_type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-heading">Billing & Invoicing</h1>
          <p className="text-sm text-muted-label mt-1">Manage invoices and track payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV} className="gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Link to="/billing/create">
            <Button className="gap-2"><Plus className="w-4 h-4" /> New Invoice</Button>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <PremiumStatCard title="Outstanding" value={fmt(outstanding.reduce((s,i)=>s+(i.total_amount||0),0))} subtitle={`${outstanding.length} invoices`} accent="rose" icon={DollarSign} />
        <PremiumStatCard title="Paid This Month" value={fmt(paidThisMonth.reduce((s,i)=>s+(i.total_amount||0),0))} subtitle={`${paidThisMonth.length} invoices`} accent="emerald" icon={CheckCircle} />
        <PremiumStatCard title="Overdue" value={fmt(overdue.reduce((s,i)=>s+(i.total_amount||0),0))} subtitle={`${overdue.length} invoices`} accent="rose" icon={AlertTriangle} />
        <PremiumStatCard title="Due This Week" value={fmt(upcomingWeek.reduce((s,i)=>s+(i.total_amount||0),0))} subtitle={`${upcomingWeek.length} invoices`} accent="amber" icon={Clock} />
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-input border border-card-border rounded px-3 py-2 text-sm text-heading">
          <option value="all">All Statuses</option>
          {['draft','sent','paid','overdue','cancelled','void'].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
          ))}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="bg-input border border-card-border rounded px-3 py-2 text-sm text-heading">
          <option value="all">All Types</option>
          {Object.entries(TYPE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Invoice Table */}
      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-elevated border-b border-card-border">
            <tr>
              {['Invoice #','Billed To','Type','Amount','Due Date','Status','Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-label uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-muted-label">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-muted-label">No invoices found</td></tr>
            ) : filtered.map(inv => (
              <tr key={inv.id} className="hover:bg-elevated/50 transition-colors">
                <td className="px-4 py-3 font-mono text-primary text-xs">{inv.invoice_number || '—'}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-heading">{inv.billed_to_name}</div>
                  {inv.billed_to_organization && <div className="text-xs text-muted-label">{inv.billed_to_organization}</div>}
                </td>
                <td className="px-4 py-3 text-body-text">{TYPE_LABELS[inv.invoice_type] || inv.invoice_type || '—'}</td>
                <td className="px-4 py-3 font-semibold text-heading">{fmt(inv.total_amount)}</td>
                <td className="px-4 py-3 text-body-text">{inv.due_date || '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link to={`/billing/${inv.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                    {inv.status !== 'paid' && (
                      <Button size="sm" onClick={() => markPaid(inv)} className="bg-accent-emerald/20 text-accent-emerald hover:bg-accent-emerald/30 border border-accent-emerald/30">
                        Mark Paid
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}