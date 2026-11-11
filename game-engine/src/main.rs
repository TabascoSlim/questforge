mod api;
mod engine;
mod models;
mod db;

use std::net::SocketAddr;
use std::sync::Arc;

use axum::Router;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tracing_subscriber::EnvFilter;

use db::redis::RedisClient;

#[derive(Clone)]
pub struct AppState {
    pub redis: Arc<RedisClient>,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .init();

    let redis_host = std::env::var("REDIS_HOST").unwrap_or_else(|_| "localhost".into());
    let redis_port = std::env::var("REDIS_PORT").unwrap_or_else(|_| "6379".into());
    let redis_url = format!("redis://{redis_host}:{redis_port}");

    let redis = Arc::new(RedisClient::connect(&redis_url).await);

    let state = AppState { redis };

    let app = Router::new()
        .merge(api::routes())
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let port = std::env::var("GAME_ENGINE_PORT").unwrap_or_else(|_| "8001".into());
    let addr: SocketAddr = format!("0.0.0.0:{port}").parse().expect("Invalid address");

    tracing::info!("Game engine starting on {addr}");
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
