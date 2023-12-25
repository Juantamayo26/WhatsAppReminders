import { Connection, RowDataPacket } from "mysql2/promise";
import { User } from "../../entities/User";

interface UserDbStructure {
  id: string;
  recipient_phone_number: string;
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
  const columns = Object.keys(userStructure)
    .map((key) => {
      return `${key}`;
    })
    .join(",");
  const query = `INSERT INTO users (${columns}) VALUES (?, ?, ?, ?, ?, ?)`;
  const values = Object.keys(userStructure).map((key) => {
    return (userStructure as any)[key];
  });
  await connection.query(query, values);
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

const getUserStructure = (user: User): UserDbStructure => {
  return {
    id: user.getId(),
    recipient_phone_number: user.getRecipientPhoneNumber(),
    active: user.getActive(),
    created_at: user.getCreatedAt(),
    thread_id: user.getThreadId(),
    time_zone: user.getTimeZone(),
  };
};

const buildUserFromRow = (user: any): User => {
  return User.loadUser(
    user.id,
    user.recipient_phone_number,
    user.active,
    user.created_at,
    user.thread_id,
    user.time_zone,
  );
};
