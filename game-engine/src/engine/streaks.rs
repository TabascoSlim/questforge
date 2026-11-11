use chrono::{NaiveDate, Datelike, Utc};

/// Evaluate a streak from a list of activity dates.
pub fn evaluate_streak(dates: &[NaiveDate]) -> (u32, u32) {
    if dates.is_empty() {
        return (0, 0);
    }

    let mut sorted = dates.to_vec();
    sorted.sort();
    sorted.dedup();

    let today = Utc::now().date_naive();

    let mut longest_streak = 1u32;
    let mut temp_streak = 1u32;

    for window in sorted.windows(2) {
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

    let last_date = sorted.last().unwrap();
    let yesterday = today.pred_opt().unwrap_or(today);

    let current_streak = if *last_date == today || *last_date == yesterday {
        let mut count = 1u32;
        for date in sorted.iter().rev().skip(1) {
            let diff_days = count as i64;
            if let Some(expected) = NaiveDate::from_num_days_from_ce_opt(
                last_date.num_days_from_ce() - diff_days as i32,
            ) {
                if *date == expected {
                    count += 1;
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        count
    } else {
        0
    };

    if longest_streak < current_streak {
        longest_streak = current_streak;
    }

    (current_streak, longest_streak)
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::NaiveDate;

    #[test]
    fn test_empty() {
        assert_eq!(evaluate_streak(&[]), (0, 0));
    }

    #[test]
    fn test_consecutive_days() {
        let d1 = NaiveDate::from_ymd_opt(2026, 5, 9).unwrap();
        let d2 = NaiveDate::from_ymd_opt(2026, 5, 10).unwrap();
        let d3 = NaiveDate::from_ymd_opt(2026, 5, 11).unwrap();
        assert_eq!(evaluate_streak(&[d1, d2, d3]), (3, 3));
    }
}
