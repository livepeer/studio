import { Router } from "express";
import { v4 as uuid } from "uuid";
import { db } from "../../store";
import { validatePost } from "../../middleware";
import { ethers } from "ethers";
import { makeNextHREF, toStringValues } from "../helpers";
import _ from "lodash";

const app = Router();

const DOMAIN = {
  name: "Verifiable Video",
  version: "1",
};

app.post("/", validatePost("attestation"), async (req, res) => {
  const { message, signature } = req.body;

  if (!verifySigner(message, signature)) {
    return res.status(400).json({ errors: ["invalid signature"] });
  }

  const attestationMetadata = await db.attestation.create({
    id: uuid(),
    createdAt: Date.now(),
    ...req.body,
  });

  // TODO: VID-214, pin to IPFS and add CID to Video Metadata
  return res.status(201).json(attestationMetadata);
});

function verifySigner(message, signature) {
  const types = {
    Video: [
      { name: "video", type: "string" },
      { name: "attestations", type: "Attestation[]" },
      { name: "timestamp", type: "uint256" },
    ],
    Attestation: [
      { name: "role", type: "string" },
      { name: "address", type: "address" },
    ],
  };

  const verifiedSigner = ethers.verifyTypedData(
    DOMAIN,
    types,
    message,
    signature
  );

  return verifiedSigner === message.signer;
}

app.get("/:id", async (req, res) => {
  const attestationMetadata = await db.attestation.get(req.params.id);
  if (!attestationMetadata) {
    res.status(404);
    return res.status(404).json({ errors: ["not found"] });
  }
  return res.status(200).json(attestationMetadata);
});

app.get("/", async (req, res) => {
  let { limit, cursor, count, creator } = toStringValues(req.query);
  if (isNaN(parseInt(limit))) {
    limit = undefined;
  }
  const query = [];
  if (creator) {
    query.push(
      `attestation.data->'message'->'attestations' @> '[{"role":"creator","address":"${creator}"}]'`
    );
  }
  const [output, newCursor] = await db.attestation.find(query, {
    limit,
    cursor,
    order: "data->>'createdAt' DESC",
    process: ({ data, count: c }) => {
      if (count) {
        res.set("X-Total-Count", c);
      }
      return data;
    },
  });
  res.status(200);
  if (output.length > 0 && newCursor) {
    res.links({ next: makeNextHREF(req, newCursor) });
  }

  return res.json(output);
});

export default app;
