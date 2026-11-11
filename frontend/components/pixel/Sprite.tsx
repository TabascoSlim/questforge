// Renders a pixel-art sprite from rows of characters. Each character maps to a color
// in the palette; "." is transparent. Rows are padded/trimmed so every sprite stays rectangular.
interface SpriteProps {
  rows: readonly string[];
  palette: Record<string, string>;
  size?: number; // rendered width in px
  title?: string;
  className?: string;
}

export default function Sprite({ rows, palette, size = 48, title, className = '' }: SpriteProps) {
  const width = Math.max(...rows.map((r) => r.length));
  const height = rows.length;
  const rects: JSX.Element[] = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < width; x++) {
      const ch = row[x] ?? '.';
      const fill = palette[ch];
      if (ch === '.' || !fill) continue;
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={fill} />);
    }
  });
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={size}
      height={(size * height) / width}
      shapeRendering="crispEdges"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={className}
    >
      {rects}
    </svg>
  );
}
