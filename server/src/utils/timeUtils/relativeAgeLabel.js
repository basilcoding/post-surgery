

export function relativeAgeLabel(ts, now = new Date()) {
    const then = ts ? new Date(ts) : null;
    if (!then || Number.isNaN(then.getTime())) return "unknown";
    const s = Math.round((now - then) / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.round(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.round(h / 24);
    return `${d}d ago`;
}