import { DB } from "./db";
import logger from "../logger";

export class BillingTable {
  db: DB;

  constructor(db: DB) {
    this.db = db;
  }

  async makeTable() {
    await this.db.query(`
          CREATE TABLE IF NOT EXISTS hourly_billing_usage (
            user_id character varying(128) COLLATE pg_catalog."default" NOT NULL,
            usage_hour_ts timestamp without time zone NOT NULL,
            usage_hour_ms bigint NOT NULL,
            transcode_total_usage_minutes bigint NOT NULL,
            transcode_vod_usage_minutes bigint NOT NULL,
            transcode_stream_usage_minutes bigint NOT NULL,
            transcode_api_usage_minutes bigint NOT NULL,
            storage_usage_gbs bigint NOT NULL,
            delivery_usage_gbs bigint NOT NULL,

            CONSTRAINT prima PRIMARY KEY (user_id)
          );
        `);
    await this.db.query(`
        CREATE INDEX IF NOT EXISTS userind
          ON public.hourly_billing_usage USING hash
          (user_id COLLATE pg_catalog."default")
          TABLESPACE pg_default;
        `);

    logger.info(`Created table hourly_billing_usage`);
  }

  async getHourlyUsage(
    userId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<any> {
    if (!dateTo) {
      const now = new Date();
      dateTo = now.toISOString();
    }

    if (!dateFrom) {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      dateFrom = yesterday.toISOString();
    }

    const name = "hourly_billing_usage";
    const client = await this.db.pool.connect();
    const result = await client.query(
      `SELECT * FROM ${name} WHERE user_id = $1`,
      [userId]
    );
    const result2 = await client.query(
      `
      SELECT 
        SUM(transcode_total_usage_minutes),
        AVG(storage_usage_gbs),
        SUM(delivery_usage_gbs)
      FROM 
        hourly_billing_usage
      WHERE 
        usage_hour_ts BETWEEN $1 AND $2
        AND user_id = $3
    `,
      [dateFrom, dateTo, userId]
    );
    client.release();
    return result2.rows;
  }
}
