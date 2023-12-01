import { Pool } from "mysql2/promise";

export const saveReminder = async (pool: Pool): Promise<void> => {
  const result = await pool.query("SELECT 1");
};
