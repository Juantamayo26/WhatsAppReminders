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

const TOKEN: &str = "EAAKUIMkAW2ABAIXRnfAaHkBtJjQ05ljcsULektPS0ZCzjW7466WIFjdY7mo7qK6bKjyvFWgNFUybZArFqbWT4dmuIjFZBmN7o7ZAU01yzrFgfYZCLUvANQPP1bNF4d8bZAL0U94dDmIhto8KtLRnmwNFm4WMfEkx6vwqDZCbDDKexcbSfDMZA9Hc";
const PHONE_ID: &str = "116482591391621";

async fn publish_whataspp_reminders(pool: &MySqlPool) -> Result<(), Box<dyn Error>> {
    let whatsapp_client = WhatasppClient::new(TOKEN, PHONE_ID);
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

    let url = env::var("DATABASE_URL").unwrap();
    let conn = MySqlPool::connect(&url).await?;

    publish_whataspp_reminders(&conn).await?;

    Ok(())
}
