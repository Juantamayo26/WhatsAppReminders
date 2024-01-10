// TODO: Automate deployments https://www.cargo-lambda.info/guide/automating-deployments.html
use std::env;
mod models;

use aws_lambda_events::event::cloudwatch_events::CloudWatchEvent;
use dotenv::dotenv;
use futures::future::join_all;
use lambda_runtime::{run, service_fn, Error, LambdaEvent};
use models::reminders::Reminder;
use sqlx::MySqlPool;
use whatsapp_cloud_api::{
    models::{Message, Text},
    WhatasppClient,
};

async fn function_handler(_event: LambdaEvent<CloudWatchEvent>) -> Result<(), Error> {
    let url = env::var("DATABASE_URL").expect("DATABASE_URL_NOT_FOUND");
    let pool = MySqlPool::connect(&url).await?;

    let token = env::var("WHATSAPP_TOKEN").expect("WHATSAPP_TOKEN_NOT_FOUND");
    let phone_id = env::var("WHATSAPP_PHONE_ID").expect("WHATSAPP_PHONE_ID_NOT_FOUND");
    let whatsapp_client = WhatasppClient::new(token.as_str(), phone_id.as_str());
    let reminders = Reminder::get_reminders(&pool).await?;

    // println!("REMINDERS: {:?}", reminders);

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

    // TODO: TOO MUCH REQUESTS
    let _response = join_all(
        messages
            .iter()
            .map(|message| whatsapp_client.send_message(message)),
    )
    .await;
    Reminder::mark_as_done(&reminders, &pool).await?;

    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    dotenv().ok();

    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        // disable printing the name of the module in every log line.
        .with_target(false)
        // disabling time is handy because CloudWatch will add the ingestion time.
        .without_time()
        .init();

    run(service_fn(function_handler)).await
}
