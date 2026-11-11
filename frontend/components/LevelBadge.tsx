'use client';

export default function LevelBadge({ level, size = 'md' }: { level: number; size?: 'sm' | 'md' | 'lg' }) {
  const text = { sm: 'text-3xl', md: 'text-4xl', lg: 'text-5xl' }[size];
  return (
    <p className={`font-display ${text} text-ink whitespace-nowrap`} aria-label={`Level ${level}`}>
      <span className="text-ink-mist text-[0.7em] mr-1">Lv</span>
      {level}
    </p>
  );
}
