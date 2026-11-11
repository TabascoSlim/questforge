use axum::{Router, routing::get, extract::State, extract::Path, Json};
use serde_json::json;

use crate::AppState;
use crate::engine::xp::xp_progress;

async fn check_level(
    State(state): State<AppState>,
    Path(user_id): Path<String>,
) -> Json<serde_json::Value> {
    let total_xp = state.redis.get_xp(&user_id).await.unwrap_or(0);
    let (level, xp_in_level, xp_to_next) = xp_progress(total_xp);

    Json(json!({
        "user_id": user_id,
        "level": level,
        "xp_in_level": xp_in_level,
        "xp_to_next": xp_to_next,
        "leveled_up": false,
        "total_xp": total_xp,
    }))
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/level/:user_id", get(check_level))
}
