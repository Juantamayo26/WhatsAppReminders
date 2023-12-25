use std::env;
mod models;
use std::error::Error;

use dotenv::dotenv;
use futures::future::join_all;
use models::reminders::Reminder;
use sqlx::MySqlPool;
use whatsapp_cloud_api::{
    models::{Message, Text},
    WhatasppClient,
};

async fn publish_whataspp_reminders(pool: &MySqlPool) -> Result<(), Box<dyn Error>> {
    let token = env::var("WHATSAPP_TOKEN").expect("WHATSAPP_TOKEN_NOT_FOUND");
    let phone_id = env::var("WHATSAPP_PHONE_ID").expect("WHATSAPP_PHONE_ID_NOT_FOUND");
    let whatsapp_client = WhatasppClient::new(token.as_str(), phone_id.as_str());
    let reminders = Reminder::get_reminders(pool).await?;

    println!("{:?}", reminders);

    // TODO: Change this to a template
    let messages: Vec<Message> = reminders
        .iter()
        .map(|reminder| {
            Message::from_text(
                &reminder.recipient_phone_number,
                Text {
                    body: reminder.message.clone(),
                    preview_url: None,
                },
            )
        })
        .collect();

    let response = join_all(
        messages
            .iter()
            .map(|message| whatsapp_client.send_message(message)),
    )
    .await;

    println!("{:?}", response);
    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    dotenv().ok();

    let url = env::var("DATABASE_URL").expect("DATABASE_URL_NOT_FOUND");
    let conn = MySqlPool::connect(&url).await?;

    publish_whataspp_reminders(&conn).await?;

    Ok(())
}
