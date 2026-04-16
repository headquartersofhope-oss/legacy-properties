import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import useCurrentUser from '@/lib/useCurrentUser';
import useTurnkeyOperator from '@/lib/useTurnkeyOperator';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import TurnkeyBedAssignment from '@/components/TurnkeyBedAssignment';
import { Button } from '@/components/ui/button';
import { BedDouble, DoorOpen, Users, ArrowRightLeft, Plus, ChevronDown, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';

export default function TurnkeyDashboard() {
  const { user, isTurnkeyOperator } = useCurrentUser();
  const { client, authorizedPropertyIds, loading: clientLoading } = useTurnkeyOperator(user);

  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [residents, setResidents] = useState([]);
  const [moveRequests, setMoveRequests] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRooms, setExpandedRooms] = useState({});
  const [assigningResident, setAssigningResident] = useState(null);
  const [executing, setExecuting] = useState(null);

  const load = async () => {
    if (!authorizedPropertyIds.length) { setLoading(false); return; }
    const [allRooms, allBeds, allResidents, allMoveReqs, allProps] = await Promise.all([
      base44.entities.Room.list(),
      base44.entities.Bed.list(),
      base44.entities.HousingResident.list(),
      base44.entities.MoveRequest.list('-created_date'),
      base44.entities.Property.list(),
    ]);
    // Scope everything to authorized properties
    setRooms((allRooms || []).filter(r => authorizedPropertyIds.includes(r.site_id)));
    setBeds((allBeds || []).filter(b => authorizedPropertyIds.includes(b.site_id)));
    setResidents((allResidents || []).filter(r => authorizedPropertyIds.includes(r.site_id) && r.resident_status === 'active'));
    setMoveRequests((allMoveReqs || []).filter(m => authorizedPropertyIds.includes(m.from_property_id)));
    setProperties((allProps || []).filter(p => authorizedPropertyIds.includes(p.id)));
    setLoading(false);
  };

  useEffect(() => {
    if (authorizedPropertyIds.length > 0) load();
    else if (!clientLoading) setLoading(false);
  }, [authorizedPropertyIds.join(','), clientLoading]);

  if (!isTurnkeyOperator) {
    return <div className="p-8 text-center text-muted-foreground">Access restricted to turnkey operators.</div>;
  }

  if (clientLoading || loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (!client) {
    return (
      <div className="p-8 text-center space-y-2">
        <p className="font-semibold text-foreground">No operator account linked.</p>
        <p className="text-sm text-muted-foreground">Contact your housing administrator to link your account to a turnkey client record.</p>
      </div>
    );
  }

  const available = beds.filter(b => b.bed_status === 'available').length;
  const occupied = beds.filter(b => b.bed_status === 'occupied').length;
  const pending = moveRequests.filter(m => ['submitted', 'under_review', 'approved'].includes(m.request_status));

  const kpis = [
    { label: 'Total Beds', value: beds.length, icon: BedDouble, color: 'text-primary' },
    { label: 'Occupied', value: occupied, icon: Users, color: 'text-blue-600' },
    { label: 'Available', value: available, icon: BedDouble, color: 'text-green-600' },
    { label: 'Rooms', value: rooms.length, icon: DoorOpen, color: 'text-purple-600' },
    { label: 'Pending Moves', value: pending.length, icon: ArrowRightLeft, color: 'text-amber-600' },
  ];

  // Unassigned active residents (no bed_id) in this operator's houses
  const unassigned = residents.filter(r => !r.bed_id);

  async function executeMove(reqId) {
    setExecuting(reqId);
    try {
      await base44.functions.invoke('executeMoveRequest', { move_request_id: reqId });
      await load();
    } catch (e) {
      alert(e.message || 'Execution failed');
    } finally {
      setExecuting(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.client_name}
        subtitle={`Turnkey Operator Dashboard · ${properties.map(p => p.property_name).join(', ')}`}
      >
        <Button onClick={() => setAssigningResident(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Assign Bed
        </Button>
      </PageHeader>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-card border-2 border-border rounded-lg p-4 text-center">
              <Icon className={`w-5 h-5 mx-auto mb-1 ${k.color}`} />
              <div className="text-2xl font-bold text-foreground">{k.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{k.label}</div>
            </div>
          );
        })}
      </div>

      {/* Unassigned residents alert */}
      {unassigned.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-amber-800">{unassigned.length} resident{unassigned.length > 1 ? 's' : ''} without a bed assignment</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {unassigned.map(r => (
              <button key={r.id} onClick={() => setAssigningResident(r)}
                className="text-xs bg-white border border-amber-300 text-amber-700 rounded px-2 py-1 hover:bg-amber-100 transition-colors">
                {r.first_name} {r.last_name} — Assign →
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Room occupancy grid */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Room Occupancy</h2>
        <div className="space-y-2">
          {rooms.length === 0 ? (
            <div className="text-sm text-muted-foreground bg-card border-2 border-border rounded-lg p-6 text-center">No rooms configured for your house.</div>
          ) : rooms.map(room => {
            const roomBeds = beds.filter(b => b.room_id === room.id);
            const roomResidents = residents.filter(r => r.room_id === room.id);
            const isOpen = expandedRooms[room.id];
            const occupiedCount = roomBeds.filter(b => b.bed_status === 'occupied').length;
            return (
              <div key={room.id} className="bg-card border-2 border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedRooms(p => ({ ...p, [room.id]: !p[room.id] }))}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    <span className="font-semibold text-foreground">{room.room_name}</span>
                    <span className="text-xs text-muted-foreground">{occupiedCount}/{roomBeds.length} occupied</span>
                  </div>
                  <StatusBadge status={room.status} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-2 border-t border-border">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {roomBeds.map(bed => {
                        const resident = roomResidents.find(r => r.bed_id === bed.id);
                        return (
                          <div key={bed.id} className={`rounded-lg border p-3 text-sm ${bed.bed_status === 'occupied' ? 'bg-blue-50 border-blue-200' : bed.bed_status === 'available' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{bed.bed_label}</span>
                              <StatusBadge status={bed.bed_status} />
                            </div>
                            {resident ? (
                              <p className="text-xs mt-1 text-muted-foreground">{resident.first_name} {resident.last_name}</p>
                            ) : bed.bed_status === 'available' ? (
                              <p className="text-xs mt-1 text-green-600">Available</p>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending move requests */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">Pending Move Requests</h2>
          <div className="bg-card border-2 border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b-2 border-border">
                  {['Resident', 'From', 'To', 'Reason', 'Status', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pending.map(req => (
                  <tr key={req.id} className="border-b border-border/50">
                    <td className="px-4 py-3 font-medium">{req.resident_name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{req.from_room_name} {req.from_bed_label ? `· ${req.from_bed_label}` : ''}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{req.to_room_name} {req.to_bed_label ? `· ${req.to_bed_label}` : ''}</td>
                    <td className="px-4 py-3 text-xs capitalize">{req.move_reason?.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3"><StatusBadge status={req.request_status} /></td>
                    <td className="px-4 py-3">
                      {(req.request_status === 'submitted' || req.request_status === 'approved') && (
                        <Button size="sm" className="text-xs h-7" onClick={() => executeMove(req.id)} disabled={executing === req.id}>
                          {executing === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                          Execute
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

      {assigningResident && (
        <TurnkeyBedAssignment
          resident={assigningResident === true ? null : assigningResident}
          authorizedPropertyIds={authorizedPropertyIds}
          onClose={() => setAssigningResident(null)}
          onSuccess={() => { setAssigningResident(null); load(); }}
        />
      )}
    </div>
  );
}