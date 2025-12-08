// PatientAppointmentsHomePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCcw, Search, Calendar, Clock, XCircle, CheckCircle } from "lucide-react";
import { useAppointmentStore } from "../../store/useAppointmentStore.js";

import ChatbotIcon from "../../components/ChatbotComponents/ChatBotIcon.jsx";
/**
 * Full page: patient appointments list + details modal + cancel-confirm modal.
 * - Click a row to open details modal (no navigation).
 * - From details modal you can Cancel (opens confirm modal), enter reason, confirm.
 * - Uses zustand store functions:
 *    getAppointments() -> populates appointments
 *    cancelAppointmentById(id, { cancelReason }) -> cancels appointment
 *
 * CHANGES:
 * - All appointments are placed inside a single scrollable container so only
 *   that container overflows (header/search/modal areas remain fixed).
 * - Nothing else changed.
 */

export default function PatientAppointmentsHomePage() {
  const navigate = useNavigate();
  const { appointments, getAppointments, isLoading, cancelAppointmentById } = useAppointmentStore();

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // modal state
  const [selectedAppt, setSelectedAppt] = useState(null); // appointment object
  const [showDetails, setShowDetails] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

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
      return true;
    });

    if (!q) return byTab;

    return byTab.filter((ap) => {
      const doctorName = ap.doctor?.fullName || ap.doctorName || ap.doctor?.name || "";
      const date = ap.appointmentDate || "";
      const slot = ap.slot || "";
      const status = ap.status || "";
      return (
        doctorName.toLowerCase().includes(q) ||
        date.toLowerCase().includes(q) ||
        slot.toLowerCase().includes(q) ||
        status.toLowerCase().includes(q)
      );
    });
  }, [appointments, query, activeTab]);

  const counts = useMemo(() => {
    const map = { all: 0, scheduled: 0, confirmed: 0, completed: 0, cancelled: 0 };
    (appointments || []).forEach((ap) => {
      map.all += 1;
      if (ap.status === "scheduled") map.scheduled += 1;
      if (ap.status === "confirmed") map.confirmed += 1;
      if (ap.status === "completed") map.completed += 1;
      if (ap.status === "cancelled") map.cancelled += 1;
    });
    return map;
  }, [appointments]);

  const openDetails = (ap) => {
    setSelectedAppt(ap);
    setShowDetails(true);
    setShowConfirm(false);
    setCancelReason("");
  };

  const closeDetails = () => {
    setSelectedAppt(null);
    setShowDetails(false);
    setShowConfirm(false);
    setCancelReason("");
  };

  const openConfirm = () => {
    setShowConfirm(true);
  };

  const closeConfirm = () => {
    setShowConfirm(false);
    setCancelReason("");
  };

  async function handleConfirmCancel() {
    if (!selectedAppt) return;
    if (!cancelReason || cancelReason.trim().length < 3) {
      alert("Please enter a short cancellation reason (3+ characters).");
      return;
    }
    setCancelling(true);
    try {
      // call store action
      await cancelAppointmentById(selectedAppt._id, { cancelReason: cancelReason.trim() });
      // refresh list
      // await getAppointments();
      closeConfirm();
      closeDetails();
    } catch (err) {
      console.error("Cancellation failed", err);
      alert("Failed to cancel appointment. Try again.");
    } finally {
      setCancelling(false);
    }
  }

  function NiceRow({ ap }) {
    const doctorName = ap.doctor?.fullName || ap.doctorName || ap.doctor?.name || "Unknown Doctor";
    const appointmentDate = ap.appointmentDate || "-";
    const slot = ap.slot || "-";
    const specialty = ap.doctorProfile?.specialty || ap.doctor?.specialty || "General";

    return (
      <div
        onClick={() => openDetails(ap)}
        className="cursor-pointer hover:shadow-md transition-shadow bg-white rounded-lg p-4 flex items-center gap-4 border"
      >
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-xl font-semibold">
          {doctorName.split(" ").map((s) => s[0]).slice(0, 2).join("")}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate">
              <div className="font-medium text-sm">{doctorName}</div>
              <div className="text-xs text-slate-500 truncate">{specialty}</div>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>Scheduled: {appointmentDate}</div>
              <div className="mt-1 flex items-center gap-1 justify-end">
                <span className="text-xs">Slot:</span>
                <Clock className="w-3 h-3" />
                <span>{slot}</span>
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span className="text-slate-500">Created: {ap.createdAt ? new Date(ap.createdAt).toLocaleDateString() : "-"}</span>
            </div>

            {ap.status === "cancelled" && (
              <div className="flex items-center gap-1 text-rose-600">
                <XCircle className="w-3 h-3" />
                <span>Cancelled {ap.cancelledAt ? `on ${new Date(ap.cancelledAt).toLocaleDateString()}` : ""}</span>
              </div>
            )}

            {ap.status === "confirmed" && (
              <div className="flex items-center gap-1 text-emerald-600">
                <CheckCircle className="w-3 h-3" />
                <span>Confirmed</span>
              </div>
            )}
          </div>

          {ap.patientNotes && <div className="mt-2 text-xs text-slate-600">Patient notes: {ap.patientNotes}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-4 pt-[70px]">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold">My Appointments</h1>
        <div className="flex gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/patient/appointments/create')}
              className="rounded-full btn cursor-pointer px-3 py-1 border border-black/20 bg-base-200 hover:bg-slate-50"
              aria-label="create"
            >
              Schedule
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => getAppointments()}
              className="cursor-pointer text-black btn btn-circle p-2 rounded-4xl bg-white hover:bg-black/10"
              aria-label="refresh"
            >
              <RefreshCcw size={20} color="black" />
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 mb-3">
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by doctor, date or slot..."
            className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none"
          />
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
        </div>
      </div>
      <div className="bg-white rounded-lg p-4 mb-4 border w-full">
        <div className="flex items-center gap-2 w-full">


          <div className="flex gap-2 items-center text-sm">
            {/* <div className="text-sm text-slate-600">Filter:</div> */}
            {[
              ["all", "All"],
              ["scheduled", "Scheduled"],
              ["confirmed", "Confirmed"],
              ["completed", "Completed"],
              ["cancelled", "Cancelled"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`cursor-pointer px-3 btn-xs py-1 rounded-md text-sm ${activeTab === key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
              >
                {label} <span className="ml-2 text-xs">({counts[key] || 0})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* START: single scrollable container for all appointments (header/search remain fixed) */}
      <div className="bg-transparent max-h-[65vh] overflow-auto pr-2">
        <div>
          {isLoading && <div className="text-center py-8">Loading...</div>}

          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-10 text-slate-500">No appointments found.</div>
          )}

          <div className="grid gap-3 pb-6">
            {filtered.map((ap) => (
              <NiceRow key={ap._id || `${ap.appointmentDate}-${ap.slot}`} ap={ap} />
            ))}
          </div>
        </div>
      </div>
      {/* END: single scrollable container */}

      {/* Details Modal */}
      <input type="checkbox" id="appt-details-modal" className="modal-toggle" checked={showDetails} readOnly />
      <div className={`modal ${showDetails ? "modal-open" : ""}`}>
        <div className="modal-box max-w-3xl">
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-bold text-lg">Appointment details</h3>
            <div className="flex items-center gap-2">
              <button className="btn btn-ghost btn-sm" onClick={closeDetails}>Close</button>
            </div>
          </div>

          {selectedAppt ? (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {/* Left column: doctor */}
              <div className="space-y-2">
                <div className="text-xs text-muted">Doctor</div>
                <div className="font-medium">{selectedAppt.doctor?.fullName || selectedAppt.doctorName || "Unknown Doctor"}</div>
                <div className="text-xs text-slate-500">
                  <strong>Doctor ID:</strong> {selectedAppt.doctorProfile?.doctorId || "—"}
                </div>
                <div className="text-xs text-slate-500">
                  <strong>Specialty:</strong> {selectedAppt.doctorProfile?.specialty || selectedAppt.doctor?.specialty || "General"}
                </div>
                <div className="text-xs text-slate-500">
                  <strong>Experience:</strong> {selectedAppt.doctorProfile?.yearsOfExperience ? `${selectedAppt.doctorProfile.yearsOfExperience} yrs` : "—"}
                </div>
                {selectedAppt.doctorProfile?.languages && selectedAppt.doctorProfile.languages.length > 0 && (
                  <div className="text-xs text-slate-500">
                    <strong>Languages:</strong> {selectedAppt.doctorProfile.languages.join(", ")}
                  </div>
                )}
                {selectedAppt.doctorProfile?.licenseNumber && (
                  <div className="text-xs text-slate-500">
                    <strong>License #:</strong> {selectedAppt.doctorProfile.licenseNumber}
                  </div>
                )}
              </div>

              {/* Right column: appointment */}
              <div className="space-y-2">
                <div className="text-xs text-muted">Appointment:</div>
                <div className="flex flex-col items-start justify-start gap-1">
                  <div className="font-medium">Date: {selectedAppt.appointmentDate}</div>
                  <div className="text-xs badge badge-info">Scheduled Slot: {selectedAppt.slot}</div>
                </div>

                <div className="text-xs text-slate-500">
                  <strong>Status:</strong> <span className="capitalize">{selectedAppt.status || "scheduled"}</span>
                </div>

                <div className="text-xs text-slate-500">
                  <strong>Booked:</strong> {selectedAppt.createdAt ? new Date(selectedAppt.createdAt).toLocaleString() : "-"}
                </div>

                {(selectedAppt.status === "cancelled" || selectedAppt.cancelledAt) && (
                  <>
                    <div className="text-xs text-rose-600">
                      <strong>Cancelled at:</strong> {selectedAppt.cancelledAt ? new Date(selectedAppt.cancelledAt).toLocaleString() : "-"}
                    </div>
                    {selectedAppt.cancelReason && (
                      <div className="text-xs text-rose-600">
                        <strong>Cancel reason:</strong> {selectedAppt.cancelReason}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Patient notes */}
              <div className="md:col-span-2">
                <div className="text-xs text-muted">Patient notes</div>
                <div className="p-3 rounded border bg-base-100 text-sm">
                  {selectedAppt.patientNotes ? selectedAppt.patientNotes : <span className="text-slate-400">No notes provided.</span>}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4">No appointment selected.</div>
          )}

          <div className="modal-action mt-6">
            <button className="btn" onClick={closeDetails}>Close</button>

            {selectedAppt && selectedAppt.status !== "cancelled" && (
              <button
                className="btn btn-error"
                onClick={openConfirm}
              >
                Cancel Appointment
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Cancel Modal */}
      <input type="checkbox" id="confirm-cancel-modal" className="modal-toggle" checked={showConfirm} readOnly />
      <div className={`modal ${showConfirm ? "modal-open" : ""}`}>
        <div className="modal-box max-w-md">
          <h3 className="font-bold text-lg">Confirm cancellation</h3>
          <p className="py-2 text-sm">Please provide a brief reason for cancelling this appointment.</p>

          <textarea
            className="textarea textarea-bordered w-full"
            rows={3}
            placeholder="Cancellation reason (required)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            disabled={cancelling}
          />

          <div className="modal-action mt-4">
            <button className="btn" onClick={closeConfirm} disabled={cancelling}>Back</button>
            <button className={`btn btn-error ${cancelling ? "loading" : ""}`} onClick={handleConfirmCancel} disabled={cancelling}>
              {cancelling ? "Cancelling..." : "Confirm Cancel"}
            </button>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <ChatbotIcon />
      </div>
    </div>
  );
}
