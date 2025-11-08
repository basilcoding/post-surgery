import React from "react";
import { toast } from "react-hot-toast";

/**
 * CopyField component
 * 
 * Props:
 * - label: string (field label)
 * - value: string (value to display & copy)
 * - hiddenValue?: boolean (optional — if true, hides value behind •••)
 * - className?: string (extra classes for outer wrapper)
 */

export default function CopyButtonComponent({ label, value, hiddenValue = false, className = "" }) {
    const safeId = React.useId(); // unique DOM id per instance

    const handleCopy = () => {
        if (!value) return;

        const element = document.getElementById(`copyfield-text-${safeId}`);
        const text = value.toString();

        // Prefer navigator.clipboard if available
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text)
                .then(() => toast.success(`copied to clipboard!`))
                .catch(() => {
                    // fallback to manual highlight
                    if (element) {
                        const range = document.createRange();
                        range.selectNode(element);
                        const selection = window.getSelection();
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                    toast("Copied manually — press Ctrl+C");
                });
        } else {
            // fallback for insecure or old browsers
            if (element) {
                const range = document.createRange();
                range.selectNode(element);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            }
            toast("Copied manually — press Ctrl+C");
        }
    };

    return (
        <span className={`flex flex-col gap-1 ${className}`}>
            {label && <span className="text-xs text-muted-foreground">{label}</span>}
            <div className="flex items-center gap-2">
                <div
                    id={`copyfield-text-${safeId}`}
                    className="font-medium select-text"
                >
                    {hiddenValue ? "••••••" : value || "—"}
                </div>
                {value && (
                    <button
                        onClick={handleCopy}
                        className="btn btn-xs btn-outline"
                    >
                        Copy
                    </button>
                )}
            </div>
        </span>
    );
}
