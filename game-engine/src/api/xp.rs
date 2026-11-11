use axum::{Router, routing::post, extract::State, Json};
use serde_json::json;

use crate::AppState;
use crate::models::xp_event::GrantXpRequest;
use crate::engine::levels::check_level_up;
use crate::engine::xp::{streak_bonus, validate_xp_grant};

async fn grant_xp(
    State(state): State<AppState>,
    Json(req): Json<GrantXpRequest>,
) -> Json<serde_json::Value> {
    // Streak bonus: +5% XP per streak day, up to +100% (then capped by the anti-cheat limit)
    let streak = state.redis.get_current_streak(&req.user_id).await.unwrap_or(0);
    let bonus = streak_bonus(streak);
    let boosted = (req.amount as f64 * bonus).round() as u32;
    let capped_amount = validate_xp_grant(boosted);

    let previous_xp = state.redis.get_xp(&req.user_id).await.unwrap_or(0);
    let total_xp = state.redis.add_xp(&req.user_id, capped_amount).await.unwrap_or(previous_xp);
    if let Some(team_id) = req.team_id.as_deref() {
        let _ = state.redis.add_to_team_leaderboard(team_id, &req.user_id, capped_amount).await;
    }
    let (level, xp_in_level, xp_to_next, leveled_up) = check_level_up(previous_xp, total_xp);

    tracing::info!(
        "XP granted: user={} base={} streak={} bonus={:.2} granted={} total={} level={} leveled_up={}",
        req.user_id, req.amount, streak, bonus, capped_amount, total_xp, level, leveled_up
    );

    Json(json!({
        "user_id": req.user_id,
        "xp_granted": capped_amount,
        "streak_bonus": bonus,
        "total_xp": total_xp,
        "level": level,
        "xp_in_level": xp_in_level,
        "xp_to_next": xp_to_next,
        "leveled_up": leveled_up,
        "reason": req.reason,
    }))
}

async fn get_xp(
    State(state): State<AppState>,
    axum::extract::Path(user_id): axum::extract::Path<String>,
) -> Json<serde_json::Value> {
    let total_xp = state.redis.get_xp(&user_id).await.unwrap_or(0);

    Json(json!({
        "user_id": user_id,
        "total_xp": total_xp,
    }))
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/xp/grant", post(grant_xp))
        .route("/xp/:user_id", axum::routing::get(get_xp))
}
