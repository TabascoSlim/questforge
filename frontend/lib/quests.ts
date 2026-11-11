import { api } from '@/lib/api';

export interface Quest {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: number;
  xp_reward: number;
  narrative_text: string | null;
  status: string;
  completed_at: string | null;
}

function fromAgent(q: Record<string, unknown>): Quest {
  return {
    id: (q.id as string) || '',
    title: q.title as string,
    description: (q.description as string) || null,
    category: (q.category as string) || 'misc',
    difficulty: (q.difficulty as number) || 1,
    xp_reward: (q.xp_reward as number) || 10,
    narrative_text: (q.narrative_text as string) || null,
    status: (q.status as string) || 'active',
    completed_at: (q.completed_at as string) || null,
  };
}

// Today's quests; asks the Game Master to post a fresh set if there are none yet
export async function loadTodayQuests(): Promise<Quest[]> {
  const today = await api.getTodayQuests();
  if (today.length > 0) return today;
  const generated = await api.getAgentQuests();
  return (generated.quests ?? []).map(fromAgent);
}

export async function resetTodayQuests(): Promise<Quest[]> {
  const fresh = await api.resetTodayQuests();
  return (fresh.quests ?? []).map(fromAgent);
}

export async function rerollQuests(): Promise<Quest[]> {
  const generated = await api.regenerateQuests();
  return (generated.quests ?? []).map(fromAgent);
}
