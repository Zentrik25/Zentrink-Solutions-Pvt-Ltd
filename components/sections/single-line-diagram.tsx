/**
 * Flat single-line diagram of a typical LV distribution arrangement.
 * Decorative engineering illustration; it makes no claim about a real project.
 */
export function SingleLineDiagram({ className }: { className?: string }) {
  const stroke = "#c9d0d8";
  const label = {
    fill: "#9aa5b1",
    fontSize: 10,
    letterSpacing: 1.6,
    fontWeight: 700,
  } as const;

  const feeders = [
    { x: 80, name: "MOTOR", kind: "M" },
    { x: 180, name: "SOLAR PV", kind: "PV" },
    { x: 280, name: "LIGHTING", kind: "DB" },
    { x: 380, name: "STANDBY", kind: "G" },
  ];

  return (
    <svg
      role="img"
      aria-label="Single-line diagram showing supply, transformer, main breaker, busbar and four outgoing feeders"
      viewBox="0 0 460 500"
      className={className}
    >
      <defs>
        <pattern id="sld-grid" width="23" height="23" patternUnits="userSpaceOnUse">
          <path d="M23 0H0V23" fill="none" stroke="#1a3a66" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="460" height="500" fill="#0b1f3a" />
      <rect width="460" height="500" fill="url(#sld-grid)" />

      <g fill="none" stroke={stroke} strokeWidth="2">
        {/* Supply */}
        <circle cx="230" cy="48" r="16" />
        <path d="M222 48q4-8 8 0t8 0" />
        <path d="M230 64V104" />
        {/* Transformer */}
        <circle cx="230" cy="120" r="16" />
        <circle cx="230" cy="144" r="16" />
        <path d="M230 160V196" />
        {/* Main breaker */}
        <rect x="220" y="196" width="20" height="20" />
        <path d="M222 198l16 16M238 198l-16 16" />
        <path d="M230 216V256" />
      </g>

      {/* Busbar */}
      <rect x="40" y="254" width="380" height="8" fill="#f26a1b" />

      <g fill="none" stroke={stroke} strokeWidth="2">
        {feeders.map((f) => (
          <g key={f.name}>
            <path d={`M${f.x} 262V300`} />
            <rect x={f.x - 8} y="300" width="16" height="16" />
            <path d={`M${f.x} 316V370`} />
            {f.kind === "M" || f.kind === "G" ? (
              <circle cx={f.x} cy="394" r="24" />
            ) : (
              <rect x={f.x - 24} y="370" width="48" height="48" />
            )}
          </g>
        ))}
      </g>

      <g fill="#ffffff" fontSize="14" fontWeight="800" textAnchor="middle">
        {feeders.map((f) => (
          <text key={f.kind} x={f.x} y={400}>
            {f.kind}
          </text>
        ))}
      </g>

      <g style={label} textAnchor="middle">
        <text x="230" y="22" fill={label.fill}>SUPPLY</text>
        <text x="280" y="136" textAnchor="start" fill={label.fill}>TRANSFORMER</text>
        <text x="256" y="210" textAnchor="start" fill={label.fill}>MAIN BREAKER</text>
        <text x="40" y="244" textAnchor="start" fill="#f26a1b">LV BUSBAR</text>
        {feeders.map((f) => (
          <text key={f.name} x={f.x} y={450} fill={label.fill}>
            {f.name}
          </text>
        ))}
      </g>
    </svg>
  );
}
