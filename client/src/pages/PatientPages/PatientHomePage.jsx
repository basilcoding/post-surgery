import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  RefreshCcw,
  MessageCircle,
  Video,
  Calendar,
  PlusCircle,
  Clock,
  Users,
  Search,
  ClipboardList,
  CheckCircle,
  XCircle,
  Circle,
} from "lucide-react";

import ChatbotIcon from "../../components/ChatbotComponents/ChatbotIcon.jsx";

import { useAuthStore } from "../../store/useAuthStore";
import { useAppointmentStore } from "../../store/useAppointmentStore";
import { useChatStore } from "../../store/useChatStore";
import { useProfileStore } from "../../store/useProfileStore";
import { useRelationshipsStore } from "../../store/useRelationshipsStore";

// small helper: format time ago
const timeAgo = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  return `${day}d`;
};

export default function PatientHomePage() {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const { appointments, getAppointments, isLoading } = useAppointmentStore();
  const { currentRoomId, selectedUser, subscribeToChatRoom } = useChatStore();
  const { userProfile, getSelfProfile } = useProfileStore();
  const { getRelationships, userRelationships } = useRelationshipsStore();

  const [query, setQuery] = useState("");

  useEffect(() => {
    getAppointments?.();
    getSelfProfile?.();
    getRelationships?.('patient');
    // attempt to subscribe to active room (defensive)
    if (currentRoomId) subscribeToChatRoom?.(currentRoomId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // derived counts
  const counts = useMemo(() => {
    const map = { all: 0, scheduled: 0, completed: 0, cancelled: 0 };
    (appointments || []).forEach((a) => {
      map.all += 1;
      if (a.status === "scheduled") map.scheduled += 1;
      if (a.status === "completed") map.completed += 1;
      if (a.status === "cancelled") map.cancelled += 1;
    });
    return map;
  }, [appointments]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!appointments) return [];
    const base = appointments.slice().sort((a, b) => {
      const aKey = `${a.appointmentDate || ""} ${a.slot || ""}`;
      const bKey = `${b.appointmentDate || ""} ${b.slot || ""}`;
      if (aKey < bKey) return -1;
      if (aKey > bKey) return 1;
      return 0;
    });
    if (!q) return base;
    return base.filter((ap) => {
      const doctorName = ap.doctor?.fullName || ap.doctorName || "";
      return (
        doctorName.toLowerCase().includes(q) ||
        (ap.appointmentDate || "").toLowerCase().includes(q) ||
        (ap.slot || "").toLowerCase().includes(q) ||
        (ap.status || "").toLowerCase().includes(q)
      );
    });
  }, [appointments, query]);

  return (
    <div className="p-6 pt-[80PX] w-full h-full mx-auto space-y-6">
      {/* Header row: small room indicator inside header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="avatar">
              <div className="w-14 h-14 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden">
                <img src={authUser?.profilePic || userProfile?.image?.url} alt='YOU' />
              </div>
            </div>
            {/* small room indicator: top-right of avatar */}
            <div className="absolute -top-1 -right-1">
              {currentRoomId ? (
                <div title={`Room open • ${currentRoomId}`} className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-md" />
                </div>
              ) : (
                <div title="No active room">
                  <span className="w-3 h-3 rounded-full bg-slate-300" />
                </div>
              )}
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-semibold">Welcome{authUser?.firstName ? `, ${authUser.firstName}` : ""}</h1>
            <div className="text-sm text-slate-500">{userProfile?.clinicAddress?.city || "Your health at a glance"}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">


          <button
            onClick={() => getAppointments?.()}
            className="btn btn-ghost btn-sm flex items-center gap-2"
            title="Refresh appointments"
          >
            <RefreshCcw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="Upcoming" value={counts.scheduled} hint="Scheduled visits" icon={<Calendar />} />
        <StatCard title="Active Doctors" value={userRelationships.length} hint="" icon={<Users />} />
      </div>

      {/* Main area */}
      <div className="grid md:grid-cols-3 gap-6 items-start">
        {/* Appointments list (primary) */}
        <div className="md:col-span-2 space-y-4 min-h-0 flex flex-col">
          <div className="card bg-base-100 p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Upcoming appointments</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/patient/appointments')}>View all</button>
            </div>

            <div className="space-y-3 max-h-[58vh] overflow-auto pr-2">
              {isLoading && <div className="text-center py-8">Loading...</div>}

              {!isLoading && filtered.length === 0 && (
                <div className="text-center py-10 text-slate-500">No appointments found.</div>
              )}

              {filtered.map((ap) => (
                <>
                  {(ap.status === 'scheduled') &&
                    <div key={ap._id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                      <div>
                        <div className="font-medium">{ap.doctor?.fullName || ap.doctorName || 'Doctor'}</div>
                        <div className="text-xs text-slate-500">{ap.appointmentDate} • {ap.slot}</div>
                        {/* {ap.patientNotes && <div className="text-xs text-slate-400 mt-2">Notes: {ap.patientNotes}</div>} */}
                      </div>

                      <div className="text-right flex flex-col items-end gap-2">
                        <div className={`text-sm ${ap.status === 'cancelled' ? 'text-rose-600' : ap.status === 'completed' ? 'text-emerald-600' : 'text-slate-600'}`}>
                          {ap.status || 'scheduled'}
                        </div>

                        <div className="flex gap-2">
                          <button className="btn btn-xs btn-ghost" onClick={() => navigate(`/patient/appointments`)}>Details</button>
                          {ap.status !== 'cancelled' && (
                            <button className="btn btn-xs btn-error" onClick={() => navigate('/patient/appointments')}>Cancel</button>
                          )}
                        </div>
                      </div>
                    </div>
                  }
                </>
              ))}
            </div>

          </div>

          {/* Quick action tiles */}
          <div className="grid grid-cols-2 gap-3">
            <ActionTile label="Schedule" hint="Book a visit" icon={<PlusCircle />} onClick={() => navigate('/patient/appointments/create')} />
            <ActionTile label="All Journals" hint="Journals" icon={<Circle />} onClick={() => navigate('/patient/view-journals')} />
            <ActionTile label="Room status" hint="Active room" icon={<Users />} onClick={() => navigate('/patient/room-status')} />
          </div>
        </div>

        {/* Right column: profile + quick summary */}
        <aside className="space-y-4 min-h-0 flex flex-col">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div>
                <div className="font-semibold">{userProfile?.fullName || authUser?.fullName || 'You'}</div>
                <div className="text-xs opacity-70">{userProfile?.phone || authUser?.email || ''}</div>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button className="btn btn-sm" onClick={() => navigate('/patient/update-profile')}>Edit profile</button>
              <button className="btn btn-sm btn-ghost" onClick={() => navigate('/patient/appointments')}>My appointments</button>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm opacity-70">Next appointment</div>
                <div className="font-medium mt-1">{(appointments || []).find(a => a.status === 'scheduled') ? ((appointments || []).find(a => a.status === 'scheduled').appointmentDate + ' • ' + (appointments || []).find(a => a.status === 'scheduled').slot) : 'None'}</div>
              </div>
              <Clock />
            </div>

            <div className="mt-4 text-xs opacity-70">Quick actions</div>
            <div className="mt-2 flex flex-col gap-2">
              <button className="btn btn-block btn-outline btn-sm" onClick={() => navigate('/patient/appointments/create')}>Quick schedule</button>
              <button className="btn btn-block btn-ghost btn-sm" onClick={() => navigate('/patient/chat')}>Open chat</button>
            </div>
          </div>
        </aside>
      </div>
      <div className="mt-4">
        <ChatbotIcon />
      </div>
    </div>
  );
}

function StatCard({ title, value, hint, icon }) {
  return (
    <div className="card p-4 shadow-sm flex items-start gap-4">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-slate-100">{React.cloneElement(icon, { size: 20 })}</div>
      <div>
        <div className="text-sm opacity-70">{title}</div>
        <div className="text-2xl font-semibold">{value}</div>
        <div className="text-xs opacity-60 mt-1">{hint}</div>
      </div>
    </div>
  );
}

function ActionTile({ label, hint, icon, onClick }) {
  return (
    <button onClick={onClick} className="flex items-start gap-3 p-3 rounded-lg border hover:shadow transition-shadow bg-white text-left">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100">{React.cloneElement(icon, { size: 18 })}</div>
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-xs opacity-60">{hint}</div>
      </div>
    </button>
  );
}
