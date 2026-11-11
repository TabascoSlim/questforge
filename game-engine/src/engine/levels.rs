use crate::engine::xp::{level_from_xp, xp_for_level, xp_progress};

/// Determine if a level-up occurred and return new level info.
pub fn check_level_up(previous_total_xp: u64, new_total_xp: u64) -> (u32, u32, u32, bool) {
    let prev_level = level_from_xp(previous_total_xp);
    let (new_level, xp_in_level, xp_to_next) = xp_progress(new_total_xp);
    let leveled_up = new_level > prev_level;
    (new_level, xp_in_level, xp_to_next, leveled_up)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_check_level_up_no_change() {
        let (level, _, _, leveled_up) = check_level_up(50, 50);
        assert_eq!(level, 1);
        assert!(!leveled_up);
    }

    #[test]
    fn test_check_level_up_occurs() {
        let xp_for_level_3 = xp_for_level(2); // XP needed to reach level 3
        let (level, _, _, leveled_up) = check_level_up(xp_for_level_3 - 10, xp_for_level_3 + 10);
        assert!(level >= 3);
        assert!(leveled_up);
    }
}
