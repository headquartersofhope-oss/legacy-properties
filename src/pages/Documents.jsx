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
import { Plus, Upload } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function Documents() {
  const { isInternal } = useCurrentUser();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ linked_entity_type: 'referral', linked_entity_id: '', linked_entity_name: '', document_type: 'id', file_url: '', file_name: '', verified_status: 'pending', notes: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await base44.entities.Document.list('-created_date');
    setDocs(data);
    setLoading(false);
  }

  function handleChange(name, value) { setForm(prev => ({ ...prev, [name]: value })); }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, file_url, file_name: file.name }));
    setUploading(false);
  }

  async function handleSubmit() {
    setSaving(true);
    await base44.entities.Document.create(form);
    setSaving(false);
    setShowForm(false);
    load();
  }

  async function updateVerification(docId, status) {
    await base44.entities.Document.update(docId, { verified_status: status });
    load();
  }

  if (!isInternal) return <AccessDenied message="Document management is restricted to internal housing staff only." />;

  const docTypeOptions = [
    { value: 'id', label: 'ID' }, { value: 'income_verification', label: 'Income Verification' },
    { value: 'benefits_verification', label: 'Benefits Verification' }, { value: 'house_rules_acknowledgment', label: 'House Rules' },
    { value: 'agreement_form', label: 'Agreement Form' }, { value: 'referral_packet', label: 'Referral Packet' },
    { value: 'medical_record', label: 'Medical Record' }, { value: 'background_check', label: 'Background Check' },
    { value: 'incident_attachment', label: 'Incident Attachment' }, { value: 'other', label: 'Other' },
  ];

  const columns = [
    { header: "File", cell: r => r.file_name || '—' },
    { header: "Type", cell: r => <StatusBadge status={r.document_type} /> },
    { header: "Linked To", cell: r => `${r.linked_entity_type}: ${r.linked_entity_name || r.linked_entity_id}` },
    { header: "Verification", cell: r => (
      <div className="flex items-center gap-1">
        <StatusBadge status={r.verified_status} />
        {r.verified_status === 'pending' && (
          <div className="flex gap-1 ml-2">
            <button onClick={(e) => { e.stopPropagation(); updateVerification(r.id, 'verified'); }} className="text-green-600 text-xs hover:underline">✓</button>
            <button onClick={(e) => { e.stopPropagation(); updateVerification(r.id, 'rejected'); }} className="text-red-600 text-xs hover:underline">✗</button>
          </div>
        )}
      </div>
    )},
    { header: "View", cell: r => r.file_url ? <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="text-primary text-xs hover:underline" onClick={e => e.stopPropagation()}>Open</a> : '—' },
  ];

  return (
    <div>
      <PageHeader title="Documents" subtitle="Manage documents for referrals, applicants, and residents">
        <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" /> Upload Document</Button>
      </PageHeader>
      {loading ? <div className="flex justify-center py-12"><div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div> : <DataTable columns={columns} data={docs} />}

      <FormModal open={showForm} onClose={() => setShowForm(false)} title="Upload Document" onSubmit={handleSubmit} loading={saving}>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Linked Entity Type" name="linked_entity_type" value={form.linked_entity_type} onChange={handleChange} type="select"
            options={[{ value: 'referral', label: 'Referral' }, { value: 'applicant', label: 'Applicant' }, { value: 'resident', label: 'Resident' }]} />
          <FormField label="Entity ID" name="linked_entity_id" value={form.linked_entity_id} onChange={handleChange} required />
        </div>
        <FormField label="Entity Name" name="linked_entity_name" value={form.linked_entity_name} onChange={handleChange} />
        <FormField label="Document Type" name="document_type" value={form.document_type} onChange={handleChange} type="select" options={docTypeOptions} />
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">File Upload</Label>
          <Input type="file" onChange={handleFileUpload} disabled={uploading} />
          {uploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
          {form.file_url && <p className="text-xs text-green-600">File uploaded: {form.file_name}</p>}
        </div>
        <FormField label="Notes" name="notes" value={form.notes} onChange={handleChange} type="textarea" />
      </FormModal>
    </div>
  );
}