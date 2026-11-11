'use client';

import Sprite from '@/components/pixel/Sprite';
import { CHEST_CLOSED, CHEST_OPEN, ITEMS, ItemCategory } from '@/components/pixel/sprites';

interface RowQuest {
  id: string;
  title: string;
  category: string;
  status: string;
}

// Today's quests as treasure chests: clearing a quest opens its chest and reveals the item
export default function TreasureRow({ quests, greeting }: { quests: RowQuest[]; greeting: string }) {
  const done = quests.filter((q) => q.status === 'completed').length;
  return (
    <section aria-label="Today's treasure" className="window">
      <h1>{greeting}</h1>
      <p className="text-ink-mist mt-1">
        {quests.length === 0
          ? 'No quests have been posted yet today.'
          : done === quests.length
            ? `All ${quests.length} chests opened. A full haul for today.`
            : `${done} of ${quests.length} chests opened. Clear a quest to open the next one.`}
      </p>
      <ul className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {quests.map((q) => {
          const open = q.status === 'completed';
          const item = ITEMS[(q.category in ITEMS ? q.category : 'misc') as ItemCategory];
          return (
            <li key={q.id} className="window-inset flex flex-col items-center text-center gap-1 pt-3">
              <div className="h-8 flex items-end" aria-hidden={!open}>
                {open && (
                  <span className="animate-[chest-pop_400ms_steps(4)_both]">
                    <Sprite rows={item.rows} palette={item.palette} size={30} title={item.name} />
                  </span>
                )}
              </div>
              <Sprite
                rows={(open ? CHEST_OPEN : CHEST_CLOSED).rows}
                palette={(open ? CHEST_OPEN : CHEST_CLOSED).palette}
                size={56}
                title={open ? 'Opened chest' : 'Closed chest'}
              />
              <span className="mt-1 text-base leading-tight">{q.title}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
