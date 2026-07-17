export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: "var(--ink)",
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: size * 0.42,
        letterSpacing: "-0.03em",
        flexShrink: 0,
      }}
    >
      SP
    </span>
  );
}

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <span
        className="leading-none"
        style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
      >
        <span className="block text-[15px] tracking-tight text-ink">
          Studio Prins
        </span>
        <span className="block text-[11px] font-medium tracking-wide text-muted">
          Dashboard
        </span>
      </span>
    </span>
  );
}
