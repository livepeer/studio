import { SQLStatement } from "sql-template-strings";

import { authMiddleware } from "../middleware";
import { validatePost } from "../middleware";
import { Response, Router } from "express";
import { db } from "../store";
import { FindOptions, FindQuery } from "../store/types";
import logger from "../logger";
import uuid from "uuid/v4";
import {
  User,
} from "../schema/types";

// import { CdnUsage, CdnUsageLast } from "../schema/types";

// import { CdnUsageRow } from "../store/types";

const app = Router();

interface CdnUsageRowReq {
  stream_id: string;
  playback_id: string;
  unique_users: number;
  total_filesize: number;
  total_cs_bytes: number;
  total_sc_bytes: number;
  count: number;
  // filled in /api/cdn-data handler
  user_id: string;
  user_email: string;
}

interface SendData {
  date: number;
  region: string;
  file_name: string;
  data: Array<CdnUsageRowReq>;
}

async function addMany(
  date: number,
  region,
  fileName: string,
  rows: Array<CdnUsageRowReq>
): Promise<Error> {
  const name = "cdn_usage_reg";
  const client = await db.pool.connect();
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
    // throw e;
    return e;
  } finally {
    client.release();
  }
  return null;
}

app.get(
  "/region/:region",
  //  authMiddleware({}),
  async (req, res) => {
    const { region } = req.params;
    if (!region) {
      res.status(400);
      return res.end();
    }
    const [docs] = await db.cdnUsageLast.find({ region: req.params.region });
    if (!docs?.length) {
      res.status(204);
      return res.end();
    }
    res.status(200);
    res.json(docs[0]);
  }
);

app.post(
  "/",
  //   authMiddleware({}),
  // validatePost("stream"),
  async (req, res) => {
    // if (!req.body || !req.body.name) {
    //     res.status(422);
    //     return res.json({
    //         errors: ["missing name"],
    //     });
    // }
    const usersCache = new Map()
    const getUser = async (playbackId: string): Promise<User | null> => {
      if (usersCache.has(playbackId)) {
        return usersCache.get(playbackId)
      }
      const stream = await db.stream.getByPlaybackId(playbackId)
      if (!stream) {
        logger.error(`Can't find stream for playbackId=${playbackId}`)
        return null
      }
      const user = await db.user.get(stream.userId)
      if (!user) {
        logger.error(`Can't find user for playbackId=${playbackId}`)
        return null
      }
      usersCache.set(playbackId, user)
      return user
    }


    const start = Date.now();
    const dataAr = req.body as Array<SendData>;
    console.log("Got data: ", JSON.stringify(dataAr, null, 2));
    if (!Array.isArray(dataAr)) {
      res.status(400);
      res.end();
    }
    for (const data of dataAr) {
      const hour = new Date(data.date * 1000).toUTCString();
      if (!data.data?.length) {
        continue;
      }
      // aggregate stream_ids into playback_ids
      for (const row of data.data) {
        // console.log(`===> checking row `, row)
        if (row.playback_id) {
          const user = await getUser(row.playback_id)
          if (user) {
            row.user_id = user.id
            row.user_email = user.email
          }
        }
        if (row.stream_id) {
          // find playbackId by streamId
          let stream = await db.stream.get(row.stream_id);
          if (!stream) {
            logger.error(`Invalid stream_id=${row.stream_id} in hour=${hour}`);
            continue;
          }
          if (!stream.playbackId && stream.parentId) {
            stream = await db.stream.get(stream.parentId);
          }
          if (!stream) {
            logger.error(
              `Invalid stream_id=${stream.parentId} in hour=${hour}`
            );
            continue;
          }
          if (!stream.playbackId) {
            logger.error(
              `For stream_id=${stream.parentId} in hour=${hour} can't find playbackId.`
            );
            continue;
          }
          const playbackRow = data.data.find(
            (row) => row.playback_id === stream.playbackId
          );
          if (playbackRow) {
            playbackRow.count += row.count;
            playbackRow.total_cs_bytes += row.total_cs_bytes;
            playbackRow.total_sc_bytes += row.total_sc_bytes;
            playbackRow.total_filesize += row.total_filesize;
            playbackRow.unique_users += row.unique_users;
          } else {
            row.playback_id = stream.playbackId;
            row.stream_id = null;
            const user = await getUser(row.playback_id)
            if (user) {
              row.user_id = user.id
              row.user_email = user.email
            }
          }
        }
      }
      // insert data into db
      // @ts-ignore
      const rows = data.data.filter((obj) => obj.playback_id);
      const badRows = data.data.filter((obj) => !obj.playback_id);
      console.log(`==> bad rows:`, JSON.stringify(badRows, null, 2))
      const badRows2 = data.data.filter((obj) => !obj.user_id);
      console.log(`==> bad rows 2:`, JSON.stringify(badRows2, null, 2))
      console.log(`==> good rows:`, JSON.stringify(rows, null, 2))
      const err = await addMany(data.date, data.region, data.file_name, rows);
      if (err) {
        logger.error(`Error saving row to db hour=${hour} err=${err}`);
        process.exit(1);
        throw "fuckk";
      }
      /*
      for (const row of data.data) {
        if (row.stream_id) {
          continue;
        }
        // console.log(`-----> inserting `, row)
        await db.cdnUsage.create({
          id: uuid(),
          date: data.date * 1000,
          region: data.region,
          playbackId: row.playback_id,
          totalCsBytes: row.total_cs_bytes,
          totalFileSize: row.total_filesize,
          totalScBytes: row.total_sc_bytes,
          uniqueUsers: row.unique_users,
          count: row.count,
        })
        const err = await db.cdnUsageRegular.add({
          date: data.date,
          region: data.region,
          ...row,
        })
        if (err) {
          logger.error(`Error saving row to db hour=${hour} err=${err}`)
          process.exit(1)
          throw ('fuckk')
        }
      }
      */
    }

    const regions = dataAr.reduce((a, v) => [...a, v.region], []);
    const hours = dataAr.reduce((a, v) => [...a, v.date], []);
    logger.info(
      `done regions=${regions} hours=${hours} elapsed=${Date.now() - start}ms`
    );

    res.status(200);
    res.end();
    // if (output.length > 0 && newCursor) {
    //   res.links({ next: makeNextHREF(req, newCursor) });
    // }
    // res.json(output);
  }
);

export default app;
