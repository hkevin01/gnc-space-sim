import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const phases = [
    { key: 'leo', label: 'LEO' },
    { key: 'escape', label: 'Escape' },
    { key: 'cruise', label: 'Cruise' },
    { key: 'rendezvous', label: 'Rendezvous' },
    { key: 'proximity', label: 'Proximity Ops' },
    { key: 'tag', label: 'TAG' },
    { key: 'mars-transfer', label: 'Mars Transfer' },
    { key: 'mars-arrival', label: 'Mars Arrival' },
];
export function MissionPanel({ phase, onChange }) {
    return (_jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "text-sm text-zinc-300", children: "Mission Phases" }), _jsx("ul", { className: "text-sm space-y-1", children: phases.map((p) => (_jsx("li", { children: _jsx("button", { type: "button", className: `w-full text-left px-2 py-1 rounded hover:bg-zinc-800 ${phase === p.key ? 'bg-zinc-800 text-white' : 'text-zinc-300'}`, onClick: () => onChange?.(p.key), children: p.label }) }, p.key))) })] }));
}
