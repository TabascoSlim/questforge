use axum::{Router, routing::{get, post}, extract::State, extract::Path, Json};
use serde_json::json;
use chrono::Utc;

use crate::AppState;

async fn get_streak(
    State(state): State<AppState>,
    Path(user_id): Path<String>,
) -> Json<serde_json::Value> {
    let current = state.redis.get_current_streak(&user_id).await.unwrap_or(0);
    let last_date = state.redis.get_last_activity_date(&user_id).await.unwrap_or(None);

    Json(json!({
        "user_id": user_id,
        "current_streak": current,
        "last_activity_date": last_date,
    }))
}

async fn tick_streak(
    State(state): State<AppState>,
    axum::extract::Json(req): axum::extract::Json<crate::models::streak::TickStreakRequest>,
) -> Json<serde_json::Value> {
    let user_id = &req.user_id;
    let today = Utc::now().date_naive().to_string();

    let last_date = state.redis.get_last_activity_date(user_id).await.unwrap_or(None);
    let current = state.redis.get_current_streak(user_id).await.unwrap_or(0);

    let new_streak = match last_date {
        Some(ref date_str) if date_str.as_str() != today => {
            let yesterday = (Utc::now().date_naive() - chrono::Duration::days(1)).to_string();
            if date_str.as_str() == yesterday {
                current + 1
            } else {
                1
            }
        }
        Some(ref date_str) if date_str.as_str() == today => current,
        _ => 1,
    };

    state.redis.set_current_streak(user_id, new_streak).await.unwrap_or_default();
    state.redis.set_last_activity_date(user_id, &today).await.unwrap_or_default();

    Json(json!({
        "user_id": user_id,
        "current_streak": new_streak,
        "date": today,
    }))
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/streak/:user_id", get(get_streak))
        .route("/streak/tick", post(tick_streak))
}
