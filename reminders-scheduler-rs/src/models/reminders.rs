use aws_sdk_dynamodb::{types::AttributeValue, Client as DynamoDbClient, Error as DynamoDbError};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
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
    pub async fn get_reminders(client: &DynamoDbClient) -> Result<Vec<Reminder>, DynamoDbError> {
        let now = Utc::now().to_rfc3339();
        let result = client
            .scan()
            .table_name("RemindersTable")
            .filter_expression("done = :done AND reminder_at <= :now")
            .expression_attribute_values(":done", AttributeValue::Bool(false))
            .expression_attribute_values(":now", AttributeValue::S(now))
            .send()
            .await?;

        let reminders = result
            .items
            .unwrap_or_default()
            .into_iter()
            .filter_map(|item| {
                Some(Reminder {
                    id: item.get("id")?.as_s().ok()?.to_string(),
                    reminder_at: parse_datetime(item.get("reminder_at")?.as_s().ok()?).ok()?,
                    created_at: parse_datetime(item.get("created_at")?.as_s().ok()?).ok()?,
                    message: item.get("message")?.as_s().ok()?.to_string(),
                    user: item.get("user")?.as_s().ok()?.to_string(),
                    recipient_phone_number: item.get("user")?.as_s().ok()?.to_string(),
                    done: item.get("done")?.as_bool().ok()?.to_owned(),
                })
            })
            .collect();

        println!("Parsed reminders: {:?}", reminders);
        Ok(reminders)
    }

    pub async fn mark_as_done(
        reminders: &Vec<Self>,
        client: &DynamoDbClient,
    ) -> Result<(), DynamoDbError> {
        for reminder in reminders {
            client
                .update_item()
                .table_name("RemindersTable")
                .key("id", AttributeValue::S(reminder.id.clone()))
                .update_expression("SET done = :done")
                .expression_attribute_values(":done", AttributeValue::Bool(true))
                .send()
                .await?;
        }

        Ok(())
    }
}

fn parse_datetime(dt_str: &str) -> Result<DateTime<Utc>, chrono::ParseError> {
    DateTime::parse_from_rfc3339(dt_str)
        .map(|dt| dt.with_timezone(&Utc))
}
