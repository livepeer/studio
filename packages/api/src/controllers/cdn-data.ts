import { authMiddleware } from "../middleware";
import { validatePost } from "../middleware";
import { Response, Router } from "express";
import { db } from "../store";
import logger from "../logger";
import { User, CdnDataPayload } from "../schema/types";
import { CdnUsageRowReq } from "../store/cdn-usage-table";

const app = Router();

// interface SendData {
//   date: number;
//   region: string;
//   file_name: string;
//   data: Array<CdnUsageRowReq>;
// }

app.get("/region/:region", authMiddleware({}), async (req, res) => {
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
});

app.post(
  "/",
  authMiddleware({}),
  validatePost("cdn-data-payload"),
  async (req, res) => {
    const usersCache = new Map();
    const getUser = async (playbackId: string): Promise<User | null> => {
      if (usersCache.has(playbackId)) {
        return usersCache.get(playbackId);
      }
      const stream = await db.stream.getByPlaybackId(playbackId);
      if (!stream) {
        logger.error(`Can't find stream for playbackId=${playbackId}`);
        return null;
      }
      const user = await db.user.get(stream.userId);
      if (!user) {
        logger.error(`Can't find user for playbackId=${playbackId}`);
        return null;
      }
      usersCache.set(playbackId, user);
      return user;
    };

    const start = Date.now();
    const dataAr = req.body as CdnDataPayload;
    console.log("Got data: ", JSON.stringify(dataAr, null, 2));
    if (!Array.isArray(dataAr)) {
      res.status(400);
      res.end();
      return;
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
          const user = await getUser(row.playback_id);
          if (user) {
            const urow = row as CdnUsageRowReq;
            urow.user_id = user.id;
            urow.user_email = user.email;
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
            const user = await getUser(row.playback_id);
            if (user) {
              const urow = row as CdnUsageRowReq;
              urow.user_id = user.id;
              urow.user_email = user.email;
            }
          }
        }
      }
      // insert data into db
      // @ts-ignore
      const udata = data.data as Array<CdnUsageRowReq>;

      const rows = udata.filter((obj) => obj.playback_id && obj.user_id);
      const badRows = udata.filter((obj) => !obj.playback_id);
      console.log(`==> bad rows:`, JSON.stringify(badRows, null, 2));
      const badRows2 = udata.filter((obj) => !obj.user_id);
      console.log(`==> bad rows 2:`, JSON.stringify(badRows2, null, 2));
      console.log(`==> good rows:`, JSON.stringify(rows, null, 2));
      const err = await db.cdnUsageTable.addMany(
        data.date,
        data.region,
        data.file_name,
        rows
      );
      /*
      if (err) {
        logger.error(`Error saving row to db hour=${hour} err=${err}`);
        res.status(500);
        res.end(`${err}`);
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
  }
);

export default app;
