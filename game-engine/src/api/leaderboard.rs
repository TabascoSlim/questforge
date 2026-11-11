use axum::{Router, routing::get, extract::{State, Query}, Json};
use serde::Deserialize;
use serde_json::json;

use crate::AppState;

#[derive(Debug, Deserialize)]
pub struct LeaderboardParams {
    limit: Option<usize>,
    team_id: Option<String>,
}

async fn get_leaderboard(
    State(state): State<AppState>,
    Query(params): Query<LeaderboardParams>,
) -> Json<serde_json::Value> {
    let limit = params.limit.unwrap_or(10);

    let entries = if let Some(team_id) = &params.team_id {
        state.redis.get_team_leaderboard(team_id, limit).await.unwrap_or_default()
    } else {
        state.redis.get_leaderboard(limit).await.unwrap_or_default()
    };

    let results: Vec<serde_json::Value> = entries
        .into_iter()
        .map(|(user_id, score)| {
            json!({
                "user_id": user_id,
                "total_xp": score as u64,
            })
        })
        .collect();

    Json(json!({ "leaderboard": results }))
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/leaderboard", get(get_leaderboard))
}
