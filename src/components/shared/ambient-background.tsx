export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div
        className="aurora-blob-a absolute -left-1/4 -top-1/4 h-[60vh] w-[60vh] rounded-full opacity-[0.15] blur-[100px]"
        style={{ background: "hsl(var(--primary))" }}
      />
      <div
        className="aurora-blob-b absolute -right-1/4 top-1/3 h-[55vh] w-[55vh] rounded-full opacity-[0.12] blur-[100px]"
        style={{ background: "hsl(var(--accent-gold))" }}
      />
      <div
        className="aurora-blob-a absolute -bottom-1/4 left-1/4 h-[50vh] w-[50vh] rounded-full opacity-[0.1] blur-[100px]"
        style={{ background: "hsl(200 70% 45%)", animationDelay: "-12s" }}
      />
    </div>
  );
}
