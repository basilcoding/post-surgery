import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Calendar,
    Clock,
    UserPlus,
    ArrowRight,
    X,
    User,
    HeartPulse,
    ClipboardList,
} from "lucide-react";
import { useAppointmentStore } from "../../store/useAppointmentStore";
import { useRelationshipsStore } from "../../store/useRelationshipsStore";
import { useAuthStore } from "../../store/useAuthStore";

/**
 * Helper component for the doctor selection modal
 */
function DoctorSelectModal({
    userRelationships,
    isFetchingRelationships,
    onSelectDoctor,
    selectedDoctorId,
}) {
    const handleSelect = (doctor, doctorProfileId) => {
        // Find the modal element and close it
        const modal = document.getElementById("doctor_modal");
        if (modal) modal.close();

        // Pass the selection up to the parent component
        onSelectDoctor(doctor, doctorProfileId);
    };

    return (
        <dialog id="doctor_modal" className="modal modal-bottom sm:modal-middle">
            <div className="modal-box p-0">
                <div className="p-5 border-b flex justify-between items-center bg-base-200">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <UserPlus className="w-5 h-5" /> Select Your Doctor
                    </h3>
                    <form method="dialog">
                        <button className="btn btn-sm btn-circle btn-ghost">
                            <X className="w-5 h-5" />
                        </button>
                    </form>
                </div>

                <div className="p-5 max-h-[70vh] overflow-y-auto">
                    {isFetchingRelationships && (
                        <div className="flex justify-center items-center h-20">
                            <span className="loading loading-spinner loading-md"></span>
                            <span className="ml-2">Loading assigned doctors...</span>
                        </div>
                    )}

                    {!userRelationships ||
                        (userRelationships.length === 0 && !isFetchingRelationships && (
                            <div className="alert alert-info shadow-lg">
                                <User className="w-5 h-5" />
                                <span>
                                    You currently have no assigned doctors in your relationships.
                                </span>
                            </div>
                        ))}

                    <div className="space-y-3">
                        {(userRelationships || []).map((r) => {
                            const doc = r.doctor || {};
                            const name =
                                doc.fullName || ''
                            const doctId = (doc._id
                                ? `Doctor (ID: ${String(doc._id).slice(-4)})`
                                : "Doctor ID unavailable");
                            const id = doc._id || r.doctor;
                            const profileId = r.doctorProfile?._id || r.doctorProfile;
                            const isSelected = String(id) === String(selectedDoctorId);

                            return (
                                <div
                                    key={id}
                                    className={`card cursor-pointer p-4 shadow-sm border ${isSelected
                                        ? "border-primary bg-primary/10"
                                        : "border-base-300 hover:bg-base-200"
                                        }`}
                                    onClick={() => handleSelect(id, profileId)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex justify-between w-full">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-lg">Dr. {name}</span>
                                                {(r.doctorProfile?.specialty || r?.careType) && (
                                                    <span className="text-sm text-slate-600 flex items-center gap-1">
                                                        <HeartPulse className="w-3 h-3" />
                                                        {r.doctorProfile?.specialty || r?.careType}
                                                    </span>
                                                )}
                                            </div>
                                            <span>{r?.doctorProfile?.doctorId}</span>
                                        </div>
                                        {isSelected && <ArrowRight className="w-5 h-5 text-primary" />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="modal-action px-5 py-3 border-t">
                    <form method="dialog">
                        <button className="btn btn-ghost">Close</button>
                    </form>
                </div>
            </div>
        </dialog>
    );
}

/**
 * Main page component for creating an appointment
 */
export default function CreateAppointmentPage() {
    const navigate = useNavigate();
    const { userRelationships, getRelationships, isFetchingRelationships } =
        useRelationshipsStore();
    const {
        selectedDoctorAvailableSlots,
        getDoctorAvailability,
        createAppointment,
    } = useAppointmentStore();
    const { authUser } = useAuthStore();

    const [selectedDoctor, setSelectedDoctor] = useState("");
    const [selectedDoctorProfileId, setSelectedDoctorProfileId] = useState("");
    const [date, setDate] = useState("");
    const [selectedSlot, setSelectedSlot] = useState("");
    const [patientNotes, setPatientNotes] = useState("");
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Get the display name for the selected doctor for the button text
    const selectedDoctorDisplayName = useMemo(() => {
        const rel = (userRelationships || []).find(
            (r) => String(r.doctor?._id || r.doctor) === String(selectedDoctor)
        );
        const doc = rel?.doctor || {};
        const name = doc.fullName || doc.name;
        if (name) return name;
        if (selectedDoctor) return `Doctor (ID: ${String(selectedDoctor).slice(-4)})`;
        return "Select a Doctor";
    }, [selectedDoctor, userRelationships]);

    useEffect(() => {
        getRelationships("patient");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        // This effect will re-run whenever selectedDoctor or date changes.
        // It only calls getDoctorAvailability when BOTH selectedDoctor and date have values,
        // but it will react to changes of either one (so changing one triggers a fresh fetch).
        if (!selectedDoctor || !date) return;

        let cancelled = false;
        const fetch = async () => {
            setLoadingSlots(true);
            try {
                await getDoctorAvailability(selectedDoctor, date);
            } catch (err) {
                if (!cancelled) {
                    console.error("Error fetching availability", err);
                }
            } finally {
                if (!cancelled) {
                    setLoadingSlots(false);
                    setSelectedSlot(""); // Reset slot when doctor or date changes
                }
            }
        };

        fetch();

        return () => {
            cancelled = true;
        };
    }, [selectedDoctor, date, getDoctorAvailability]);

    const slots = useMemo(
        () =>
            Array.isArray(selectedDoctorAvailableSlots)
                ? selectedDoctorAvailableSlots
                : [],
        [selectedDoctorAvailableSlots]
    );

    // Updated handler to accept doctor ID and profile ID directly from the modal
    // const handleSelectDoctor = (doctorId, doctorProfileId) => {
    //     setSelectedDoctor(doctorId);
    //     setSelectedDoctorProfileId(doctorProfileId || "");
    //     setSelectedSlot("");
    // };
    // Updated handler to accept doctor ID and profile ID directly from the modal
    const handleSelectDoctor = (doctorId, doctorProfileId) => {
        // update local state
        setSelectedDoctor(doctorId);
        setSelectedDoctorProfileId(doctorProfileId || "");
        setSelectedSlot("");

        // Immediately fetch availability for the newly selected doctor if a date is already chosen.
        // We pass the doctorId (not the possibly stale state) and the current date.
        // This avoids any timing/race issues where the effect might not trigger in time.
        if (doctorId && date) {
            // fire-and-forget but keep loading UI consistent with existing logic
            setLoadingSlots(true);
            getDoctorAvailability(doctorId, date)
                .catch(err => {
                    console.error("Error fetching availability on select:", err);
                })
                .finally(() => {
                    // reset loading and clear selected slot (same semantic as your effect)
                    setLoadingSlots(false);
                    setSelectedSlot("");
                });
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedDoctor) return alert("Please select a doctor");
        if (!date) return alert("Please choose a date");
        if (!selectedSlot) return alert("Please pick a slot");

        // build payload according to schema
        const payload = {
            doctor: selectedDoctor,
            DoctorProfile: selectedDoctorProfileId || undefined,
            appointmentDate: date, // YYYY-MM-DD
            slot: selectedSlot, // HH:mm
            // patient & patientProfile usually filled by backend using auth, but include if available
            patient: authUser?._id || undefined,
            patientProfile: authUser?.patientProfile || undefined,
            patientNotes: patientNotes || undefined,
        };

        try {
            setSubmitting(true);
            await createAppointment(payload);
            // navigate back to appointments list
            navigate("/patient/appointments");
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-4 pt-[70px] h-full w-full">
            <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                    <h2 className="card-title items-center gap-2">
                        <UserPlus className="w-5 h-5" /> Create Appointment
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* --- Doctor Selection (Modal) --- */}
                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text">Choose Doctor</span>
                            </label>
                            <button
                                type="button"
                                className={`btn btn-outline w-full justify-start font-normal ${!selectedDoctor ? "text-slate-400" : ""
                                    }`}
                                onClick={() => document.getElementById("doctor_modal").showModal()}
                            >
                                <User className="w-4 h-4" />
                                {selectedDoctorDisplayName}
                            </button>
                        </div>

                        {/* --- Date and Slot Selection --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Appointment Date</span>
                                </label>
                                <input
                                    type="date"
                                    className="input input-bordered"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    min={new Date().toISOString().slice(0, 10)}
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Selected Slot</span>
                                </label>
                                <div className="input input-bordered flex items-center gap-2 min-h-[3rem]">
                                    <Clock className="w-4 h-4" />
                                    <div className="flex-1">
                                        {selectedSlot || (
                                            <span className="text-slate-400">No slot selected</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- Available Slots Grid --- */}
                        <div>
                            <label className="label">
                                <span className="label-text">Available Slots</span>
                            </label>

                            <div className="card bg-base-200 p-4 min-h-[6rem]">
                                {!selectedDoctor && (
                                    <div className="text-sm text-slate-500 m-auto">
                                        Select a doctor to load available slots.
                                    </div>
                                )}
                                {selectedDoctor && !date && (
                                    <div className="text-sm text-slate-500 m-auto">
                                        Pick a date to view slots.
                                    </div>
                                )}

                                {loadingSlots && (
                                    <div className="text-sm m-auto">Loading slots...</div>
                                )}

                                {!loadingSlots && selectedDoctor && date && (
                                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                        {slots && slots.length > 0 ? (
                                            slots.map((s) => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => setSelectedSlot(String(s))}
                                                    className={`btn border-black/30 w-[70%] btn-sm badge text-xs ${selectedSlot === String(s)
                                                        ? "badge-primary"
                                                        : "bg-base-100"
                                                        }`}
                                                >
                                                    {s}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="col-span-full text-sm text-slate-500 m-auto">
                                                No available slots for this date.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* --- Patient Notes (Tidied Up) --- */}
                        <div className="form-control flex flex-col gap-2">
                            <label className="label">
                                <span className="label-text text-base font-medium flex items-center gap-2">
                                    <ClipboardList className="w-5 h-5" />
                                    Notes for Doctor (Optional)
                                </span>
                            </label>
                            <textarea
                                className="textarea textarea-bordered h-24 w-full"
                                placeholder="Describe reason for visit or symptoms..."
                                value={patientNotes}
                                onChange={(e) => setPatientNotes(e.target.value)}
                            />
                            <label className="label">
                                <span className="label-text-alt">
                                    This will be shared with the doctor before your visit.
                                </span>
                            </label>
                        </div>

                        {/* --- Submission Area --- */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t">
                            <div className="text-sm text-slate-600">
                                You will be charged according to the doctor's settings at booking
                                time.
                            </div>

                            <div className="flex gap-2 w-full md:w-auto">
                                <button
                                    type="button"
                                    className="btn btn-ghost flex-1 md:flex-none"
                                    onClick={() => navigate(-1)}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className={`btn btn-primary flex-1 md:flex-none ${submitting ? "loading" : ""
                                        }`}
                                    disabled={submitting || !selectedDoctor || !date || !selectedSlot}
                                >
                                    Book Appointment <ArrowRight className="w-4 h-4 ml-2" />
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* --- Modal Component Instance --- */}
            <DoctorSelectModal
                userRelationships={userRelationships}
                isFetchingRelationships={isFetchingRelationships}
                onSelectDoctor={handleSelectDoctor}
                selectedDoctorId={selectedDoctor}
            />
        </div>
    );
}
