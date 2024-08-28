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
import { sendErrorLog } from "../../entities/TelegramLogger";

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
    sendErrorLog("COULD_NOT_SAVE_DB_STRUCTURE", JSON.stringify(error)).catch();
    console.log("COULD_NOT_SAVE_DB_STRUCTURE", error);
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
    sendErrorLog("COULD_NOT_SAVE_DB_STRUCTURES", JSON.stringify(error)).catch();
    console.log(error);
  }
};
