// TODO: Automate deployments https://www.cargo-lambda.info/guide/automating-deployments.html
use std::env;
mod models;

use aws_config::BehaviorVersion;
use aws_lambda_events::event::cloudwatch_events::CloudWatchEvent;
use aws_sdk_dynamodb::Client as DynamoDbClient;
use dotenv::dotenv;
use futures::future::join_all;
use lambda_runtime::{run, service_fn, Error, LambdaEvent};
use models::reminders::Reminder;
use whatsapp_cloud_api::{
    models::{Component, Message, Parameter, Template},
    WhatasppClient,
};

async fn function_handler(_event: LambdaEvent<CloudWatchEvent>) -> Result<(), Error> {
    let config = aws_config::load_defaults(BehaviorVersion::latest()).await;
    let dynamodb_client = DynamoDbClient::new(&config);

    let token = env::var("WHATSAPP_TOKEN").expect("WHATSAPP_TOKEN_NOT_FOUND");
    let phone_id = env::var("WHATSAPP_PHONE_ID").expect("WHATSAPP_PHONE_ID_NOT_FOUND");
    let whatsapp_client = WhatasppClient::new(token.as_str(), phone_id.as_str());
    let reminders = Reminder::get_reminders(&dynamodb_client).await?;

    println!("Reminders: {:?}", reminders);

    let messages: Vec<Message> = reminders
        .iter()
        .map(|reminder| {
            let parameter = Parameter::from_text(&reminder.message.as_str());
            let component = Component::with_parameters("body", vec![parameter]);
            let template = Template::with_components("recordatorio", "es", vec![component]);
            Message::from_template(&reminder.recipient_phone_number, template)
        })
        .collect();

    // TODO: TOO MUCH REQUESTS
    let _response = join_all(
        messages
            .iter()
            .map(|message| whatsapp_client.send_message(message)),
    )
    .await;
    Reminder::mark_as_done(&reminders, &dynamodb_client).await?;

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
