use redis::{AsyncCommands, RedisError};
use tokio::sync::Mutex;

pub struct RedisClient {
    conn: Mutex<redis::aio::ConnectionManager>,
}

impl RedisClient {
    pub async fn connect(url: &str) -> Self {
        let client = redis::Client::open(url).expect("Invalid Redis URL");
        let mut attempt = 1;
        loop {
            match client.get_connection_manager().await {
                Ok(conn) => return Self { conn: Mutex::new(conn) },
                Err(err) if attempt < 15 => {
                    tracing::warn!("Redis not ready (attempt {attempt}/15): {err}");
                    attempt += 1;
                    tokio::time::sleep(std::time::Duration::from_secs(2)).await;
                }
                Err(err) => panic!("Failed to connect to Redis: {err}"),
            }
        }
    }

    pub async fn get_xp(&self, user_id: &str) -> Result<u64, RedisError> {
        let key = format!("xp:{user_id}");
        let mut conn = self.conn.lock().await;
        let val: Option<u64> = conn.get(&key).await?;
        Ok(val.unwrap_or(0))
    }

    pub async fn add_xp(&self, user_id: &str, amount: u32) -> Result<u64, RedisError> {
        let key = format!("xp:{user_id}");
        let mut conn = self.conn.lock().await;
        let total: u64 = conn.incr(&key, amount as u64).await?;
        let _: () = conn.zincr("leaderboard:global", user_id, amount as f64).await?;
        Ok(total)
    }

    pub async fn get_current_streak(&self, user_id: &str) -> Result<u32, RedisError> {
        let key = format!("streak:{user_id}:current");
        let mut conn = self.conn.lock().await;
        let val: Option<u32> = conn.get(&key).await?;
        Ok(val.unwrap_or(0))
    }

    pub async fn set_current_streak(&self, user_id: &str, streak: u32) -> Result<(), RedisError> {
        let mut conn = self.conn.lock().await;
        let key = format!("streak:{user_id}:current");
        conn.set::<_, _, ()>(&key, streak).await?;
        let longest_key = format!("streak:{user_id}:longest");
        let longest: Option<u32> = conn.get(&longest_key).await?;
        if longest.unwrap_or(0) < streak {
            let _: () = conn.set::<_, _, ()>(&longest_key, streak).await?;
        }
        Ok(())
    }

    pub async fn get_last_activity_date(&self, user_id: &str) -> Result<Option<String>, RedisError> {
        let key = format!("streak:{user_id}:last_date");
        let mut conn = self.conn.lock().await;
        conn.get(&key).await
    }

    pub async fn set_last_activity_date(&self, user_id: &str, date: &str) -> Result<(), RedisError> {
        let key = format!("streak:{user_id}:last_date");
        let mut conn = self.conn.lock().await;
        conn.set::<_, _, ()>(&key, date).await
    }

    pub async fn get_leaderboard(&self, limit: usize) -> Result<Vec<(String, f64)>, RedisError> {
        let mut conn = self.conn.lock().await;
        let results: Vec<(String, f64)> = conn
            .zrevrange_withscores("leaderboard:global", 0, limit as isize - 1)
            .await?;
        Ok(results)
    }

    pub async fn add_to_team_leaderboard(&self, team_id: &str, user_id: &str, xp: u32) -> Result<(), RedisError> {
        let key = format!("leaderboard:team:{team_id}");
        let mut conn = self.conn.lock().await;
        let _: () = conn.zincr(&key, user_id, xp as f64).await?;
        Ok(())
    }

    pub async fn get_team_leaderboard(&self, team_id: &str, limit: usize) -> Result<Vec<(String, f64)>, RedisError> {
        let key = format!("leaderboard:team:{team_id}");
        let mut conn = self.conn.lock().await;
        let results: Vec<(String, f64)> = conn
            .zrevrange_withscores(&key, 0, limit as isize - 1)
            .await?;
        Ok(results)
    }
}
