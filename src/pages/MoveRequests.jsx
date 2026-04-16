import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import useCurrentUser from '@/lib/useCurrentUser';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import AccessDenied from '@/components/AccessDenied';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, ArrowRightLeft, Loader2, CheckCircle2 } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'denied', label: 'Denied' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const REASON_OPTIONS = [
  { value: 'resident_request', label: 'Resident Request' },
  { value: 'staff_assignment', label: 'Staff Assignment' },
  { value: 'capacity_management', label: 'Capacity Management' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'medical', label: 'Medical' },
  { value: 'compatibility', label: 'Compatibility' },
  { value: 'program_completion', label: 'Program Completion' },
  { value: 'other', label: 'Other' },
];

export default function MoveRequests() {
  const { user, isInternal, isAdmin, isManager } = useCurrentUser();
  const [requests, setRequests] = useState([]);
  const [residents, setResidents] = useState([]);
  const [properties, setProperties] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({
    resident_id: '', to_property_id: '', to_room_id: '', to_bed_id: '',
    move_reason: 'resident_request', notes: '', request_date: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [filteredBeds, setFilteredBeds] = useState([]);

  useEffect(() => { if (isInternal) load(); }, [isInternal]);

  if (!isInternal) return <AccessDenied message="Move requests are restricted to internal staff." />;

  async function load() {
    const [reqs, res, props] = await Promise.all([
      base44.entities.MoveRequest.list('-created_date'),
      base44.entities.HousingResident.filter({ resident_status: 'active' }),
      base44.entities.Property.list(),
    ]);
    setRequests(reqs);
    setResidents(res);
    setProperties(props.filter(p => p.house_status === 'active'));
    setLoading(false);
  }

  function handleFormChange(field, value) {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'to_property_id') {
        next.to_room_id = ''; next.to_bed_id = '';
        base44.entities.Room.filter({ site_id: value, status: 'active' }).then(setFilteredRooms);
        setFilteredBeds([]);
      }
      if (field === 'to_room_id') {
        next.to_bed_id = '';
        base44.entities.Bed.filter({ room_id: value, bed_status: 'available', status: 'active' }).then(setFilteredBeds);
      }
      return next;
    });
  }

  async function submitRequest() {
    if (!form.resident_id || !form.move_reason) return;
    setSaving(true);
    const resident = residents.find(r => r.id === form.resident_id);
    const toProperty = properties.find(p => p.id === form.to_property_id);
    const toRoom = filteredRooms.find(r => r.id === form.to_room_id);
    const toBed = filteredBeds.find(b => b.id === form.to_bed_id);

    await base44.entities.MoveRequest.create({
      resident_id: form.resident_id,
      resident_name: resident ? `${resident.first_name} ${resident.last_name}` : '',
      from_property_id: resident?.site_id || '',
      from_property_name: resident?.site_name || '',
      from_room_id: resident?.room_id || '',
      from_room_name: resident?.room_name || '',
      from_bed_id: resident?.bed_id || '',
      from_bed_label: resident?.bed_label || '',
      to_property_id: form.to_property_id,
      to_property_name: toProperty?.property_name || '',
      to_room_id: form.to_room_id,
      to_room_name: toRoom?.room_name || '',
      to_bed_id: form.to_bed_id,
      to_bed_label: toBed?.bed_label || '',
      request_date: form.request_date,
      requested_by_email: user?.email || '',
      requested_by_name: user?.full_name || '',
      move_reason: form.move_reason,
      request_status: 'submitted',
      notes: form.notes,
    });
    setSaving(false);
    setShowForm(false);
    load();
  }

  async function updateStatus(reqId, newStatus) {
    const today = new Date().toISOString().split('T')[0];
    await base44.entities.MoveRequest.update(reqId, {
      request_status: newStatus,
      reviewed_by_email: user?.email || '',
      reviewed_by_name: user?.full_name || '',
      review_date: today,
    });
    load();
    setSelected(prev => prev ? { ...prev, request_status: newStatus } : null);
  }

  async function executeMove(reqId) {
    setExecuting(true);
    try {
      await base44.functions.invoke('executeMoveRequest', { move_request_id: reqId });
      load();
      setSelected(null);
    } catch (e) {
      alert(e.message || 'Execution failed');
    } finally {
      setExecuting(false);
    }
  }

  const displayed = statusFilter ? requests.filter(r => r.request_status === statusFilter) : requests;

  return (
    <div className="space-y-5">
      <PageHeader title="Move Requests" subtitle={`${requests.length} total · ${requests.filter(r => r.request_status === 'submitted' || r.request_status === 'under_review').length} pending`}>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Request
        </Button>
      </PageHeader>

      {/* Status filter */}
      <div className="bg-card border-2 border-border rounded-lg p-3 flex flex-wrap gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 h-8 text-xs">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Statuses</SelectItem>
            {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {statusFilter && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setStatusFilter('')}>Clear</Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : requests.length === 0 ? (
        <EmptyState icon={ArrowRightLeft} title="No move requests" description="Submit a move request to relocate a resident to a different room or bed." actionLabel="New Request" onAction={() => setShowForm(true)} />
      ) : (
        <div className="bg-card border-2 border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b-2 border-border">
                  {['Resident', 'From', 'To', 'Reason', 'Date', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map(req => (
                  <tr key={req.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelected(req)}>
                    <td className="px-4 py-3 font-medium">{req.resident_name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <div>{req.from_property_name || '—'}</div>
                      <div>{req.from_room_name} {req.from_bed_label ? `· ${req.from_bed_label}` : ''}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <div>{req.to_property_name || '—'}</div>
                      <div>{req.to_room_name} {req.to_bed_label ? `· ${req.to_bed_label}` : ''}</div>
                    </td>
                    <td className="px-4 py-3 text-xs capitalize">{req.move_reason?.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-xs">{req.request_date}</td>
                    <td className="px-4 py-3"><StatusBadge status={req.request_status} /></td>
                    <td className="px-4 py-3">
                      {(isAdmin || isManager) && req.request_status === 'submitted' && (
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={e => { e.stopPropagation(); updateStatus(req.id, 'approved'); }}>
                          Approve
                        </Button>
                      )}
                      {(isAdmin || isManager) && req.request_status === 'approved' && (
                        <Button size="sm" className="text-xs h-7" onClick={e => { e.stopPropagation(); executeMove(req.id); }} disabled={executing}>
                          {executing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Execute'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      {selected && (
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-primary" />
                Move Request — {selected.resident_name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="flex gap-1"><StatusBadge status={selected.request_status} /></div>
              {[
                ['From', `${selected.from_property_name || '—'} · ${selected.from_room_name || ''} · ${selected.from_bed_label || ''}`],
                ['To', `${selected.to_property_name || '—'} · ${selected.to_room_name || ''} · ${selected.to_bed_label || ''}`],
                ['Reason', selected.move_reason?.replace(/_/g, ' ')],
                ['Requested By', selected.requested_by_name],
                ['Date', selected.request_date],
                ['Reviewed By', selected.reviewed_by_name],
              ].filter(([, v]) => v).map(([label, val]) => (
                <div key={label} className="flex justify-between border-b border-border/50 pb-1">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium capitalize">{val}</span>
                </div>
              ))}
              {selected.notes && <p className="text-xs text-muted-foreground italic">{selected.notes}</p>}

              {(isAdmin || isManager) && (
                <div className="flex gap-2 pt-2 border-t">
                  {selected.request_status === 'submitted' && (
                    <>
                      <Button size="sm" onClick={() => updateStatus(selected.id, 'approved')} className="flex-1">Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(selected.id, 'under_review')} className="flex-1">Under Review</Button>
                      <Button size="sm" variant="destructive" onClick={() => updateStatus(selected.id, 'denied')} className="flex-1">Deny</Button>
                    </>
                  )}
                  {selected.request_status === 'under_review' && (
                    <>
                      <Button size="sm" onClick={() => updateStatus(selected.id, 'approved')} className="flex-1">Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => updateStatus(selected.id, 'denied')} className="flex-1">Deny</Button>
                    </>
                  )}
                  {selected.request_status === 'approved' && (
                    <Button size="sm" onClick={() => executeMove(selected.id)} disabled={executing} className="flex-1">
                      {executing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                      Execute Move
                    </Button>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* New Request Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Move Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Resident *</label>
              <Select value={form.resident_id} onValueChange={v => handleFormChange('resident_id', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select resident..." /></SelectTrigger>
                <SelectContent>
                  {residents.map(r => <SelectItem key={r.id} value={r.id}>{r.first_name} {r.last_name} — {r.site_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.resident_id && (() => {
              const r = residents.find(x => x.id === form.resident_id);
              return r ? (
                <div className="bg-muted/30 rounded p-2 text-xs text-muted-foreground">
                  Current: {r.site_name} · {r.room_name} · {r.bed_label || 'No bed assigned'}
                </div>
              ) : null;
            })()}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Destination Property</label>
              <Select value={form.to_property_id} onValueChange={v => handleFormChange('to_property_id', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select property..." /></SelectTrigger>
                <SelectContent>
                  {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.property_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.to_property_id && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Destination Room</label>
                <Select value={form.to_room_id} onValueChange={v => handleFormChange('to_room_id', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select room..." /></SelectTrigger>
                  <SelectContent>
                    {filteredRooms.map(r => <SelectItem key={r.id} value={r.id}>{r.room_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {form.to_room_id && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Destination Bed (optional)</label>
                <Select value={form.to_bed_id} onValueChange={v => handleFormChange('to_bed_id', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select available bed..." /></SelectTrigger>
                  <SelectContent>
                    {filteredBeds.map(b => <SelectItem key={b.id} value={b.id}>{b.bed_label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Reason *</label>
              <Select value={form.move_reason} onValueChange={v => handleFormChange('move_reason', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REASON_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Request Date</label>
              <input type="date" value={form.request_date} onChange={e => handleFormChange('request_date', e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Notes</label>
              <textarea value={form.notes} onChange={e => handleFormChange('notes', e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-20 resize-none" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              <Button onClick={submitRequest} disabled={saving || !form.resident_id} className="flex-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}