import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuthStore } from "../../store/useAuthStore";
import { useSummaryStore } from "../../store/useSummaryStore";

export default function SummariesContainer({ summaries, activeView, onChangeStatus }) {
    const navigate = useNavigate();

    const { authUser } = useAuthStore();

    return (
        <>
            <div className="card bg-base-200 shadow-md col-span-1 lg:col-span-2 overflow-y-auto">
                <div className="card-body">
                    <h2 className="card-title">
                        {activeView === 'newSummaries' && <p>New Summaries</p>}
                        {activeView === 'underReviewSummaries' && <p>Summaries Under Review</p>}
                        {activeView === 'resolvedSummaries' && <p>Resolved Summaries</p>}

                    </h2>
                    <div className="space-y-3 mt-2 max-h-[60vh]">
                        {summaries.length === 0 ? (
                            <div className="text-gray-500">
                                {activeView === 'newSummaries' && <p>No New Summaries are Present.</p>}
                                {activeView === 'underReviewSummaries' && <p>No Summaries Under Review.</p>}
                                {activeView === 'resolvedSummaries' && <p>No Resolved Summaries.</p>}
                            </div>
                        ) : (
                            summaries.map((summary) => {
                                const deliveredToDoc =
                                    // summary.deliveredTo?.[0] &&
                                    // If it’s positional-projected, it should already match this doctor.
                                    (summary.deliveredTo.length >= 1
                                        ? summary.deliveredTo.find(d => {
                                            const id = (d.doctor?._id || d.doctor)?.toString?.() ?? "";
                                            return id === authUser._id;
                                        })
                                        : {});
                                return (
                                    <div key={summary._id} className='relative bg-base-300 border-base-300 border py-1 rounded-3xl'>
                                        <div className='flex items-center justify-end z-50 absolute top-0 right-7'>
                                            <span className="text-sm text-accent p-2">
                                                {/* <div className={`btn mx-1 ${summary.viewed === true ? 'bg-gray-400 text-black hover:disabled:* ': ''}`} onClick={(e) => { onChangeStatus(summary._id) }}>
                                                {summary.viewed === true ? 'Viewed' : 'Mark as Read'}
                                            </div> */}
                                                {/* <div
                                                    className={`btn mx-2 rounded-4xl 
                                                    ${summary.status === true
                                                            ? 'bg-gray-400 text-gray-800 opacity-50'
                                                            : '' // Keep your default styles for the active button here
                                                        }`}
                                                    onClick={(e) => {
                                                        // You might want to prevent the click if it's already viewed
                                                        // if (summary.viewed) return;
                                                        onChangeStatus(summary._id, summary.status);
                                                    }}
                                                >
                                                    {summary.status === 'New' ? 'Mark as Under Review' : ''}
                                                    {summary.status === 'UnderReview' ? 'Mark as Resolved' : ''}
                                                    {summary.status === 'Resolved' ? 'Mark as unresolved' : ''}
                                                </div> */}
                                                <div className="dropdown dropdown-top rounded-4xl mx-2">
                                                    <div tabIndex={0} role="button" className="btn m-1 rounded-4xl">Actions</div>
                                                    <ul tabIndex="-1" className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
                                                        {summary.status === 'New' &&
                                                            <>
                                                                <li className='cursor-pointer p-1 hover:bg-accent/10 rounded-xl'
                                                                onClick={(e) => { onChangeStatus(summary._id, 'UnderReview') }}>
                                                                    Mark as Under Review
                                                                </li>
                                                                <li className='cursor-pointer p-1 hover:bg-accent/10 rounded-xl'
                                                                onClick={(e) => { onChangeStatus(summary._id, 'Resolved') }}>
                                                                    Mark as Resolved
                                                                </li>
                                                            </>
                                                        }
                                                        {summary.status === 'UnderReview' &&
                                                            <>
                                                                <li className='cursor-pointer p-1 hover:bg-accent/10 rounded-xl'
                                                                onClick={(e) => { onChangeStatus(summary._id, 'Resolved') }}>
                                                                    Mark as Resolved
                                                                </li>
                                                                {/* <li onClick={(e) => { onChangeStatus(summary._id, 'Resolved') }}>
                                                                    Mark as Resolved
                                                                </li> */}
                                                            </>
                                                        }
                                                        {summary.status === 'Resolved' &&
                                                            <>
                                                                <li className='cursor-pointer p-1 hover:bg-accent/10 rounded-xl'
                                                                onClick={(e) => { onChangeStatus(summary._id, 'UnderReview') }}>
                                                                    Mark as Unresolved
                                                                </li>
                                                                {/* <li onClick={(e) => { onChangeStatus(summary._id, 'Resolved') }}>
                                                                    Mark as Resolved
                                                                </li> */}
                                                            </>
                                                        }
                                                    </ul>
                                                </div>

                                                {/* Open the modal using document.getElementById('ID').showModal() method */}
                                                <button className="btn rounded-4xl" onClick={() => document.getElementById(`my_modal_2${summary._id}`).showModal()}>Info</button>
                                                <dialog id={`my_modal_2${summary._id}`} className="modal modal-bottom sm:modal-middle">
                                                    <div className="modal-box">
                                                        <h3 className="font-bold text-lg">Hello!</h3>
                                                        <p className="py-4">Press ESC key or click outside to close</p>
                                                        <div className="modal-action">
                                                            <form method="dialog">
                                                                {/* if there is a button in form, it will close the modal */}
                                                                <button className="btn">Close</button>
                                                            </form>
                                                        </div>
                                                    </div>
                                                    <form method="dialog" className="modal-backdrop">
                                                        <button>close</button>
                                                    </form>
                                                </dialog>
                                            </span>
                                        </div>
                                        <div tabIndex={0} className="collapse collapse-arrow ">
                                            <input type="checkbox" />

                                            <div className="collapse-title">
                                                <h3 className="font-semibold text-sm">Patient: {summary.patient.fullName}</h3>
                                            </div>
                                            <div className="collapse-content px-4">
                                                <p className="text-sm text-gray-700 mt-2 flex justify-between">
                                                    Notes:
                                                </p>
                                                <ul className="list-disc pl-5 text-sm mt-1">
                                                    {summary.content.map((note, i) => (
                                                        <li key={i}>{note}</li>
                                                    ))}
                                                </ul>

                                                {summary.questionsAsked?.length > 0 && (
                                                    <>
                                                        <p className="text-sm text-gray-700 mt-2">Follow-up Questions:</p>
                                                        <ul className="list-disc pl-5 text-sm mt-1">
                                                            {summary.questionsAsked.map((q, i) => (
                                                                <li key={i}>{q}</li>
                                                            ))}
                                                        </ul>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>
        </>

    );
}

















// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";

// import { useAuthStore } from "../../store/useAuthStore";
// import { useSummaryStore } from "../../store/useSummaryStore";

// export default function SummariesContainer({ summaries, viewType, onChangeStatus }) {
//     const navigate = useNavigate();

//     return (
//         <>
//             <div className="card bg-base-200 shadow-md md:col-span-1 lg:col-span-2 overflow-y-auto">
//                 <div className="card-body">
//                     <h2 className="card-title">
//                         {viewType === 'newSummaries' && <p>newSummaries Summaries</p>}
//                         {viewType === 'viewed' && <p>Recently Viewed Summaries</p>}
//                         {viewType === 'resolvedSummaries' && <p>Past Summaries</p>}

//                     </h2>
//                     <div className="space-y-3 mt-2 max-h-[60vh]">
//                         {summaries.length === 0 ? (
//                             <p className="text-gray-500">
//                                 {viewType === 'newSummaries' && <p>No newSummaries Summaries yet.</p>}
//                                 {viewType === 'viewed' && <p>No Recently Viewed Summaries yet.</p>}
//                                 {viewType === 'resolvedSummaries' && <p>No Past Summaries yet.</p>}
//                             </p>
//                         ) : (
//                             summaries.map((summary) => (
//                                 <div key={summary._id} className="card bg-base-300 shadow-sm">
//                                     <div className="card-body py-3 px-4">
//                                         <div className="flex items-center justify-between">

//                                             <h3 className="font-semibold text-sm">Patient: {summary.patient.fullName}</h3>
//                                             <span className="text-sm text-accent">
//                                                 <div className='btn mx-1' onClick={() => onChangeStatus(summary._id)}>
//                                                     {summary.viewed === true ? 'Viewed' : 'Mark as Read'}
//                                                 </div>

//                                                 {/* Open the modal using document.getElementById('ID').showModal() method */}
//                                                 <button className="btn" onClick={() => document.getElementById(`my_modal_2${summary._id}`).showModal()}>Info</button>
//                                                 <dialog id={`my_modal_2${summary._id}`} className="modal modal-bottom sm:modal-middle">
//                                                     <div className="modal-box">
//                                                         <h3 className="font-bold text-lg">Hello!</h3>
//                                                         <p className="py-4">Press ESC key or click outside to close</p>
//                                                         <div className="modal-action">
//                                                             <form method="dialog">
//                                                                 {/* if there is a button in form, it will close the modal */}
//                                                                 <button className="btn">Close</button>
//                                                             </form>
//                                                         </div>
//                                                     </div>
//                                                     <form method="dialog" className="modal-backdrop">
//                                                         <button>close</button>
//                                                     </form>
//                                                 </dialog>
//                                             </span>

//                                         </div>
//                                         <p className="text-sm text-gray-700 mt-2 flex justify-between">
//                                             Notes:
//                                         </p>
//                                         <ul className="list-disc pl-5 text-sm mt-1">
//                                             {summary.content.map((note, i) => (
//                                                 <li key={i}>{note}</li>
//                                             ))}
//                                         </ul>

//                                         {summary.questionsAsked?.length > 0 && (
//                                             <>
//                                                 <p className="text-sm text-gray-700 mt-2">Follow-up Questions:</p>
//                                                 <ul className="list-disc pl-5 text-sm mt-1">
//                                                     {summary.questionsAsked.map((q, i) => (
//                                                         <li key={i}>{q}</li>
//                                                     ))}
//                                                 </ul>
//                                             </>
//                                         )}
//                                     </div>
//                                 </div>
//                             ))
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </>

//     );
// }
