import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  CreateTableInput,
} from "@aws-sdk/client-dynamodb";
import dynamoDBParameters from "./DynamoDBParameters";

export const dynamoClient = new DynamoDBClient(dynamoDBParameters);

export const usersTable: CreateTableInput = {
  TableName: "UsersTable",
  AttributeDefinitions: [
    {
      AttributeName: "user",
      AttributeType: "S",
    },
  ],
  KeySchema: [
    {
      AttributeName: "user",
      KeyType: "HASH",
    },
  ],
  StreamSpecification: {
    StreamEnabled: false,
  },
  BillingMode: "PAY_PER_REQUEST",
};

export const messagesTable: CreateTableInput = {
  TableName: "MessagesTable",
  AttributeDefinitions: [
    {
      AttributeName: "id",
      AttributeType: "S",
    },
    {
      AttributeName: "user",
      AttributeType: "S",
    },
    {
      AttributeName: "created_at",
      AttributeType: "S",
    },
  ],
  KeySchema: [
    {
      AttributeName: "user",
      KeyType: "HASH",
    },
    {
      AttributeName: "id",
      KeyType: "RANGE",
    },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "messages-user-sort",
      KeySchema: [
        {
          AttributeName: "user",
          KeyType: "HASH",
        },
        {
          AttributeName: "created_at",
          KeyType: "RANGE",
        },
      ],
      Projection: {
        ProjectionType: "ALL",
      },
    },
  ],
  StreamSpecification: {
    StreamEnabled: false,
  },
  BillingMode: "PAY_PER_REQUEST",
};

export const remindersTable: CreateTableInput = {
  TableName: "RemindersTable",
  AttributeDefinitions: [
    {
      AttributeName: "id",
      AttributeType: "S",
    },
    {
      AttributeName: "user",
      AttributeType: "S",
    },
    {
      AttributeName: "reminder_at",
      AttributeType: "S",
    },
  ],
  KeySchema: [
    {
      AttributeName: "id",
      KeyType: "HASH",
    },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "UserReminderAtIndex",
      KeySchema: [
        {
          AttributeName: "user",
          KeyType: "HASH",
        },
        {
          AttributeName: "reminder_at",
          KeyType: "RANGE",
        },
      ],
      Projection: {
        ProjectionType: "ALL",
      },
    },
  ],
  BillingMode: "PAY_PER_REQUEST",
};

export const run = async () => {
  try {
    const data = await dynamoClient.send(
      new DescribeTableCommand({ TableName: "UsersTable" }),
    );
    console.log("TABLE_ALREADY_DEFINED", data.Table!.TableArn);
  } catch (err) {
    await dynamoClient.send(new CreateTableCommand(usersTable));
    await dynamoClient.send(new CreateTableCommand(messagesTable));
    await dynamoClient.send(new CreateTableCommand(remindersTable));
    // console.log("TABLE_CREATED", data);
  }
};

run();
