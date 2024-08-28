import mysql, { Connection } from "mysql2/promise";
import dotenv from "dotenv";
import { sendErrorLog } from "../../entities/TelegramLogger";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
const pool = mysql.createPool(databaseUrl!);

export const onSession = async <T>(
  operation: (connection: Connection) => Promise<T>,
) => {
  const connection = await pool.getConnection();
  try {
    await operation(connection);
  } catch (error) {
    sendErrorLog("COULD_NOT_OPEN_DB_CONNECTION", JSON.stringify(error)).catch();
    throw error;
  } finally {
    connection.release();
  }
};

export const closePool = async () => {
  await pool.end();
};

export default pool;
