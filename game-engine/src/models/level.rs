use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LevelResponse {
    pub user_id: String,
    pub level: u32,
    pub xp_in_level: u32,
    pub xp_to_next: u32,
    pub leveled_up: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LevelConfig {
    pub level: u32,
    pub xp_required: u64,
}
