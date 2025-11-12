import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, Users, FileText, CheckCircle, Clock, Image as ImageIcon,
  ArrowRightCircle, Activity
} from "lucide-react";

// stores (make sure paths are correct in your project)
import { useAuthStore } from "../../store/useAuthStore";
import { useSummaryStore } from "../../store/useSummaryStore";
import { useRelationshipsStore } from "../../store/useRelationshipsStore";
import { useProfileStore } from "../../store/useProfileStore";

// small helper: format time
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

export default function DoctorHomePage() {
  const navigate = useNavigate();
  const { authUser, socket, connectSocket, disconnectSocket } = useAuthStore();
  const {
    newSummaries,
    underReviewSummaries,
    resolvedSummaries,
    fetchSummaries,
    changeStatus,
    getSummaryById,
  } = useSummaryStore();

  const { userRelationships, getRelationships } = useRelationshipsStore();
  const { userProfile, getSelfProfile } = useProfileStore();

  const [activeTab, setActiveTab] = useState("New");
  const [queryType, setQueryType] = useState("journal"); // journal | emergency
  const [search, setSearch] = useState("");

  useEffect(() => {
    // initial data
    getSelfProfile();
    getRelationships("doctor");
    fetchSummaries(queryType);
    // auto-connect socket for realtime
    if (!socket && authUser) connectSocket();

    return () => {
      // no-op: stores manage their own disconnect
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  useEffect(() => {
    // refetch when queryType changes (journal vs emergency)
    fetchSummaries(queryType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryType]);

  const counts = useMemo(() => ({
    new: newSummaries?.length || 0,
    underReview: underReviewSummaries?.length || 0,
    resolved: resolvedSummaries?.length || 0,
  }), [newSummaries, underReviewSummaries, resolvedSummaries]);

  const allVisibleSummaries = useMemo(() => {
    const pool = activeTab === "New" ? newSummaries : (activeTab === "UnderReview" ? underReviewSummaries : resolvedSummaries);
    if (!pool) return [];
    if (!search.trim()) return pool;
    return pool.filter(s => (s.content || []).join(" ").toLowerCase().includes(search.toLowerCase()) || (s._id||"").toString().includes(search));
  }, [activeTab, newSummaries, underReviewSummaries, resolvedSummaries, search]);

  // Enforce: show no more than 2 new summaries on dashboard
  const visibleSummariesToShow = useMemo(() => {
    if (activeTab === "New") {
      return allVisibleSummaries.slice(0, 2);
    }
    return allVisibleSummaries;
  }, [activeTab, allVisibleSummaries]);

  // pending images: count all images individually in new summaries (sum of lengths)
  const pendingImagesTotal = useMemo(() => {
    if (!newSummaries) return 0;
    return newSummaries.reduce((acc, s) => acc + ((s.surgerySiteImages || []).length || 0), 0);
  }, [newSummaries]);

  // avg response time (based on relationships' createdAt -> assignedAt)
  const avgResponseHours = useMemo(() => {
    if (!userRelationships) return 1;
    const now = Date.now();

    const completed = userRelationships
      .map(r => {
        const created = r.createdAt ? new Date(r.createdAt).getTime() : null;
        const assigned = r.assignedAt ? new Date(r.assignedAt).getTime() : null;
        if (created && assigned && assigned >= created) {
          return assigned - created;
        }
        return null;
      })
      .filter(ms => typeof ms === "number" && ms > 0);

    if (completed.length > 0) {
      const avgMs = completed.reduce((a, b) => a + b, 0) / completed.length;
      const hrs = Math.max(1, Math.round(avgMs / (1000 * 60 * 60)));
      return hrs;
    }

    const waiting = userRelationships
      .map(r => (r.createdAt ? Math.max(0, now - new Date(r.createdAt).getTime()) : null))
      .filter(ms => typeof ms === "number" && ms > 0);

    if (waiting.length > 0) {
      const avgMs = waiting.reduce((a, b) => a + b, 0) / waiting.length;
      const hrs = Math.max(1, Math.round(avgMs / (1000 * 60 * 60)));
      return hrs;
    }

    return 1;
  }, [userRelationships]);

  const handleOpenSummary = async (id) => {
    await getSummaryById(id);
    navigate(`/doctor/view-journals/${id}`);
  };

  const handleMark = async (summaryId, targetStatus) => {
    await changeStatus(summaryId, targetStatus);
  };

  return (
    <div className="h-full w-full p-6 space-y-6 pt-[80px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="avatar">
            <div className="w-14 h-14 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <img src={authUser?.profilePic || userProfile?.image?.url || "https://i.pravatar.cc/150?img=55"} alt="doc" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Good day, Dr. {authUser?.fullName || userProfile?.fullName || "—"}</h2>
            <p className="text-sm opacity-70">{userProfile?.specialty ? userProfile.specialty.charAt(0).toUpperCase() + userProfile.specialty.slice(1) : "Surgeon"} • {userProfile?.clinicAddress?.city || "—"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-sm" onClick={() => fetchSummaries(queryType)} title="Refresh summaries">
            <Activity size={18} /> Refresh
          </button>
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle">
              <Bell />
            </label>
            <div tabIndex={0} className="dropdown-content card card-compact w-64 p-2 shadow bg-base-100">
              <div className="font-bold">Notifications</div>
              <div className="text-xs opacity-70">Realtime summary and emergency alerts appear here.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-70">Active relationships</div>
              <div className="text-2xl font-semibold">{userRelationships?.length || 0}</div>
            </div>
            <Users size={36} />
          </div>
          <div className="mt-3 text-xs opacity-70">Showing active patients assigned to you</div>
        </div>

        <div className="card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-70">New Summaries</div>
              <div className="text-2xl font-semibold">{counts.new}</div>
            </div>
            <FileText size={36} />
          </div>
          <div className="mt-3 text-xs opacity-70">Awaiting your review</div>
        </div>

        <div className="card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-70">Under Review</div>
              <div className="text-2xl font-semibold">{counts.underReview}</div>
            </div>
            <Clock size={36} />
          </div>
          <div className="mt-3 text-xs opacity-70">You have in-progress cases</div>
        </div>

        <div className="card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-70">Resolved</div>
              <div className="text-2xl font-semibold">{counts.resolved}</div>
            </div>
            <CheckCircle size={36} />
          </div>
          <div className="mt-3 text-xs opacity-70">Completed reviews</div>
        </div>
      </div>

      {/* Main grid: Summaries list + Relationships */}
      {/* items-start prevents vertical overlap by aligning columns to the top */}
      <div className="grid md:grid-cols-3 gap-6 items-start">
        {/* Summaries column (spans 2 on md) */}
        <div className="md:col-span-2 space-y-4 min-h-0 flex flex-col">
          <div className="card bg-base-100 p-4 w-full overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium">{activeTab} Summaries — {queryType.charAt(0).toUpperCase() + queryType.slice(1)}</h3>
              <div className="text-sm opacity-60">{allVisibleSummaries.length} shown</div>
            </div>

            {!visibleSummariesToShow.length ? (
              <div className="p-8 text-center opacity-70">No summaries in this bucket.</div>
            ) : (
              // make the list scrollable so it won't push into the right column on smaller viewports
              <div className="space-y-2 max-h-[58vh] md:max-h-[60vh] overflow-auto pr-2">
                {visibleSummariesToShow.map((s) => (
                  <div key={s._id} className="card card-compact card-bordered p-3 flex items-center justify-between">
                    <div className="flex items-start gap-3 w-full">
                      <div className="w-12 h-12 rounded-md bg-base-200 flex items-center justify-center">
                        <ImageIcon />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4">
                          <div className="font-semibold truncate">{(s.content || []).slice(0,1).join(' ').slice(0,80) || 'Patient summary'}</div>
                          <div className="text-xs opacity-60">{timeAgo(s.createdAt)}</div>
                        </div>
                        <div className="text-xs opacity-60 mt-1">Type: {s.type} • Revision: {s.revision || 0}</div>
                        <div className="mt-2 flex gap-2">
                          {activeTab !== 'UnderReview' && (
                            <button className="btn btn-sm btn-outline" onClick={() => handleMark(s._id, 'UnderReview')}>Take</button>
                          )}
                          {activeTab !== 'Resolved' && (
                            <button className="btn btn-sm btn-success" onClick={() => handleMark(s._id, 'Resolved')}>Resolve</button>
                          )}
                          <button className="btn btn-sm" onClick={() => handleOpenSummary(s._id)}>Open <ArrowRightCircle size={14} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {activeTab === "New" && allVisibleSummaries.length > 2 && (
                  <div className="text-xs opacity-60 p-2">Showing 2 of {allVisibleSummaries.length} new summaries — open the summaries page to see more.</div>
                )}
              </div>
            )}
          </div>

          {/* Quick actions / Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-4">
              <div className="text-sm opacity-70">Avg. Response Time</div>
              <div className="text-2xl font-semibold">{avgResponseHours}h</div>
              <div className="text-xs opacity-60 mt-2">Calculated from assigned relationships</div>
            </div>
            <div className="card p-4">
              <div className="text-sm opacity-70">Pending Images</div>
              <div className="text-2xl font-semibold">{pendingImagesTotal}</div>
              <div className="text-xs opacity-60 mt-2">Total images across new summaries</div>
            </div>
            <div className="card p-4">
              <div className="text-sm opacity-70">Quick Actions</div>
              <div className="mt-2 flex flex-col gap-2">
                <button className="btn btn-xs btn-outline" onClick={() => navigate('/doctor/patients')}>Appointments</button>
                <button className="btn btn-xs" onClick={() => navigate('/doctor/create-care-check-list')}>Create New Care Check List</button>
              </div>
            </div>
          </div>
        </div>

        {/* Relationships column */}
        <div className="space-y-4 min-h-0 flex flex-col">
          <div className="card p-4 w-full overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Assigned Patients</h4>
              <div className="text-xs opacity-60">Active • {userRelationships?.length || 0}</div>
            </div>

            {!userRelationships?.length ? (
              <div className="p-6 text-center opacity-70">No active patients assigned.</div>
            ) : (
              // make relationships list scrollable to avoid vertical overflow pushing into other columns
              <div className="space-y-2 max-h-[58vh] md:max-h-[60vh] overflow-auto pr-2">
                {userRelationships.map((r) => (
                  <div key={r._id} className="p-3 border rounded-md flex flex-col">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold truncate">{r.patientProfile?.fullName || r.patient?.fullName || 'Patient'}</div>
                        <div className="text-xs opacity-60">Surgery: {r.surgeryName || '—'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/doctor/relationships/${r._id}`)}>View</button>
                        <div className="dropdown dropdown-end">
                          <label tabIndex={0} className="btn btn-ghost btn-sm">More</label>
                          <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-44">
                            <li><a onClick={() => navigate(`/doctor/patient/${r.patient}/notes`)}>Notes</a></li>
                            <li><a onClick={() => navigate(`/doctor/patient/${r.patient}/history`)}>History</a></li>
                            <li><a onClick={() => navigate(`/chat/${r.patient}`)}>Message</a></li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs opacity-60">Assigned {timeAgo(r.assignedAt || r.createdAt)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-4 w-full">
            <div className="flex items-center gap-2">
              <div className="avatar">
                <div className="w-12 h-12 rounded-full"><img src={authUser?.profilePic || userProfile?.image?.url || 'https://i.pravatar.cc/80'} alt="me" /></div>
              </div>
              <div>
                <div className="font-semibold">Profile</div>
                <div className="text-xs opacity-60">Experience: {userProfile?.yearsOfExperience || 0} yrs</div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="btn btn-sm" onClick={() => navigate('/doctor/update-profile')}>Edit Profile</button>
              {/* <button className="btn btn-ghost btn-sm" onClick={() => navigate('/doctor/settings')}>Settings</button> */}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
