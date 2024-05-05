import { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";

const dynamoDBRegion = "us-east-1";
let dynamoDBParameters: DynamoDBClientConfig = {
  credentials: {
    accessKeyId: "AKIAUVNPS2IK7QOJOA7Q",
    secretAccessKey: "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",
  },
  region: dynamoDBRegion,
};

export default dynamoDBParameters;
