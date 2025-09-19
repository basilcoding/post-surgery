import React, { useState, useEffect, useRef } from "react";
import { useUserStore } from "../../store/useUserStore";

const SearchableInput = ({ type = 'dropdown', searchPlaceholder = "", fetchFunction, selectedUser, resetSignal }) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [clickedItem, setClickedItem] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const { isLoading } = useUserStore();
    // const { fetchDoctors, fetchPatients, isLoading } = useUserStore();

    // watch resetSignal (if there is a change in the resetSignal (true or false) the input is cleared
    useEffect(() => {
        setQuery("");
        setClickedItem(null);
        setResults([]);
    }, [resetSignal]); // the change is detected using this dependency array

    useEffect(() => {
        const q = (query || "").trim();

        // do not fetch anything if the query is empty
        if (!q) {
            setResults([]);
            setShowDropdown(false)
            return;
        }
        const controller = new AbortController();

        // Why setTimeout is used here! Please Read!
        // Imagine you call the backend on every keystroke:
        // That can flood your server with requests, especially when users type fast.
        // In your effect:
        // Each time query changes, a new timeout starts.
        // If the user keeps typing before 300ms is up, the cleanup runs:
        // That means only when the user pauses typing for ~300ms does the search fire.
        // This reduces backend calls dramatically while keeping the UI responsive.
        const id = setTimeout(async () => {
            try {
                // It calls the passed-in fetchFunction with the query and signal
                let data = await fetchFunction(q, controller.signal);
                setResults(Array.isArray(data) ? data : []);
                console.log(data)
            } catch (error) {
                if (!controller.signal.aborted) {
                    console.error("Search error:", error);
                }
            }
        }, 300);

        return () => {
            clearTimeout(id); // clear the time out this component unmounts
            controller.abort();
        };
    }, [query, setResults, fetchFunction]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                console.log('setting showdropdown to false')
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <>
            <div className="relative w-full">

                {clickedItem && (
                    <p className="text-sm text-gray-600">
                        Selected: <strong>{clickedItem.fullName}</strong> ({clickedItem.email})
                    </p>
                )}

                <input
                    type="text"
                    value={clickedItem ? `${clickedItem.fullName}` : query}
                    placeholder={`${searchPlaceholder}`}
                    onChange={(e) => {
                        // user starts typing -> cancel the selection so the input becomes editable
                        setClickedItem(null);
                        setQuery(e.target.value);
                        setShowDropdown(true);
                    }}
                    className="input input-bordered w-full"
                />

                <div className="z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {isLoading && <div className="p-2 text-sm">Loading...</div>}
                    { showDropdown && !isLoading && results.length === 0 && (
                        <div className="p-2 text-sm text-gray-500" ref={dropdownRef}>No results</div>
                    )}

                    {type === 'dropdown' && showDropdown && results.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-base-200 shadow-lg rounded-lg max-h-60 overflow-y-auto"
                            ref={dropdownRef}>
                            <ul>
                                {results.map((item) => (
                                    <li
                                        key={item._id}
                                        onClick={() => {
                                            setClickedItem(item)
                                            selectedUser(item)
                                            setQuery(item.fullName);
                                            setShowDropdown(false);
                                        }}
                                        className="px-4 py-2 hover:bg-base-300 cursor-pointer"
                                    >
                                        <strong>{item.fullName}</strong> ({item.email})
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* <ul>
                        {results.map((item) => (
                            <li
                                key={item._id}
                                onClick={() => {
                                    onSelect(item);
                                    setQuery(item.fullName);
                                    setShowDropdown(false);
                                }}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            >
                                <div className="text-xs text-gray-500">
                                    <strong>{item.fullName}</strong> <br />{item.email}
                                </div>
                            </li>
                        ))}
                    </ul> */}
                </div>
            </div>
        </>
    );
};

export default SearchableInput;


// Why the dropdownRef.current Check is Crucial
// The issue is a race condition that can happen when the component is being removed from the screen (unmounting).

// Here’s the scenario where your app would crash without the check:

// Your SearchableDropdown component is visible, and dropdownRef.current points to your <div>.

// The user clicks a "Log Out" button or navigates to another page, which causes your dropdown component to unmount.

// The mousedown event listener you attached to the document is still active for a split second.

// React cleans up the unmounted component, and as part of that cleanup, it sets dropdownRef.current back to null.

// Your handleClickOutside function finally runs in response to the click.

// It tries to execute your condition: !null.contains(event.target).

// The application immediately crashes with a TypeError: Cannot read properties of null (reading 'contains').

// No, that condition by itself is not enough.The dropdownRef.current && check that comes before it is essential to prevent your application from crashing in certain situations.

// ## Why the dropdownRef.current Check is Crucial
// The issue is a race condition that can happen when the component is being removed from the screen(unmounting).

//     Here’s the scenario where your app would crash without the check:

// Your SearchableDropdown component is visible, and dropdownRef.current points to your < div >.

// The user clicks a "Log Out" button or navigates to another page, which causes your dropdown component to unmount.

// The mousedown event listener you attached to the document is still active for a split second.

// React cleans up the unmounted component, and as part of that cleanup, it sets dropdownRef.current back to null.

// Your handleClickOutside function finally runs in response to the click.

// It tries to execute your condition: !null.contains(event.target).

// The application immediately crashes with a TypeError: Cannot read properties of null(reading 'contains'). 💥

// ## The Safe and Correct Pattern
// This is why the full condition is always written this way:

// JavaScript

// if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//     // ... close the dropdown
// }
// This uses a JavaScript feature called short - circuiting.If the first part(dropdownRef.current) is null or undefined, JavaScript doesn't even bother to evaluate the second part (!dropdownRef.current.contains(...)), thus preventing the error.

// Think of it as a safety check: "First, make sure the box exists, then check what's inside it."