import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import useCurrentUser from "@/lib/useCurrentUser";
import PageHeader from "@/components/PageHeader";
import AccessDenied from "@/components/AccessDenied";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import FormModal from "@/components/FormModal";
import FormField from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Fees() {
  const { isInternal } = useCurrentUser();
  const [fees, setFees] = useState([]);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ housing_resident_id: '', resident_name: '', charge_type: 'program_fee', amount: '', due_date: '', fee_status: 'pending', paid_date: '', notes: '' });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const [f, r] = await Promise.all([
      base44.entities.ProgramFee.list('-created_date'),
      base44.entities.HousingResident.list(),
    ]);
    setFees(f); setResidents(r);
    setLoading(false);
  }

  function handleChange(name, value) {
    setForm(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'housing_resident_id') { const r = residents.find(x => x.id === value); next.resident_name = r ? `${r.first_name} ${r.last_name}` : ''; }
      return next;
    });
  }

  function openNew() { setForm({ housing_resident_id: '', resident_name: '', charge_type: 'program_fee', amount: '', due_date: '', fee_status: 'pending', paid_date: '', notes: '' }); setEditId(null); setShowForm(true); }
  function openEdit(f) { setForm({ ...f }); setEditId(f.id); setShowForm(true); }

  async function handleSubmit() {
    setSaving(true);
    const payload = { ...form, amount: Number(form.amount) || 0 };
    if (editId) await base44.entities.ProgramFee.update(editId, payload);
    else await base44.entities.ProgramFee.create(payload);
    setSaving(false); setShowForm(false); setEditId(null); load();
  }

  if (!isInternal) return <AccessDenied message="Fee records are restricted to internal housing staff only." />;

  const columns = [
    { header: "Resident", accessor: "resident_name" },
    { header: "Type", cell: r => <StatusBadge status={r.charge_type} /> },
    { header: "Amount", cell: r => `$${(r.amount || 0).toFixed(2)}` },
    { header: "Due Date", accessor: "due_date" },
    { header: "Status", cell: r => <StatusBadge status={r.fee_status} /> },
    { header: "Paid Date", cell: r => r.paid_date || '—' },
  ];

  const chargeTypeOptions = [
    { value: 'program_fee', label: 'Program Fee' }, { value: 'deposit', label: 'Deposit' },
    { value: 'damage_fee', label: 'Damage Fee' }, { value: 'late_fee', label: 'Late Fee' },
    { value: 'other', label: 'Other' },
  ];
  const feeStatusOptions = [
    { value: 'pending', label: 'Pending' }, { value: 'due', label: 'Due' },
    { value: 'paid', label: 'Paid' }, { value: 'waived', label: 'Waived' },
    { value: 'overdue', label: 'Overdue' },
  ];

  return (
    <div>
      <PageHeader title="Fees / Charges" subtitle="Track program fees and charges">
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> New Charge</Button>
      </PageHeader>
      {loading ? <div className="flex justify-center py-12"><div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div> : <DataTable columns={columns} data={fees} onRowClick={openEdit} />}

      <FormModal open={showForm} onClose={() => setShowForm(false)} title={editId ? "Edit Charge" : "New Charge"} onSubmit={handleSubmit} loading={saving}>
        <FormField label="Resident" name="housing_resident_id" value={form.housing_resident_id} onChange={handleChange} type="select" options={residents.map(r => ({ value: r.id, label: `${r.first_name} ${r.last_name}` }))} required />
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Charge Type" name="charge_type" value={form.charge_type} onChange={handleChange} type="select" options={chargeTypeOptions} />
          <FormField label="Amount ($)" name="amount" value={form.amount} onChange={handleChange} type="number" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Due Date" name="due_date" value={form.due_date} onChange={handleChange} type="date" />
          <FormField label="Status" name="fee_status" value={form.fee_status} onChange={handleChange} type="select" options={feeStatusOptions} />
        </div>
        <FormField label="Paid Date" name="paid_date" value={form.paid_date} onChange={handleChange} type="date" />
        <FormField label="Notes" name="notes" value={form.notes} onChange={handleChange} type="textarea" />
      </FormModal>
    </div>
  );
}