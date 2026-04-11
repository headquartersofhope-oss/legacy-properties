import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import FormModal from "@/components/FormModal";
import FormField from "@/components/FormField";
import { Button } from "@/components/ui/button";

const defaultForm = {
  applicant_first_name: '', applicant_last_name: '', applicant_dob: '', applicant_phone: '',
  applicant_email: '', current_housing_situation: '', employment_income_summary: '',
  priority_level: 'medium', population_program_fit: '', consent_status: 'not_obtained',
  referral_status: 'draft', requested_site: '', partner_visible_notes: '',
  referring_organization_id: '', referring_organization_name: '', referring_user_email: '',
};

export default function ReferralForm({ open, onClose, onSaved, referral, isPartner, user }) {
  const [form, setForm] = useState(defaultForm);
  const [orgs, setOrgs] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (referral) {
      setForm({ ...defaultForm, ...referral });
    } else {
      const initial = { ...defaultForm };
      if (isPartner && user) {
        initial.referring_user_email = user.email;
        initial.referring_organization_id = user.referring_organization_id || '';
        initial.referring_organization_name = user.referring_organization_name || '';
      }
      setForm(initial);
    }
    base44.entities.ReferringOrganization.filter({ status: 'active' }).then(setOrgs);
  }, [referral, user]);

  function handleChange(name, value) {
    setForm(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'referring_organization_id') {
        const org = orgs.find(o => o.id === value);
        next.referring_organization_name = org?.organization_name || '';
      }
      return next;
    });
  }

  async function handleSubmit() {
    setSaving(true);
    if (referral?.id) {
      await base44.entities.Referral.update(referral.id, form);
    } else {
      await base44.entities.Referral.create(form);
    }
    setSaving(false);
    onSaved();
  }

  async function handleSubmitReferral() {
    setSaving(true);
    const payload = { ...form, referral_status: 'submitted', submitted_at: new Date().toISOString() };
    if (referral?.id) {
      await base44.entities.Referral.update(referral.id, payload);
    } else {
      await base44.entities.Referral.create(payload);
    }
    setSaving(false);
    onSaved();
  }

  const priorityOptions = [
    { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' },
  ];

  const consentOptions = [
    { value: 'not_obtained', label: 'Not Obtained' },
    { value: 'obtained', label: 'Obtained' },
    { value: 'declined', label: 'Declined' },
  ];

  return (
    <FormModal open={open} onClose={onClose} title={referral?.id ? "Edit Referral" : "New Referral"} onSubmit={handleSubmit} loading={saving} submitLabel="Save Draft">
      {!isPartner && (
        <FormField label="Referring Organization" name="referring_organization_id" value={form.referring_organization_id} onChange={handleChange} type="select"
          options={orgs.map(o => ({ value: o.id, label: o.organization_name }))} />
      )}
      <div className="grid grid-cols-2 gap-3">
        <FormField label="First Name" name="applicant_first_name" value={form.applicant_first_name} onChange={handleChange} required />
        <FormField label="Last Name" name="applicant_last_name" value={form.applicant_last_name} onChange={handleChange} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Date of Birth" name="applicant_dob" value={form.applicant_dob} onChange={handleChange} type="date" />
        <FormField label="Phone" name="applicant_phone" value={form.applicant_phone} onChange={handleChange} />
      </div>
      <FormField label="Email" name="applicant_email" value={form.applicant_email} onChange={handleChange} />
      <FormField label="Current Housing Situation" name="current_housing_situation" value={form.current_housing_situation} onChange={handleChange} type="textarea" />
      <FormField label="Employment/Income Summary" name="employment_income_summary" value={form.employment_income_summary} onChange={handleChange} type="textarea" />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Priority Level" name="priority_level" value={form.priority_level} onChange={handleChange} type="select" options={priorityOptions} />
        <FormField label="Consent Status" name="consent_status" value={form.consent_status} onChange={handleChange} type="select" options={consentOptions} />
      </div>
      <FormField label="Population/Program Fit" name="population_program_fit" value={form.population_program_fit} onChange={handleChange} type="textarea" />
      <FormField label="Requested Site/Program" name="requested_site" value={form.requested_site} onChange={handleChange} />
      <FormField label="Notes for Partner" name="partner_visible_notes" value={form.partner_visible_notes} onChange={handleChange} type="textarea" />

      <div className="pt-2 border-t">
        <Button type="button" onClick={handleSubmitReferral} disabled={saving} className="w-full">
          Submit Referral
        </Button>
      </div>
    </FormModal>
  );
}