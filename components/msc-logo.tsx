// M. Siddique Ch. & Co. — vector recreation of the "MSC" venetian-stripe wordmark.
// Red letters sliced by horizontal gaps (the paper showing through), with the
// firm name set beneath. Self-contained SVG so it stays crisp at any size and
// prints cleanly.

const RED = "#E3001B";

/** Horizontal slit positions (y, in viewBox units) across the MSC letters. */
const STRIPES = [9, 15.5, 22, 28.5, 35, 41.5];

export function MscLogo({
  showName = true,
  className,
  height = 40,
}: {
  showName?: boolean;
  className?: string;
  height?: number;
}) {
  // viewBox: 240 wide; letters occupy y 4–48, name row y 58–70
  return (
    <svg
      viewBox="0 0 240 72"
      height={height}
      className={className}
      role="img"
      aria-label="M. Siddique Ch. & Co."
    >
      <defs>
        <mask id="msc-stripes">
          <rect x="0" y="0" width="240" height="52" fill="#fff" />
          {STRIPES.map((y) => (
            <rect key={y} x="0" y={y} width="240" height="2.6" fill="#000" />
          ))}
        </mask>
      </defs>

      <text
        x="0"
        y="45"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight={800}
        fontSize="52"
        letterSpacing="-1"
        fill={RED}
        mask="url(#msc-stripes)"
      >
        MSC
      </text>

      {showName && (
        <text
          x="1"
          y="67"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="11.5"
          letterSpacing="1.2"
          fill="currentColor"
        >
          M. SIDDIQUE CH. &amp; CO.
        </text>
      )}
    </svg>
  );
}
