import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, Users, FileText, CheckCircle, Clock, Image as ImageIcon,
  ArrowRightCircle, Activity, ChevronRight
} from "lucide-react";

// stores
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
  const { authUser, socket, connectSocket } = useAuthStore();
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
  const [search] = useState(""); // removed setSearch for brevity if unused in UI

  useEffect(() => {
    getSelfProfile();
    getRelationships("doctor");
    fetchSummaries(queryType);
    if (!socket && authUser) connectSocket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  useEffect(() => {
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
    return pool.filter(s => (s.content || []).join(" ").toLowerCase().includes(search.toLowerCase()) || (s._id || "").toString().includes(search));
  }, [activeTab, newSummaries, underReviewSummaries, resolvedSummaries, search]);

  // Enforce: Only show latest 2 new summaries
  const visibleSummariesToShow = useMemo(() => {
    if (activeTab === "New") {
      // Create a copy and sort by date descending (latest first) just to be safe, then slice 2
      const sorted = [...allVisibleSummaries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return sorted.slice(0, 2);
    }
    return allVisibleSummaries;
  }, [activeTab, allVisibleSummaries]);

  const pendingImagesTotal = useMemo(() => {
    if (!newSummaries) return 0;
    return newSummaries.reduce((acc, s) => acc + ((s.surgerySiteImages || []).length || 0), 0);
  }, [newSummaries]);

  const avgResponseHours = useMemo(() => {
    if (!userRelationships) return 1;
    const now = Date.now();
    const completed = userRelationships
      .map(r => {
        const created = r.createdAt ? new Date(r.createdAt).getTime() : null;
        const assigned = r.assignedAt ? new Date(r.assignedAt).getTime() : null;
        if (created && assigned && assigned >= created) return assigned - created;
        return null;
      })
      .filter(ms => typeof ms === "number" && ms > 0);

    if (completed.length > 0) {
      const avgMs = completed.reduce((a, b) => a + b, 0) / completed.length;
      return Math.max(1, Math.round(avgMs / (1000 * 60 * 60)));
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
    <div className="h-full w-full p-7 md:p-6 space-y-4 md:space-y-6 pb-20 md:pb-6 mt-[45px] md:mt-[55px]">

      {/* --- Header --- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="avatar">
            <div className="w-full h-12 md:w-14 md:h-14 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <img src={authUser?.profilePic || userProfile?.image?.url || "https://i.pravatar.cc/150?img=55"} alt="doc" />
            </div>
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl md:text-2xl font-semibold">
              <span className="hidden md:inline">Good day, </span>Dr. {authUser?.fullName?.split(' ')[0] || userProfile?.fullName?.split(' ')[0] || "Doc"}
            </h2>
            <p className="text-xs md:text-sm opacity-70">
              {userProfile?.specialty || "Surgeon"}
              <span className="hidden md:inline"> • {userProfile?.clinicAddress?.city || "—"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn btn-ghost btn-sm btn-circle" onClick={() => fetchSummaries(queryType)} title="Refresh">
            <Activity size={18} />
          </button>
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle btn-sm">
              <Bell size={20} />
            </label>
            <div tabIndex={0} className="dropdown-content card card-compact w-full p-2 shadow-lg bg-base-100 border border-base-200 z-50">
              <div className="font-bold px-2 py-1">Notifications</div>
              <div className="text-xs opacity-70 px-2 pb-2">Realtime alerts appear here.</div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Stats Cards (Grid 2x2 on Mobile, 4x1 on Desktop) --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Active", val: userRelationships?.length || 0, icon: Users, sub: "Patients" },
          { label: "New", val: counts.new, icon: FileText, sub: "Summaries" },
          { label: "Pending", val: counts.underReview, icon: Clock, sub: "Review" },
          { label: "Done", val: counts.resolved, icon: CheckCircle, sub: "Resolved" }
        ].map((item, idx) => (
          <div key={idx} className="card bg-base-100 p-3 md:p-4 shadow-sm border border-base-200">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs md:text-sm opacity-70">{item.label}</div>
                <div className="text-xl md:text-2xl font-bold mt-1">{item.val}</div>
              </div>
              <item.icon className="opacity-20 md:opacity-40" size={28} />
            </div>
            <div className="mt-1 text-[10px] md:text-xs opacity-60 truncate">{item.sub}</div>
          </div>
        ))}
      </div>

      {/* --- Main Content Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* LEFT COL: Summaries */}
        <div className="lg:col-span-2 space-y-4 min-h-0 flex flex-col">

          {/* Mobile-Friendly Tabs */}
          <div className="tabs tabs-boxed bg-base-100 p-1 overflow-x-auto flex-nowrap w-full">
            {['New', 'UnderReview', 'Resolved'].map(tab => (
              <a
                key={tab}
                className={`tab flex-1 whitespace-nowrap ${activeTab === tab ? 'tab-active font-semibold' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'UnderReview' ? 'Reviewing' : tab}
                <span className="ml-2 badge badge-sm badge-ghost">{tab === 'New' ? counts.new : (tab === 'UnderReview' ? counts.underReview : counts.resolved)}</span>
              </a>
            ))}
          </div>

          <div className="card bg-base-100 p-4 w-full shadow-sm border border-base-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md md:text-lg font-medium capitalize flex items-center gap-2">
                {queryType} Summaries
              </h3>
              <div className="text-xs opacity-60">{allVisibleSummaries.length} total</div>
            </div>

            {!visibleSummariesToShow.length ? (
              <div className="py-8 text-center opacity-70 flex flex-col items-center justify-center">
                <FileText className="opacity-20 mb-2" size={40} />
                <span className="text-sm">No summaries in {activeTab}.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleSummariesToShow.slice(0, 2).map((s) => (
                  <div key={s._id} className="card card-compact border border-base-200 p-3 hover:bg-base-50 transition-colors">
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div className="w-10 h-10 min-w-[2.5rem] rounded-lg bg-base-200 flex items-center justify-center text-primary">
                        <ImageIcon size={18} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-medium text-sm line-clamp-2 leading-tight">
                            {(s.content || []).join(' ') || 'Patient summary update'}
                          </div>
                          <div className="text-[10px] opacity-50 whitespace-nowrap mt-0.5">{timeAgo(s.createdAt)}</div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-2 items-center">
                          <span className="badge badge-xs badge-outline opacity-70">{s.type}</span>
                          <span className="text-[10px] opacity-60">Rev: {s.revision || 0}</span>
                        </div>

                        {/* Actions Toolbar */}
                        <div className="mt-3 flex gap-2 justify-end md:justify-start border-t border-base-100 pt-2">
                          {activeTab !== 'UnderReview' && (
                            <button className="btn btn-xs btn-outline" onClick={() => handleMark(s._id, 'UnderReview')}>Take</button>
                          )}
                          {activeTab !== 'Resolved' && (
                            <button className="btn btn-xs btn-success text-white" onClick={() => handleMark(s._id, 'Resolved')}>Resolve</button>
                          )}
                          <button className="btn btn-xs btn-ghost gap-1" onClick={() => handleOpenSummary(s._id)}>
                            Open <ArrowRightCircle size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {activeTab === "New" && allVisibleSummaries.length > 2 && (
                  <div
                    className="btn btn-block btn-xs btn-ghost text-xs opacity-60 h-auto py-2"
                    onClick={() => navigate('/doctor/summaries')}
                  >
                    View {allVisibleSummaries.length - 2} more new summaries
                  </div>
                )}
              </div>
            )}
            <div className="card bg-base-100 p-3 border border-base-200 col-span-2 md:col-span-1">
                  <button className="btn btn-sm btn-outline w-full" onClick={() => navigate('/doctor/view-journals')}>
                    All Journals
                  </button>
                </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="card bg-base-100 p-3 border border-base-200">
              <div className="text-xs opacity-70">Avg Response</div>
              <div className="text-xl font-bold">{avgResponseHours}h</div>
            </div>
            <div className="card bg-base-100 p-3 border border-base-200">
              <div className="text-xs opacity-70">Pending Images</div>
              <div className="text-xl font-bold">{pendingImagesTotal}</div>
            </div>
            <div className="card bg-base-100 p-3 border border-base-200 col-span-2 md:col-span-1">
              <button className="btn btn-sm btn-outline w-full" onClick={() => navigate('/doctor/create-care-check-list')}>
                + Checklist
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COL: Relationships */}
        <div className="space-y-4 min-h-0 flex flex-col">
          <div className="card bg-base-100 p-4 w-full border border-base-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-md">My Patients</h4>
              <span className="badge badge-sm badge-ghost">{userRelationships?.length || 0} active</span>
            </div>

            {!userRelationships?.length ? (
              <div className="p-4 text-center text-xs opacity-60">No patients assigned.</div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
                {userRelationships.slice(0, 2).map((r) => (
                  <div key={r._id} className="p-3 bg-base-50 rounded-lg flex items-center justify-between group">
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="font-semibold text-sm truncate">{r.patientProfile?.fullName || r.patient?.fullName || 'Patient'}</div>
                      <div className="text-xs opacity-60 truncate">{r.surgeryName || 'General Surgery'}</div>
                    </div>
                    <button
                      className="btn btn-square btn-sm btn-ghost text-opacity-50"
                      onClick={() => navigate(`/doctor/relationships/${r._id}`)}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>

                ))}
                <div className="card bg-base-100 p-3 border border-base-200 col-span-2 md:col-span-1">
                  <button className="btn btn-sm btn-outline w-full" onClick={() => navigate('/doctor/related-patients')}>
                    All Patients
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="card bg-primary text-primary-content p-4 shadow-lg bg-gradient-to-br from-primary to-primary-focus">
            <div className="flex items-center gap-3">
              <div className="avatar placeholder">
                <div className="bg-primary-content text-primary rounded-full w-full">
                  <span className="text-lg font-bold">{userProfile?.yearsOfExperience || "1"}</span>
                </div>
              </div>
              <div>
                <div className="text-xs font-bold opacity-80">YEARS EXPERIENCE</div>
                <div className="text-sm font-medium">Keep up the great work!</div>
              </div>
            </div>
            <button className="btn btn-sm btn-white text-primary mt-3 w-full border-0 bg-white hover:bg-gray-100" onClick={() => navigate('/doctor/update-profile')}>
              Edit Profile
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}