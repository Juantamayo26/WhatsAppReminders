import mysql, { Connection } from "mysql2/promise";
import dotenv from "dotenv";

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
    throw error;
  } finally {
    connection.release();
  }
};

export const closePool = async () => {
  await pool.end();
};

export default pool;
