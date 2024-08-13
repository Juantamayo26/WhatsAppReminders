use sqlx::{
    types::chrono::{DateTime, Utc},
    FromRow, MySqlPool,
};

#[derive(Debug, FromRow)]
pub struct Reminder {
    pub id: String,
    pub reminder_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub message: String,
    pub user: String,
    pub recipient_phone_number: String,
    pub done: i8,
}

impl Reminder {
    pub async fn get_reminders(pool: &MySqlPool) -> Result<Vec<Reminder>, sqlx::Error> {
        let reminders = sqlx::query_as!(
            Reminder,
            r#"
            SELECT 
                reminders.id AS id, 
                reminder_at, 
                reminders.created_at, 
                message, 
                users.id AS user, 
                recipient_phone_number, 
                done
            FROM reminders 
            JOIN users ON users.id = reminders.user
            WHERE done = 0 AND reminder_at < NOW()"#,
        )
        .fetch_all(pool)
        .await?;

        Ok(reminders)
    }

    pub async fn mark_as_done(reminders: &Vec<Self>, pool: &MySqlPool) -> Result<(), sqlx::Error> {
        if reminders.is_empty() {
            return Ok(());
        }

        let params = format!("?{}", ", ?".repeat(reminders.len() - 1));
        let query_str = format!("UPDATE reminders SET done = 1 WHERE id IN ( { } )", params);

        let mut query = sqlx::query(&query_str);
        for i in reminders {
            query = query.bind(i.id.clone());
        }

        query.execute(pool).await?;

        Ok(())
    }
}
