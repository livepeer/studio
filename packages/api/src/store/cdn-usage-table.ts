import { DB } from "./db";
import logger from "../logger";
import uuid from "uuid/v4";

import { CdnDataRow } from "../schema/types";

export interface CdnUsageRowReq extends CdnDataRow {
  // filled in /api/cdn-data handler
  user_id: string;
  user_email: string;
}

export class CdnUsageTable {
  db: DB;

  constructor(db: DB) {
    this.db = db;
  }

  async makeTable() {
    await this.db.query(`
          CREATE TABLE IF NOT EXISTS cdn_usage_reg (
            date timestamp without time zone NOT NULL,
            region character varying(128) COLLATE pg_catalog."default" NOT NULL,
            playback_id character varying(128) COLLATE pg_catalog."default" NOT NULL,
            user_id character varying(128) COLLATE pg_catalog."default" NOT NULL,
            user_email character varying(512) COLLATE pg_catalog."default" NOT NULL,
            unique_users integer NOT NULL,
            total_filesize bigint NOT NULL,
            total_cs_bytes bigint NOT NULL,
            total_sc_bytes bigint NOT NULL,
            count integer NOT NULL,
            CONSTRAINT prim PRIMARY KEY (date, region, playback_id)
          );
        `);
    await this.db.query(`
        CREATE INDEX IF NOT EXISTS userind
          ON public.cdn_usage_reg USING hash
          (user_id COLLATE pg_catalog."default")
          TABLESPACE pg_default;
        `);
    await this.db.query(`
        CREATE INDEX IF NOT EXISTS playbackid
          ON public.cdn_usage_reg USING hash
          (playback_id COLLATE pg_catalog."default")
          TABLESPACE pg_default;
        `);

    logger.info(`Created table cdn_usage_reg`);
  }

  async addMany(
    date: number,
    region,
    fileName: string,
    rows: Array<CdnUsageRowReq>
  ): Promise<void> {
    const name = "cdn_usage_reg";
    const client = await this.db.pool.connect();
    const newId = uuid();
    console.log(
      `-----> add many date=${date} region=${region} fileName=${fileName}`
    );
    try {
      await client.query("BEGIN");
      for (const tdoc of rows) {
        await client.query(
          `INSERT INTO ${name} VALUES (to_timestamp($1), $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (date, region, playback_id)
          DO UPDATE SET 
              unique_users = ${name}.unique_users + EXCLUDED.unique_users,
              total_filesize = ${name}.total_filesize + EXCLUDED.total_filesize,
              total_cs_bytes = ${name}.total_cs_bytes + EXCLUDED.total_cs_bytes,
              total_sc_bytes = ${name}.total_sc_bytes + EXCLUDED.total_sc_bytes,
              count = ${name}.count + EXCLUDED.count;
          `,
          [
            date,
            region,
            tdoc.playback_id,
            tdoc.user_id,
            tdoc.user_email,
            tdoc.unique_users,
            tdoc.total_filesize,
            tdoc.total_cs_bytes,
            tdoc.total_sc_bytes,
            tdoc.count,
          ]
        );
      }
      await client.query(
        `INSERT INTO cdn_usage_last VALUES ($1, $2)
          ON CONFLICT ((data ->> 'region'::text) )
          DO UPDATE SET 
            data = EXCLUDED.data
      `,
        [newId, JSON.stringify({ region, fileName })]
      );
      await client.query("COMMIT");
    } catch (e) {
      logger.warn(`--> error, rolling back`);
      logger.info("--");
      await client.query("ROLLBACK");
      logger.warn(`--> error: ${e}`);
      if (e.message.includes("duplicate key value")) {
        // throw new BadRequestError(e.detail);
        // return new BadRequestError(e.detail);
      }
      throw e;
      // return e;
    } finally {
      client.release();
    }
    return;
  }
}
