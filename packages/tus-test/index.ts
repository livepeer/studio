/* eslint-disable */

import axios from "axios";
import fs from "fs";
import * as tus from "tus-js-client";

if (!process.env.LP_API_KEY) {
  throw new Error("Must set LP_API_KEY env var for calling /request-upload");
}

//const base = `/Users/victorges/workspace/test-videos/`;
//const filename = `rtm.mp4`;
const base = `/home/gioele/Downloads/`;
const filename = `bbbx3_720_2s.mp4`;
const path = base + filename;
const file = fs.createReadStream(path);
const { size } = fs.statSync(path);

async function doUpload() {
  const res = await axios({
    method: "POST",
    url: "http://localhost:3004/api/asset/request-upload",
    data: { name: "tus-test" },
    headers: {
      authorization: `Bearer ${process.env.LP_API_KEY}`,
    },
  });
  if (res.status !== 200) {
    throw new Error(
      `Failed to request upload status=${res.status} body=${res.data}`
    );
  }

  const upload = new tus.Upload(file, {
    endpoint: res.data.tusEndpoint,
    metadata: {
      filename,
      filetype: "video/mp4",
    },
    uploadSize: size,
    onError(error) {
      console.log(error);
      throw error;
    },
    onProgress(bytesUploaded, bytesTotal) {
      console.log(upload.url);
      const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
      console.log(bytesUploaded, bytesTotal, `${percentage}%`);
    },
    onSuccess() {
      console.log("Upload finished:", upload.url);
    },
  });
  /*upload.findPreviousUploads().then(function (previousUploads) {
      // Found previous uploads so we select the first one. 
      if (previousUploads.length) {
          upload.resumeFromPreviousUpload(previousUploads[0])
      }

      // Start the upload
      upload.start()
  })*/
}

doUpload().catch((err) => console.error("Error uploading:", err.message));
