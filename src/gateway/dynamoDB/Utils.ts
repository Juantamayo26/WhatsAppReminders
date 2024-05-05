import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandInput,
} from "@aws-sdk/lib-dynamodb";
import dynamoDBParameters from "./DynamoDBParameters";
import { MessageDbStructure } from "../PlanetScale/Messages";
import { UserDbStructure } from "../PlanetScale/Users";

const marshallOptions = {
  convertEmptyValues: false,
  removeUndefinedValues: true,
  convertClassInstanceToMap: true,
};

const unmarshallOptions = {
  wrapNumbers: false,
};

const translateConfig = { marshallOptions, unmarshallOptions };
const dynamoClient = new DynamoDBClient(dynamoDBParameters);
export const dynamoDocumentClient = DynamoDBDocumentClient.from(
  dynamoClient,
  translateConfig,
);

type PayloadDBStructure = MessageDbStructure | UserDbStructure;

export const saveItem = async (
  tableName: string,
  payload: PayloadDBStructure,
) => {
  const itemToSave: PutCommandInput = {
    TableName: tableName,
    Item: payload,
  };

  try {
    await dynamoDocumentClient.send(new PutCommand(itemToSave));
  } catch (error) {
    console.log(error);
  }
};

export const saveItems = async (
  tableName: string,
  payloads: PayloadDBStructure[],
) => {
  const putRequests = payloads.map((payload) => ({
    PutRequest: {
      Item: payload,
    },
  }));

  const batchWriteParams = {
    RequestItems: {
      [tableName]: putRequests,
    },
  };

  try {
    await dynamoDocumentClient.send(new BatchWriteCommand(batchWriteParams));
  } catch (error) {
    console.log(error);
  }
};
