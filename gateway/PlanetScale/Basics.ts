import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
const pool = mysql.createPool(databaseUrl!);

export default pool;
