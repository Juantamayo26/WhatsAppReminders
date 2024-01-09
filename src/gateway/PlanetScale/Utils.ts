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
      return `"${key}"`;
    })
    .join(",");
  // const conflict = Object.keys(structures[0])
  //   .map((key) => {
  //     return `"${key}" = excluded."${key}"`;
  //   })
  //   .join(",");
  try {
    const sql = format(
      `
        INSERT INTO ${tableName} (${columns})
        VALUES %L
      `,
      //         ON CONFLICT ${onConflictStatement} DO UPDATE
      //         SET ${conflict}
      structures.map((structure) => {
        return Object.keys(structure).map((key) => {
          return (structure as any)[key];
        });
      }),
    );
    console.log(sql);
    return session.query(sql);
  } catch (error) {
    console.log(
      "COULD_NOT_SAVE_DB_STRUCTURE",
      { tableName, onConflictStatement },
      error,
    );
  }
};
