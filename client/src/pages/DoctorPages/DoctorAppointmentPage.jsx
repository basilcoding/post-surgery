// DoctorAppointmentPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  RefreshCcw,
  Search,
  Calendar,
  Clock,
  XCircle,
  CheckCircle,
  User,
  X,
  Check,
  AlertTriangle,
} from "lucide-react";
import { useAppointmentStore } from "../../store/useAppointmentStore.js";

/**
 * Doctor's appointments page (updated layout + backdrop-closable modal)
 *
 * Layout:
 *  - Left sidebar: filters, counts, quick actions
 *  - Right: appointments list
 *
 * Modal:
 *  - Backdrop clickable to close
 *  - Shows patientProfile fields per schema
 *
 * Actions:
 *  - Mark No-Show, Cancel (with reason), Mark Completed
 */

export default function DoctorAppointmentPage() {
  const navigate = useNavigate();
  const { appointments, getAppointments, isLoading, updateAppointmentById } = useAppointmentStore();

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // modal + action state
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // cancel reason modal (inline)
  const [showCancelReason, setShowCancelReason] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    getAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!appointments || !Array.isArray(appointments)) return [];
    const q = query.trim().toLowerCase();

    const base = appointments
      .slice()
      .sort((a, b) => {
        const aKey = `${a.appointmentDate} ${a.slot}`;
        const bKey = `${b.appointmentDate} ${b.slot}`;
        if (aKey < bKey) return -1;
        if (aKey > bKey) return 1;
        return 0;
      });

    const byTab = base.filter((ap) => {
      if (activeTab === "all") return true;
      if (activeTab === "scheduled") return ap.status === "scheduled";
      if (activeTab === "confirmed") return ap.status === "confirmed";
      if (activeTab === "completed") return ap.status === "completed";
      if (activeTab === "cancelled") return ap.status === "cancelled";
      if (activeTab === "no_show") return ap.status === "no_show";
      return true;
    });

    if (!q) return byTab;

    return byTab.filter((ap) => {
      const patientName = ap.patient?.fullName || ap.patientName || "";
      const date = ap.appointmentDate || "";
      const slot = ap.slot || "";
      const status = ap.status || "";
      return (
        patientName.toLowerCase().includes(q) ||
        date.toLowerCase().includes(q) ||
        slot.toLowerCase().includes(q) ||
        status.toLowerCase().includes(q)
      );
    });
  }, [appointments, query, activeTab]);

  const counts = useMemo(() => {
    const map = { all: 0, scheduled: 0, confirmed: 0, completed: 0, cancelled: 0, no_show: 0 };
    (appointments || []).forEach((ap) => {
      map.all += 1;
      if (ap.status === "scheduled") map.scheduled += 1;
      if (ap.status === "confirmed") map.confirmed += 1;
      if (ap.status === "completed") map.completed += 1;
      if (ap.status === "cancelled") map.cancelled += 1;
      if (ap.status === "no_show") map.no_show += 1;
    });
    return map;
  }, [appointments]);

  const openDetails = (ap) => {
    setSelectedAppt(ap);
    setShowDetails(true);
    setShowCancelReason(false);
    setCancelReason("");
  };

  const closeDetails = () => {
    setSelectedAppt(null);
    setShowDetails(false);
    setShowCancelReason(false);
    setCancelReason("");
  };

  // actions
  async function handleMarkCompleted() {
    if (!selectedAppt) return;
    setActionLoading(true);
    try {
      await updateAppointmentById(selectedAppt._id, { status: "completed" });
      closeDetails();
    } catch (err) {
      console.error("Failed to mark completed", err);
      alert("Failed to mark as completed. Try again.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMarkNoShow() {
    if (!selectedAppt) return;
    const confirmNoShow = window.confirm("Mark this appointment as NO-SHOW? This cannot be undone lightly.");
    if (!confirmNoShow) return;
    setActionLoading(true);
    try {
      await updateAppointmentById(selectedAppt._id, { status: "no_show" });
      closeDetails();
    } catch (err) {
      console.error("Failed to mark no-show", err);
      alert("Failed to mark as no-show. Try again.");
    } finally {
      setActionLoading(false);
    }
  }

  function handleOpenCancel() {
    setShowCancelReason(true);
    setCancelReason("");
  }

  async function handleConfirmCancel() {
    if (!selectedAppt) return;
    if (!cancelReason || cancelReason.trim().length < 3) {
      alert("Please enter a cancellation reason (3+ characters).");
      return;
    }
    setActionLoading(true);
    try {
      await updateAppointmentById(selectedAppt._id, {
        status: "cancelled",
        cancelReason: cancelReason.trim(),
      });
      closeDetails();
    } catch (err) {
      console.error("Failed to cancel appointment", err);
      alert("Failed to cancel appointment. Try again.");
    } finally {
      setActionLoading(false);
      setShowCancelReason(false);
      setCancelReason("");
    }
  }

  // compact row for doctor layout
  function RowItem({ ap }) {
    const patientName = ap.patient?.fullName || ap.patientName || "Unknown Patient";
    const appointmentDate = ap.appointmentDate || "-";
    const slot = ap.slot || "-";
    const avatar = ap.patient?.image?.url;
    return (
      <div className="flex items-center gap-4 bg-white rounded-lg p-3 border hover:shadow-md transition-shadow">
        <div className="flex-shrink-0">
          {avatar ? (
            <img src={avatar} alt={patientName} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-sm">
              {patientName.split(" ").map(s => s[0]).slice(0,2).join("")}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate">
              <div className="font-medium">{patientName}</div>
              <div className="text-xs text-slate-500 truncate">{ap.patientProfile?.patientId || "Patient ID —"}</div>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>{appointmentDate}</div>
              <div className="mt-1 flex items-center gap-1 justify-end">
                <Clock className="w-3 h-3" />
                <span>{slot}</span>
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span className="text-slate-500">Booked: {ap.createdAt ? new Date(ap.createdAt).toLocaleDateString() : "-"}</span>
            </div>

            {ap.status === "cancelled" && (
              <div className="flex items-center gap-1 text-rose-600">
                <XCircle className="w-3 h-3" />
                <span>Cancelled</span>
              </div>
            )}
            {ap.status === "confirmed" && (
              <div className="flex items-center gap-1 text-emerald-600">
                <CheckCircle className="w-3 h-3" />
                <span>Confirmed</span>
              </div>
            )}
            {ap.status === "no_show" && (
              <div className="flex items-center gap-1 text-yellow-600">
                <AlertTriangle className="w-3 h-3" />
                <span>No-show</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-xs text-slate-500">{ap.patientProfile?.currentRoomId ? `Room: ${ap.patientProfile.currentRoomId}` : ""}</div>
          <div>
            <button className="btn btn-sm btn-outline" onClick={() => openDetails(ap)}>View</button>
          </div>
        </div>
      </div>
    );
  }

  // helper to format verifiedBy/verifiedAt (if populated)
  function renderVerified(meta) {
    if (!meta) return null;
    const { verifiedBy, verifiedAt } = meta;
    return (
      <div className="text-xs text-slate-500">
        {verifiedBy ? <span>Verified by: {verifiedBy.fullName || verifiedBy}</span> : null}
        {verifiedAt ? <span className="ml-2">on {new Date(verifiedAt).toLocaleDateString()}</span> : null}
      </div>
    );
  }

  // renders arrays from patientProfile per schema
  function renderListWithMeta(title, arr = [], itemMapper) {
    if (!arr || arr.length === 0) return null;
    return (
      <div className="mb-3">
        <div className="text-xs font-semibold mb-1">{title}</div>
        <div className="space-y-2">
          {arr.map((it, idx) => (
            <div key={idx} className="p-2 border rounded bg-base-100 text-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm">{itemMapper(it)}</div>
                <div className="text-xs text-slate-400">{it.status || "Patient-Reported"}</div>
              </div>
              {it.notes && <div className="text-xs text-slate-500 mt-1">Notes: {it.notes}</div>}
              {renderVerified(it)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-4 pt-[80px]">
      <div className="grid grid-cols-12 gap-4">
        {/* Left sidebar */}
        <aside className="col-span-12 md:col-span-3">
          <div className="bg-white rounded-lg p-4 border sticky top-24">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Doctor Dashboard</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => getAppointments()} aria-label="refresh">
                <RefreshCcw size={18} />
              </button>
            </div>

            <div className="mb-4">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search patient, date, slot..."
                className="input input-bordered w-full"
              />
            </div>

            <div className="mb-4">
              <div className="text-sm text-slate-600 mb-2">Filters</div>
              <div className="flex flex-wrap gap-2">
                {[
                  ["all", "All"],
                  ["scheduled", "Scheduled"],
                  ["confirmed", "Confirmed"],
                  ["completed", "Completed"],
                  ["cancelled", "Cancelled"],
                  ["no_show", "No-show"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`px-3 py-1 rounded-md text-sm ${activeTab === key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
                  >
                    {label} <span className="ml-2 text-xs">({counts[key] || 0})</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <div className="text-sm text-slate-600 mb-2">Quick Actions</div>
              <div className="flex flex-col gap-2">
                <button onClick={() => navigate('/doctor/appointments/create')} className="btn btn-sm">Create appointment</button>
                <button onClick={() => getAppointments()} className="btn btn-sm btn-outline">Refresh list</button>
              </div>
            </div>

            <div>
              <div className="text-sm text-slate-600 mb-2">Summary</div>
              <ul className="text-sm space-y-1">
                <li>All: <strong>{counts.all}</strong></li>
                <li>Scheduled: <strong>{counts.scheduled}</strong></li>
                <li>Confirmed: <strong>{counts.confirmed}</strong></li>
                <li>Completed: <strong>{counts.completed}</strong></li>
                <li>Cancelled: <strong>{counts.cancelled}</strong></li>
                <li>No-show: <strong>{counts.no_show}</strong></li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Right content */}
        <main className="col-span-12 md:col-span-9">
          <div className="space-y-3">
            {isLoading && <div className="text-center py-8">Loading...</div>}

            {!isLoading && filtered.length === 0 && (
              <div className="text-center py-10 text-slate-500">No appointments found.</div>
            )}

            <div className="space-y-3">
              {filtered.map((ap) => (
                <RowItem key={ap._id || `${ap.appointmentDate}-${ap.slot}`} ap={ap} />
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Modal overlay (backdrop clickable to close) */}
      {showDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          aria-modal="true"
          role="dialog"
          onClick={closeDetails} // clicking backdrop closes
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white rounded-lg w-full max-w-4xl mx-4 lg:mx-0 p-6 shadow-lg z-10 overflow-auto max-h-[85vh]"
            onClick={(e) => e.stopPropagation()} // prevent backdrop close when clicking inside
          >
            <div className="flex items-start justify-between">
              <h3 className="font-bold text-lg">Appointment details</h3>
              <div className="flex items-center gap-2">
                <button className="btn btn-ghost btn-sm" onClick={closeDetails}>Close</button>
              </div>
            </div>

            {selectedAppt ? (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {/* Patient Overview (col 1) */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {selectedAppt.patient?.image?.url ? (
                      <img src={selectedAppt.patient.image.url} alt={selectedAppt.patient?.fullName} className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center font-semibold">
                        { (selectedAppt.patient?.fullName || "P").split(" ").map(s => s[0]).slice(0,2).join("") }
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{selectedAppt.patient?.fullName || selectedAppt.patientName || "Unknown Patient"}</div>
                      <div className="text-xs text-slate-500">{selectedAppt.patientProfile?.patientId || "Patient ID —"}</div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600">
                    <div><strong>Booked:</strong> {selectedAppt.createdAt ? new Date(selectedAppt.createdAt).toLocaleString() : "-"}</div>
                    <div className="mt-1"><strong>Appointment:</strong> {selectedAppt.appointmentDate} • <span className="ml-1">{selectedAppt.slot}</span></div>
                    <div className="mt-1"><strong>Status:</strong> <span className="capitalize">{selectedAppt.status || "scheduled"}</span></div>
                  </div>

                  {/* Patient quick vitals/room */}
                  <div className="text-sm">
                    {selectedAppt.patientProfile?.currentRoomId && (
                      <div className="text-xs">Room: <strong>{selectedAppt.patientProfile.currentRoomId}</strong></div>
                    )}
                  </div>
                </div>

                {/* Middle column: patientProfile detailed lists */}
                <div className="md:col-span-2">
                  {/* Patient notes */}
                  <div className="mb-4">
                    <div className="text-xs text-muted mb-1">Patient notes</div>
                    <div className="p-3 rounded border bg-base-100 text-sm">
                      {selectedAppt.patientNotes ? selectedAppt.patientNotes : <span className="text-slate-400">No notes provided.</span>}
                    </div>
                  </div>

                  {/* Chronic conditions */}
                  {renderListWithMeta("Chronic conditions", selectedAppt.patientProfile?.chronicConditions, (it) => (
                    <div>
                      <div className="font-medium">{it.conditionName}</div>
                      {it.diagnosisDate && <div className="text-xs text-slate-500">Diagnosed: {new Date(it.diagnosisDate).toLocaleDateString()}</div>}
                    </div>
                  ))}

                  {/* Past surgeries */}
                  {renderListWithMeta("Past surgeries", selectedAppt.patientProfile?.pastSurgeries, (it) => (
                    <div>
                      <div className="font-medium">{it.procedureName}</div>
                      {it.procedureDate && <div className="text-xs text-slate-500">On: {new Date(it.procedureDate).toLocaleDateString()}</div>}
                    </div>
                  ))}

                  {/* Allergies */}
                  {renderListWithMeta("Allergies", selectedAppt.patientProfile?.allergies, (it) => (
                    <div>
                      <div className="font-medium">{it.allergen}</div>
                      {it.reaction && <div className="text-xs text-slate-500">Reaction: {it.reaction}</div>}
                      <div className="text-xs text-slate-500">Severity: {it.severity || "Mild"}</div>
                    </div>
                  ))}

                  {/* Current medications */}
                  {renderListWithMeta("Current medications", selectedAppt.patientProfile?.currentMedications, (it) => (
                    <div>
                      <div className="font-medium">{it.medicationName} {it.dosage ? <span className="text-xs text-slate-500">• {it.dosage}</span> : null}</div>
                      {it.frequency && <div className="text-xs text-slate-500">Frequency: {it.frequency}</div>}
                      {it.reason && <div className="text-xs text-slate-500">Reason: {it.reason}</div>}
                    </div>
                  ))}

                  {/* Family history */}
                  {renderListWithMeta("Family history", selectedAppt.patientProfile?.familyHistory, (it) => (
                    <div>
                      <div className="font-medium">{it.relation}: {it.condition}</div>
                    </div>
                  ))}

                </div>

                {/* Actions row spans full width below on small screens */}
                <div className="md:col-span-3 mt-3 flex items-center justify-end gap-2">
                  {selectedAppt && selectedAppt.status !== "no_show" && selectedAppt.status !== "cancelled" && (
                    <button
                      className={`btn btn-warning ${actionLoading ? "loading" : ""}`}
                      onClick={handleMarkNoShow}
                      disabled={actionLoading}
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" /> Mark No-Show
                    </button>
                  )}

                  {selectedAppt && selectedAppt.status !== "completed" && selectedAppt.status !== "cancelled" && (
                    <button
                      className={`btn btn-success ${actionLoading ? "loading" : ""}`}
                      onClick={handleMarkCompleted}
                      disabled={actionLoading}
                    >
                      <Check className="w-4 h-4 mr-2" /> Mark Completed
                    </button>
                  )}

                  {selectedAppt && selectedAppt.status !== "cancelled" && (
                    <div>
                      {!showCancelReason ? (
                        <button
                          className={`btn btn-error ${actionLoading ? "loading" : ""}`}
                          onClick={handleOpenCancel}
                          disabled={actionLoading}
                        >
                          <X className="w-4 h-4 mr-2" /> Cancel
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Cancel reason (required)"
                            className="input input-bordered input-sm"
                            disabled={actionLoading}
                          />
                          <button className={`btn btn-error btn-sm ${actionLoading ? "loading" : ""}`} onClick={handleConfirmCancel} disabled={actionLoading}>
                            {actionLoading ? "Cancelling..." : "Confirm"}
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setShowCancelReason(false); setCancelReason(""); }} disabled={actionLoading}>
                            Back
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4">No appointment selected.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
