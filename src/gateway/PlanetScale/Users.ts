import { Connection, RowDataPacket } from "mysql2/promise";
import { User } from "../../entities/User";
import { saveStructures } from "./Utils";

export interface UserDbStructure {
  user: string;
  active: boolean;
  created_at: string;
  thread_id: string | null;
  time_zone: string;
}

export const saveUser = async (
  user: User,
  connection: Connection,
): Promise<void> => {
  const userStructure = getUserStructure(user);
  return saveStructures([userStructure], "users", connection);
};

export const getUserByPhoneNumber = async (
  recipientPhoneNumber: string,
  connection: Connection,
): Promise<User | null> => {
  const query = `SELECT * FROM users WHERE recipient_phone_number = ? and active = 1`;
  const [rows] = await connection.query<RowDataPacket[]>(query, [
    recipientPhoneNumber,
  ]);

  if (rows.length === 0) {
    return null;
  }

  return buildUserFromRow(rows[0]);
};

export const getUserStructure = (user: User): UserDbStructure => {
  return {
    user: user.getId(),
    active: user.getActive(),
    created_at: user.getCreatedAt().toISOString(),
    thread_id: user.getThreadId(),
    time_zone: user.getTimeZone(),
  };
};

export const buildUserFromRow = (row: any): User => {
  return User.loadUser(
    row.user,
    row.active,
    new Date(row.created_at),
    row.thread_id,
    row.time_zone,
  );
};
