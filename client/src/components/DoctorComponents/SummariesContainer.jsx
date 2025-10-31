import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuthStore } from "../../store/useAuthStore";
import { useSummaryStore } from "../../store/useSummaryStore";

export default function SummariesContainer({ summaries, activeView, onMarkViewed }) {
    const navigate = useNavigate();

    const { authUser } = useAuthStore();

    return (
        <>
            <div className="card bg-base-200 shadow-md col-span-1 lg:col-span-2 overflow-y-auto">
                <div className="card-body">
                    <h2 className="card-title">
                        {activeView === 'new' && <p>New Summaries</p>}
                        {activeView === 'recentlyViewed' && <p>Recently Viewed Summaries</p>}
                        {activeView === 'history' && <p>Past Summaries</p>}

                    </h2>
                    <div className="space-y-3 mt-2 max-h-[60vh]">
                        {summaries.length === 0 ? (
                            <div className="text-gray-500">
                                {activeView === 'new' && <p>No New Summaries yet.</p>}
                                {activeView === 'recentlyViewed' && <p>No Recently Viewed Summaries yet.</p>}
                                {activeView === 'history' && <p>No Past Summaries yet.</p>}
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
                                            <span className="text-sm text-accent p-3">
                                                {/* <div className={`btn mx-1 ${summary.viewed === true ? 'bg-gray-400 text-black hover:disabled:* ': ''}`} onClick={(e) => { onMarkViewed(summary._id) }}>
                                                {summary.viewed === true ? 'Viewed' : 'Mark as Read'}
                                            </div> */}
                                                <div
                                                    className={`btn mx-2 rounded-4xl 
                                                    ${deliveredToDoc.viewed === true
                                                            ? 'bg-gray-400 text-gray-800 opacity-50'
                                                            : '' // Keep your default styles for the active button here
                                                        }`}
                                                    onClick={(e) => {
                                                        // You might want to prevent the click if it's already viewed
                                                        // if (summary.viewed) return;
                                                        onMarkViewed(summary._id, deliveredToDoc.viewed);
                                                    }}
                                                >
                                                    {deliveredToDoc.viewed ? 'Viewed' : 'Mark as Read'}
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

// export default function SummariesContainer({ summaries, viewType, onMarkViewed }) {
//     const navigate = useNavigate();

//     return (
//         <>
//             <div className="card bg-base-200 shadow-md md:col-span-1 lg:col-span-2 overflow-y-auto">
//                 <div className="card-body">
//                     <h2 className="card-title">
//                         {viewType === 'new' && <p>New Summaries</p>}
//                         {viewType === 'viewed' && <p>Recently Viewed Summaries</p>}
//                         {viewType === 'history' && <p>Past Summaries</p>}

//                     </h2>
//                     <div className="space-y-3 mt-2 max-h-[60vh]">
//                         {summaries.length === 0 ? (
//                             <p className="text-gray-500">
//                                 {viewType === 'new' && <p>No New Summaries yet.</p>}
//                                 {viewType === 'viewed' && <p>No Recently Viewed Summaries yet.</p>}
//                                 {viewType === 'history' && <p>No Past Summaries yet.</p>}
//                             </p>
//                         ) : (
//                             summaries.map((summary) => (
//                                 <div key={summary._id} className="card bg-base-300 shadow-sm">
//                                     <div className="card-body py-3 px-4">
//                                         <div className="flex items-center justify-between">

//                                             <h3 className="font-semibold text-sm">Patient: {summary.patient.fullName}</h3>
//                                             <span className="text-sm text-accent">
//                                                 <div className='btn mx-1' onClick={() => onMarkViewed(summary._id)}>
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
