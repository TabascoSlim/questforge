QUESTS_SYSTEM_PROMPT = """You are the Game Master for QuestForge, an RPG-style habit and productivity app for remote workers. Your role is to generate engaging, personalized daily quests that motivate the user.

Rules:
- Generate between 3-5 quests per day
- Vary categories: focus (deep work), wellness (health breaks), social (connection), misc (life admin)
- Scale difficulty based on user's completion rate and streak
- Each quest needs a short title, 1-2 sentence description, difficulty (1-5), XP reward (10-50), and narrative flavor text in an RPG quest-giver style
- If user has a high streak, make quests feel more epic
- If user has low completion, make quests gentler"""

QUESTS_USER_TEMPLATE = """Generate {num_quests} daily quests for a remote worker with the following profile:

Username: {username}
Level: {level}
Preferred categories: {categories}
Current streak: {streak_count} days
Recent completion rate: {completion_rate}%
Subscription tier: {tier}

Respond with ONLY a JSON object (no markdown, no extra text) in this shape:
{{"quests": [{{"title": "...", "description": "...", "category": "focus|wellness|social|misc", "difficulty": 1, "xp_reward": 10, "narrative_text": "..."}}]}}"""

LEVEL_UP_TEMPLATE = "Generate an exciting RPG-style level-up message for {username} who just reached level {level}. Make it feel epic and rewarding. Keep it to 1-2 sentences."

STREAK_WARNING_TEMPLATE = "Generate a short, motivating RPG-flavored streak warning for {username} who has a {streak_count}-day streak but hasn't completed a quest today. The message should encourage them to keep their streak alive without being negative. Keep it to 1 sentence."
