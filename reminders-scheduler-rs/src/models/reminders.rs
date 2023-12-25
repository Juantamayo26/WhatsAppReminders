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
    pub done: bool,
}

impl Reminder {
    pub async fn get_reminders(pool: &MySqlPool) -> Result<Vec<Reminder>, sqlx::Error> {
        let reminders = sqlx::query_as(
            r#"
            SELECT * 
            FROM reminders 
            JOIN users ON users.id = reminders.user
            WHERE done = 0 AND reminder_at < NOW()"#,
        )
        .fetch_all(pool)
        .await?;

        Ok(reminders)
    }

    // pub async fn update_status(reminders: Vec<Self>, pool: &MySqlPool) -> Result<(), sqlx::Error> {
    //     let ids: Vec<String> = reminders.iter().map(|i| i.id).collect();
    //     sqlx::query(
    //         r#"
    //         UPDATE reminders
    //         SET done = (every IS NULL)
    //         WHERE id = ANY($1)"#)
    //     .bind(&ids)
    //     .execute(pool)
    //     .await?;
    //     Ok(())
    // }
}
