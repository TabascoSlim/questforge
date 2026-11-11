import Sprite from '@/components/pixel/Sprite';
import { avatarSprite, AvatarLook, OUTFITS } from '@/components/pixel/sprites';

export type { AvatarLook };

// A character portrait in a small window frame
export default function Avatar({ look, size = 40, name }: { look?: Partial<AvatarLook> | null; size?: number; name?: string }) {
  const sprite = avatarSprite(look);
  const tint = OUTFITS[look?.color ?? 'indigo']?.shade ?? '#3B4790';
  return (
    <span
      className="inline-flex items-end justify-center shrink-0 overflow-hidden"
      style={{ width: size, height: size, background: `linear-gradient(180deg, #0E1650, ${tint})`, border: '2px solid #EEF1FB', borderRadius: 4 }}
    >
      <Sprite rows={sprite.rows} palette={sprite.palette} size={size - 6} title={name ? `${name}'s avatar` : undefined} />
    </span>
  );
}
