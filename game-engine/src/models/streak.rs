use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StreakResponse {
    pub user_id: String,
    pub current_streak: u32,
    pub longest_streak: u32,
    pub last_activity_date: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TickStreakRequest {
    pub user_id: String,
}
