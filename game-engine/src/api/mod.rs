pub mod xp;
pub mod levels;
pub mod streaks;
pub mod leaderboard;

use axum::Router;
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .merge(xp::routes())
        .merge(levels::routes())
        .merge(streaks::routes())
        .merge(leaderboard::routes())
}
