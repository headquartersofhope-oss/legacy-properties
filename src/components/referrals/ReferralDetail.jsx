import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import FormField from "@/components/FormField";
import { Loader2 } from "lucide-react";

export default function ReferralDetail({ open, onClose, referral, isInternal, isPartner, onUpdated }) {
  const [internalNotes, setInternalNotes] = useState(referral?.internal_review_notes || '');
  const [partnerNotes, setPartnerNotes] = useState(referral?.partner_visible_notes || '');
  const [saving, setSaving] = useState(false);

  async function updateStatus(newStatus) {
    setSaving(true);
    const payload = { referral_status: newStatus, internal_review_notes: internalNotes, partner_visible_notes: partnerNotes };
    if (['approved', 'denied', 'waitlisted'].includes(newStatus)) {
      payload.decision_date = new Date().toISOString();
    }
    await base44.entities.Referral.update(referral.id, payload);
    setSaving(false);
    onUpdated();
  }

  async function convertToApplicant() {
    setSaving(true);
    await base44.entities.HousingApplicant.create({
      referral_id: referral.id,
      first_name: referral.applicant_first_name,
      last_name: referral.applicant_last_name,
      phone: referral.applicant_phone,
      email: referral.applicant_email,
      dob: referral.applicant_dob,
      intake_status: 'pending',
      applicant_status: 'new',
      documents_status: 'incomplete',
    });
    await base44.entities.Referral.update(referral.id, { referral_status: 'admitted' });
    setSaving(false);
    onUpdated();
  }

  const r = referral;
  const detail = (label, val) => val ? (
    <div className="flex justify-between py-1.5 border-b border-border/50">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground text-right max-w-[60%]">{val}</span>
    </div>
  ) : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Referral: {r.applicant_first_name} {r.applicant_last_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <StatusBadge status={r.referral_status} />
            <StatusBadge status={r.priority_level} />
          </div>

          <div className="space-y-0">
            {detail('Phone', r.applicant_phone)}
            {detail('Email', r.applicant_email)}
            {detail('DOB', r.applicant_dob)}
            {detail('Housing Situation', r.current_housing_situation)}
            {detail('Employment/Income', r.employment_income_summary)}
            {detail('Program Fit', r.population_program_fit)}
            {detail('Requested Site', r.requested_site)}
            {detail('Consent', r.consent_status)}
            {isInternal && detail('Referring Org', r.referring_organization_name)}
            {isInternal && detail('Referring User', r.referring_user_email)}
            {detail('Submitted', r.submitted_at ? new Date(r.submitted_at).toLocaleString() : null)}
            {detail('Decision Date', r.decision_date ? new Date(r.decision_date).toLocaleString() : null)}
          </div>

          {/* Partner visible notes */}
          {detail('Partner Notes', r.partner_visible_notes)}

          {/* Internal review section */}
          {isInternal && (
            <div className="space-y-3 pt-3 border-t">
              <h3 className="text-sm font-semibold">Internal Review</h3>
              <FormField label="Internal Notes" name="internal_notes" value={internalNotes} onChange={(_, v) => setInternalNotes(v)} type="textarea" />
              <FormField label="Partner Visible Notes" name="partner_notes" value={partnerNotes} onChange={(_, v) => setPartnerNotes(v)} type="textarea" />

              <div className="flex flex-wrap gap-2">
                {['submitted', 'received'].includes(r.referral_status) && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus('under_review')} disabled={saving}>
                    Start Review
                  </Button>
                )}
                {['under_review', 'received', 'submitted'].includes(r.referral_status) && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => updateStatus('more_information_requested')} disabled={saving}>
                      Request More Info
                    </Button>
                    <Button size="sm" onClick={() => updateStatus('approved')} disabled={saving}>
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => updateStatus('denied')} disabled={saving}>
                      Deny
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus('waitlisted')} disabled={saving}>
                      Waitlist
                    </Button>
                  </>
                )}
                {r.referral_status === 'more_information_requested' && (
                  <>
                    <Button size="sm" onClick={() => updateStatus('approved')} disabled={saving}>Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => updateStatus('denied')} disabled={saving}>Deny</Button>
                  </>
                )}
                {r.referral_status === 'approved' && (
                  <Button size="sm" onClick={convertToApplicant} disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                    Convert to Applicant
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Partner actions */}
          {isPartner && r.referral_status === 'more_information_requested' && (
            <div className="space-y-3 pt-3 border-t">
              <h3 className="text-sm font-semibold">Additional Information Requested</h3>
              <FormField label="Response Notes" name="partner_notes" value={partnerNotes} onChange={(_, v) => setPartnerNotes(v)} type="textarea" />
              <Button size="sm" onClick={() => updateStatus('submitted')} disabled={saving}>
                Resubmit with Info
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}