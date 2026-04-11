const statusColors = {
  // Bed status
  available: 'bg-green-100 text-green-700',
  occupied: 'bg-blue-100 text-blue-700',
  reserved: 'bg-purple-100 text-purple-700',
  out_of_service: 'bg-gray-100 text-gray-700',
  // General
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
  under_maintenance: 'bg-orange-100 text-orange-700',
  pending_approval: 'bg-yellow-100 text-yellow-700',
  // Referral
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  received: 'bg-sky-100 text-sky-700',
  under_review: 'bg-amber-100 text-amber-700',
  more_information_requested: 'bg-orange-100 text-orange-700',
  approved: 'bg-green-100 text-green-700',
  denied: 'bg-red-100 text-red-700',
  waitlisted: 'bg-purple-100 text-purple-700',
  withdrawn: 'bg-gray-100 text-gray-700',
  admitted: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-slate-100 text-slate-700',
  // Applicant
  new: 'bg-blue-100 text-blue-700',
  screening: 'bg-amber-100 text-amber-700',
  eligible: 'bg-green-100 text-green-700',
  ineligible: 'bg-red-100 text-red-700',
  ready_for_placement: 'bg-emerald-100 text-emerald-700',
  placed: 'bg-green-100 text-green-700',
  // Resident
  pending_move_in: 'bg-yellow-100 text-yellow-700',
  suspended: 'bg-red-100 text-red-700',
  exited: 'bg-gray-100 text-gray-700',
  discharged: 'bg-rose-100 text-rose-700',
  // Intake
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-700',
  // Docs
  incomplete: 'bg-yellow-100 text-yellow-700',
  pending_review: 'bg-amber-100 text-amber-700',
  complete: 'bg-green-100 text-green-700',
  issues: 'bg-red-100 text-red-700',
  // Verification
  verified: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-700',
  // Fee
  due: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  waived: 'bg-slate-100 text-slate-700',
  overdue: 'bg-red-100 text-red-700',
  // Compliance
  pass: 'bg-green-100 text-green-700',
  fail: 'bg-red-100 text-red-700',
  needs_attention: 'bg-orange-100 text-orange-700',
  not_applicable: 'bg-gray-100 text-gray-700',
  // Incident followup
  none_needed: 'bg-gray-100 text-gray-700',
  // Severity
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
  urgent: 'bg-red-100 text-red-700',
  // Waitlist
  offered: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  declined: 'bg-gray-100 text-gray-700',
  removed: 'bg-gray-100 text-gray-700',
  // Occupancy
  ended: 'bg-gray-100 text-gray-700',
  transferred: 'bg-purple-100 text-purple-700',
};

export default function StatusBadge({ status }) {
  if (!status) return null;
  const colors = statusColors[status] || 'bg-gray-100 text-gray-700';
  const label = status.replace(/_/g, ' ');
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${colors}`}>
      {label}
    </span>
  );
}