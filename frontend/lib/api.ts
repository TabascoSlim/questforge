// Requests go to this site's own /api path; next.config.js forwards them to the backend.
// (Set NEXT_PUBLIC_API_URL only to call a backend on a different address directly.)
export interface AvatarLook {
  skin: string;
  hair: string;
  hair_color: string;
  face: string;
  color: string;
  hat: string;
}

export interface GuildSummary {
  id: string;
  name: string;
  member_count: number;
  seat_count: number;
  is_full: boolean;
  is_mine: boolean;
}

export interface Guild {
  id: string;
  name: string;
  owner_id: string;
  seat_count: number;
  subscription_active: boolean;
  context: string;
  member_count: number;
  invite_code: string | null;
}

export interface GuildMember {
  id: string;
  username: string;
  display_name: string | null;
  is_owner: boolean;
  is_you?: boolean;
  avatar: AvatarLook | null;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  total_xp: number;
  avatar: AvatarLook;
  is_you: boolean;
}

export interface Me {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  preferences: Record<string, unknown>;
  subscription_tier: string;
  team_id: string | null;
  avatar: AvatarLook;
  is_demo: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    if (body && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }));
      // Validation errors arrive as a list; show their messages instead of "[object Object]"
      const detail = Array.isArray(error.detail)
        ? error.detail.map((d: { msg?: string }) => (d.msg ?? '').replace(/^Value error, /, '')).join(' ')
        : error.detail;
      throw new Error(detail || 'Something went wrong. Try again.');
    }

    return res.json();
  }

  get<T>(path: string) {
    return this.request<T>('GET', path);
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>('POST', path, body);
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>('PUT', path, body);
  }

  // Auth
  register(email: string, username: string, password: string) {
    return this.post<{ access_token: string }>('/api/auth/register', {
      email,
      username,
      password,
    });
  }

  login(email: string, password: string) {
    return this.post<{ access_token: string }>('/api/auth/login', {
      email,
      password,
    });
  }

  // One-click demo account
  demoAvailable() {
    return this.get<{ available: boolean }>('/api/auth/demo');
  }

  demoLogin() {
    return this.post<{ access_token: string }>('/api/auth/demo');
  }

  // User
  getMe() {
    return this.get<Me>('/api/users/me');
  }

  updateProfile(update: { display_name?: string; avatar?: AvatarLook; categories?: string[] }) {
    return this.put<Me>('/api/users/profile', update);
  }

  updatePreferences(preferences: Record<string, unknown>) {
    return this.put('/api/users/preferences', { preferences });
  }

  // Quests
  getTodayQuests() {
    return this.get<{
      id: string;
      title: string;
      description: string | null;
      category: string;
      difficulty: number;
      xp_reward: number;
      narrative_text: string | null;
      status: string;
      completed_at: string | null;
    }[]>('/api/quests/today');
  }

  completeQuest(questId: string) {
    return this.post<{
      xp_earned: number;
      total_xp: number;
      level: number;
      leveled_up: boolean;
    }>(`/api/quests/${questId}/complete`);
  }

  getStats() {
    return this.get<{
      total_xp: number;
      level: number;
      xp_in_level: number;
      xp_to_next: number;
      current_streak: number;
      last_activity_date: string | null;
    }>('/api/quests/stats');
  }

  getLeaderboard(scope: 'everyone' | 'guild' = 'everyone') {
    return this.get<{ leaderboard: LeaderboardEntry[]; scope: string }>(`/api/quests/leaderboard?scope=${scope}`);
  }

  // Agent
  getAgentQuests() {
    return this.get<{ quests: Record<string, unknown>[] }>('/api/agent/quests/today');
  }

  // Demo account only: clear today's quests (done or not) and post a fresh set
  resetTodayQuests() {
    return this.post<{ quests: Record<string, unknown>[] }>('/api/agent/quests/reset-today');
  }

  regenerateQuests() {
    return this.post<{ quests: Record<string, unknown>[] }>('/api/agent/quests/regenerate');
  }

  getLevelUpMessage(level: number) {
    return this.get<{ message: string }>(`/api/agent/narrative/level-up?level=${level}`);
  }

  getStreakWarning(streak: number) {
    return this.get<{ message: string }>(`/api/agent/narrative/streak-warning?streak=${streak}`);
  }

  // Guilds
  listGuilds() {
    return this.get<GuildSummary[]>('/api/teams');
  }

  myGuild() {
    return this.get<{ team: Guild | null; members: GuildMember[] }>('/api/teams/mine');
  }

  createGuild(name: string) {
    return this.post<Guild>('/api/teams', { name });
  }

  joinGuild(teamId: string) {
    return this.post<Guild>(`/api/teams/${teamId}/join`);
  }

  joinGuildByCode(inviteCode: string) {
    return this.post<Guild>('/api/teams/join', { invite_code: inviteCode });
  }

  leaveGuild() {
    return this.post<{ detail: string }>('/api/teams/leave');
  }
}

export const api = new ApiClient();
