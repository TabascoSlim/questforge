/// Pure XP calculation functions — this is the "secret sauce" core logic.

const BASE_XP: u64 = 100;
const LEVEL_SCALE: f64 = 1.5;

/// Calculate total XP needed to reach a given level.
pub fn xp_for_level(level: u32) -> u64 {
    if level == 0 {
        return 0;
    }
    (BASE_XP as f64 * (level as f64).powf(LEVEL_SCALE)) as u64
}

/// Calculate the level for a given total XP.
pub fn level_from_xp(total_xp: u64) -> u32 {
    let mut level = 1;
    loop {
        let needed = xp_for_level(level);
        if total_xp < needed {
            return level;
        }
        level += 1;
    }
}

/// Get XP progress within current level.
pub fn xp_progress(total_xp: u64) -> (u32, u32, u32) {
    let level = level_from_xp(total_xp);
    let current_level_xp = if level == 1 {
        0
    } else {
        xp_for_level(level - 1)
    };
    let next_level_xp = xp_for_level(level);
    let xp_in_level = (total_xp - current_level_xp) as u32;
    let xp_to_next = (next_level_xp - current_level_xp) as u32;
    (level, xp_in_level, xp_to_next)
}

/// Calculate XP bonus based on streak length.
pub fn streak_bonus(streak_days: u32) -> f64 {
    if streak_days == 0 {
        return 1.0;
    }
    1.0 + (streak_days as f64 * 0.05).min(1.0)
}

/// Validate and cap solo XP grants (anti-cheat: max 100 XP per grant).
pub fn validate_xp_grant(amount: u32) -> u32 {
    amount.min(100)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_level_1() {
        assert_eq!(level_from_xp(0), 1);
        assert_eq!(level_from_xp(50), 1);
        assert_eq!(level_from_xp(99), 1);
    }

    #[test]
    fn test_xp_for_level_increases() {
        let l1 = xp_for_level(1);
        let l2 = xp_for_level(2);
        let l5 = xp_for_level(5);
        assert!(l2 > l1);
        assert!(l5 > l2);
    }

    #[test]
    fn test_streak_bonus_no_streak() {
        assert_eq!(streak_bonus(0), 1.0);
    }

    #[test]
    fn test_streak_bonus_capped() {
        let bonus = streak_bonus(50);
        assert!(bonus <= 2.0);
    }
}
