import { Connection } from "mysql2/promise";
import { UserDbStructure } from "./Users";
import { MessageDbStructure } from "./Messages";
import { ReminderDbStructure } from "./WhatsApp";

export type DbStructure =
  | UserDbStructure
  | MessageDbStructure
  | ReminderDbStructure;

export const saveStructures = async (
  structures: DbStructure[],
  tableName: string,
  session: Connection,
): Promise<any> => {
  return saveStructuresWithConflictKey(structures, tableName, "(id)", session);
};

export const saveStructuresWithConflictKey = async (
  structures: DbStructure[],
  tableName: string,
  onConflictStatement: string,
  session: Connection,
): Promise<any> => {
  if (structures.length === 0) {
    return;
  }

  const columns = Object.keys(structures[0])
    .map((key) => {
      return `${key}`;
    })
    .join(",");
  const conflict = Object.keys(structures[0])
    .map((key) => {
      return `${key} = VALUES(${key})`;
    })
    .join(",");

  try {
    const sql = `
        INSERT INTO ${tableName} (${columns})
        VALUES ${Array(structures.length).fill("(?)").join(",")}
        ON DUPLICATE KEY UPDATE
        ${conflict}
      `;
    const values = structures.map((structure) => {
      return Object.keys(structure).map((key) => {
        return (structure as any)[key];
      });
    });
    return session.query(sql, values);
  } catch (error) {
    console.log(
      "COULD_NOT_SAVE_DB_STRUCTURE",
      { tableName, onConflictStatement },
      error,
    );
  }
};
