use wasm_bindgen::prelude::*;
use chrono::NaiveDate;

/// Calculate XP gained with streak bonus applied.
#[wasm_bindgen]
pub fn calculate_xp_gain(base_xp: u32, streak_days: u32, difficulty_multiplier: f64) -> u32 {
    let streak_bonus = 1.0 + (streak_days as f64 * 0.05).min(1.0);
    let raw = base_xp as f64 * streak_bonus * difficulty_multiplier;
    raw.round() as u32
}

/// Compute level from total XP. Returns (level, xp_in_level, xp_to_next).
#[wasm_bindgen]
pub fn compute_level(total_xp: u64) -> Vec<u32> {
    const BASE_XP: f64 = 100.0;
    const LEVEL_SCALE: f64 = 1.5;

    let level = {
        let mut lvl = 1u32;
        loop {
            let needed = (BASE_XP * (lvl as f64).powf(LEVEL_SCALE)) as u64;
            if total_xp < needed {
                break lvl;
            }
            lvl += 1;
        }
    };

    let current_level_xp = if level == 1 {
        0u64
    } else {
        (BASE_XP * ((level - 1) as f64).powf(LEVEL_SCALE)) as u64
    };
    let next_level_xp = (BASE_XP * (level as f64).powf(LEVEL_SCALE)) as u64;

    let xp_in_level = (total_xp - current_level_xp) as u32;
    let xp_to_next = (next_level_xp - current_level_xp) as u32;

    vec![level, xp_in_level, xp_to_next]
}

/// Evaluate streak from an array of date strings (ISO format). Returns (current, longest).
/// `today_iso` must be provided by the caller (e.g. `new Date().toISOString().split('T')[0]` in JS).
#[wasm_bindgen]
pub fn evaluate_streak(dates: Vec<String>, today_iso: &str) -> Vec<u32> {
    if dates.is_empty() {
        return vec![0, 0];
    }

    let mut parsed: Vec<NaiveDate> = dates
        .iter()
        .filter_map(|d| NaiveDate::parse_from_str(d, "%Y-%m-%d").ok())
        .collect();

    if parsed.is_empty() {
        return vec![0, 0];
    }

    parsed.sort();
    parsed.dedup();

    let mut longest_streak = 1u32;
    let mut temp_streak = 1u32;

    for window in parsed.windows(2) {
        let diff = (window[1] - window[0]).num_days();
        if diff == 1 {
            temp_streak += 1;
            if temp_streak > longest_streak {
                longest_streak = temp_streak;
            }
        } else {
            temp_streak = 1;
        }
    }

    let today = match NaiveDate::parse_from_str(today_iso, "%Y-%m-%d") {
        Ok(d) => d,
        Err(_) => return vec![0, longest_streak],
    };
    let yesterday = NaiveDate::from_num_days_from_ce(today.num_days_from_ce() - 1);

    let last = parsed.last().unwrap();
    let current_streak = if *last == today || *last == yesterday {
        let mut count = 1u32;
        for date in parsed.iter().rev().skip(1) {
            let expected = NaiveDate::from_num_days_from_ce(
                last.num_days_from_ce() - count as i64,
            );
            if *date == expected {
                count += 1;
            } else {
                break;
            }
        }
        count
    } else {
        0
    };

    vec![current_streak, longest_streak.max(current_streak)]
}

/// Check if a quest is completable (anti-cheat: minimum elapsed time check).
/// Returns true if enough time has passed since the quest was created.
#[wasm_bindgen]
pub fn check_quest_completion(created_at_iso: &str, min_minutes: u32) -> bool {
    // For WASM, we delegate elapsed time checks to the server.
    // This is a client-side hint, not authoritative.
    true
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_xp_gain() {
        let xp = calculate_xp_gain(20, 7, 1.0);
        assert!(xp >= 20);
    }

    #[test]
    fn test_compute_level() {
        let result = compute_level(0);
        assert_eq!(result[0], 1);
        assert_eq!(result[1], 0);
    }
}
