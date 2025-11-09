import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

import { useRelationshipsStore } from '../../store/useRelationshipsStore';
import { useAuthStore } from '../../store/useAuthStore';

// DoctorRelationshipsPage (updated for active-only relationships)
// - Assumes getRelationships returns relationships for the current doctor
// - Only displays active relationships (backend already returns active patients)
// - Uses DaisyUI dropdowns for filters
// - Each relationship takes full width and cards stack vertically

export default function DoctorRelationshipsPage() {
    const navigate = useNavigate();
    const { authUser } = useAuthStore();
    const { getRelationships, userRelationships, isFetchingRelationships } = useRelationshipsStore();

    const [search, setSearch] = useState('');
    const [careFilter, setCareFilter] = useState('all'); // cardiology | general | psychiatry | all
    const [sortBy, setSortBy] = useState('recent'); // recent | oldest | name

    useEffect(() => {
        if (!authUser) return;
        // For doctors, getRelationships will return active relationships for this doctor
        getRelationships('doctor');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authUser]);

    // derived counts for header (only active relationships considered)
    const counts = useMemo(() => {
        const activeList = (userRelationships || []).filter((r) => r.status);
        const total = activeList.length;
        const byCare = activeList.reduce((acc, r) => {
            const key = r.careType || 'general';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
        return { total, byCare };
    }, [userRelationships]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        // Start from backend-provided list but ensure we only show active ones
        let list = (userRelationships || []).filter((r) => r.status);

        if (careFilter !== 'all') list = list.filter((r) => (r.careType || 'general') === careFilter);

        if (q) {
            list = list.filter((r) => {
                const patientName = r.patientProfile?.name || r.patient?.name || '';
                return (
                    patientName.toLowerCase().includes(q) ||
                    (r.surgeryName || '').toLowerCase().includes(q) ||
                    (r.surgeryIdentifier || '').toLowerCase().includes(q)
                );
            });
        }

        if (sortBy === 'recent') {
            list.sort((a, b) => new Date(b.assignedAt || 0) - new Date(a.assignedAt || 0));
        } else if (sortBy === 'oldest') {
            list.sort((a, b) => new Date(a.assignedAt || 0) - new Date(b.assignedAt || 0));
        } else if (sortBy === 'name') {
            list.sort((a, b) => {
                const pa = (a.patientProfile?.name || a.patient?.name || '').toLowerCase();
                const pb = (b.patientProfile?.name || b.patient?.name || '').toLowerCase();
                return pa.localeCompare(pb);
            });
        }

        return list;
    }, [userRelationships, search, careFilter, sortBy]);

    return (
        <div className="p-6 pt-[80px] h-full w-full mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-semibold">Your Active Patients</h1>
                    <p className="text-sm text-gray-500 mt-1">Showing active relationships assigned to you.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-4 bg-white rounded-lg shadow px-4 py-2">
                        <div className="text-sm">
                            <div className="text-xs text-gray-500">Active patients</div>
                            <div className="font-medium">{counts.total}</div>
                        </div>

                    </div>

                    {/* DaisyUI dropdowns for sort */}
                    <div className="flex items-center gap-2">
                        <div className="dropdown dropdown-end">
                            <label tabIndex={0} className="btn btn-ghost">Sort: {sortBy}</label>
                            <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                                <li onClick={() => setSortBy('recent')}><a>Recently assigned</a></li>
                                <li onClick={() => setSortBy('oldest')}><a>Oldest assigned</a></li>
                                <li onClick={() => setSortBy('name')}><a>Patient name</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-6 w-full flex justify-end">
                <input
                    placeholder="Search patients, surgery id, or names..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-[40%] px-4 py-2 rounded-4xl border focus:outline-none"
                />
            </div>

            <div className="space-y-4">
                {isFetchingRelationships ? (
                    <div className="text-center py-12 text-gray-500">Loading active patients...</div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">No active patients found.</div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {filtered.map((r) => (
                            <div key={r._id} className="w-full p-4 pt-2 rounded-lg border shadow-sm bg-white hover:shadow-md transition">
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="badge badge-info text-xs mt-1 text-gray-500">Patient: {r.patientProfile.patientId || ''}</div>
                                        <div className="font-semibold text-lg mt-4">Name: {r.patient?.fullName || 'Unknown'}</div>
                                        {/* <div className="text-sm text-gray-500 mt-1">{r.patientProfile?.email || r.patient?.email || ''}</div> */}

                                        {r.surgeryName && (
                                            <div className="mt-3 text-sm">
                                                <div className="text-xs ">Surgery: </div>
                                                <div className="font-medium">{r.surgeryName}</div>
                                                {/* <br /> */}
                                                <div className="text-xs ">Identifier: {r.surgeryIdentifier ? `${r.surgeryIdentifier}` : ' — '}</div>

                                            </div>
                                        )}

                                        {r.notes && (
                                            <div className="mt-3 text-sm text-gray-700">Notes: {r.notes}</div>
                                        )}
                                    </div>

                                    <div className="flex-shrink-0 text-right md:text-left">
                                        <div className={`inline-block px-2 py-1 mt-1 rounded text-xs font-medium ${r.status ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                            {r.status ? 'Active' : 'Inactive'}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-2">{r.careType || 'General'}</div>
                                        {r.assignedAt && (
                                            <div className="text-xs text-gray-400 mt-2">Assigned: {format(new Date(r.assignedAt), 'PP p')}</div>
                                        )}

                                        <div className="mt-4 flex flex-wrap gap-2 justify-end">
                                            <button onClick={() => navigate(`/doctor/relationships/${r._id || ''}`)} className="cursor-pointer text-sm px-3 py-1 rounded-md border">View patient Details</button>
                                            {/* <button onClick={() => navigate(`/relationships/${r._id}`)} className="text-sm px-3 py-1 rounded-md border">Details</button> */}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
