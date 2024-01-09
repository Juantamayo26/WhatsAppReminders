import { Connection, format } from "mysql2/promise";
import { UserDbStructure } from "./Users";
import { MessageDbStructure } from "./Messages";

export type DbStructure = UserDbStructure | MessageDbStructure;

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

  // structures.forEach((structure) => {
  //   (structure as any).updated_at = moment.utc().toDate();
  // });

  const columns = Object.keys(structures[0])
    .map((key) => {
      return `${key}`;
    })
    .join(",");

  const valueFields = `(${Array(columns.length).fill("?").join(",")})`;
  try {
    const sql = `
        INSERT INTO ${tableName} (${columns})
        VALUES ${valueFields}
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
