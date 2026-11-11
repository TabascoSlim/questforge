use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GrantXpRequest {
    pub user_id: String,
    pub amount: u32,
    pub reason: String,
    #[serde(default)]
    pub team_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GrantXpResponse {
    pub user_id: String,
    pub xp_granted: u32,
    pub total_xp: u64,
    pub reason: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct XpEntry {
    pub user_id: String,
    pub amount: u32,
    pub reason: String,
    pub timestamp: i64,
}
