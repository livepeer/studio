import { Router } from "express";
import { db } from "../../store";
import { validatePost } from "../../middleware";
import { ethers } from "ethers";
import { makeNextHREF, toStringValues } from "../helpers";
import _ from "lodash";
import sql from "sql-template-strings";
import * as fcl from "@onflow/fcl";
import stringify from "fast-stable-stringify";
import { Attestation } from "../../schema/types";
import { taskScheduler } from "../../task/scheduler";

const app = Router();

const DOMAIN = {
  name: "Verifiable Video",
  version: "1",
};

const TYPES = {
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

app.post("/", validatePost("attestation"), async (req, res) => {
  const { message, signature, signatureType } = req.body;

  if (!verifyTimestamp(message.timestamp)) {
    return res.status(400).json({
      errors: [
        "message timestamp must be in the present or past, not in the future",
      ],
    });
  }
  const verfiedSignatureType = await verifySignature(
    message,
    signature,
    signatureType
  );
  if (!verfiedSignatureType) {
    return res.status(400).json({ errors: ["invalid signature"] });
  }

  let id: string;
  switch (verfiedSignatureType) {
    case "eip712":
      id = ethers.TypedDataEncoder.hash(DOMAIN, TYPES, message);
      break;
    case "flow":
      // Flow does not have any 'default' hashing mechanism, just use the standard ethers hashing
      id = ethers.hashMessage(stringify(message));
      break;
    default:
      throw new Error(`invalid signatureType: ${signatureType}`);
  }
  const attestationMetadata = await db.attestation.create({
    id,
    signatureType: verfiedSignatureType,
    createdAt: Date.now(),
    ...req.body,
  });

  const task = await taskScheduler.createAndScheduleTask("export-data", {
    "export-data": {
      ipfs: {},
      type: "attestation",
      id: attestationMetadata.id,
      content: toContent(attestationMetadata),
    },
  });

  attestationMetadata.storage = {
    status: {
      phase: "waiting",
      tasks: {
        pending: task.id,
      },
    },
  };

  db.attestation.update([sql`id = ${attestationMetadata.id}`], {
    storage: attestationMetadata.storage,
  });

  return res.status(201).json(attestationMetadata);
});

function toContent(attestation: Attestation): string {
  return JSON.stringify({
    domain: attestation.domain,
    primaryType: attestation.primaryType,
    message: attestation.message,
    signature: attestation.signature,
    signatureType: attestation.signatureType,
  });
}

async function verifySignature(
  message: any,
  signature: string,
  signatureType?: Attestation["signatureType"]
): Promise<string> {
  const verifiedEIP712 =
    (signatureType === "eip712" || !signatureType) &&
    verifyEIP712Signature(message, signature);
  const verifiedFlow =
    (signatureType === "flow" || !signatureType) &&
    (await verifyFlowSignature(message, signature));

  return verifiedEIP712 ? "eip712" : verifiedFlow ? "flow" : null;
}

function verifyEIP712Signature(message: any, signature: string): boolean {
  try {
    const verifiedSigner = ethers.verifyTypedData(
      DOMAIN,
      TYPES,
      message,
      signature
    );

    return verifiedSigner === message.signer;
  } catch (e) {
    return false;
  }
}

async function verifyFlowSignature(
  message: any,
  signature: string
): Promise<boolean> {
  try {
    const compSig = [
      {
        f_type: "CompositeSignature",
        f_vsn: "1.0.0",
        addr: message.signer,
        keyId: 0,
        signature: signature,
      },
    ];

    return await fcl.AppUtils.verifyUserSignatures(
      Buffer.from(stringify(message)).toString("hex"),
      compSig
    );
  } catch (e) {
    return false;
  }
}

function verifyTimestamp(timestamp: number): boolean {
  return Date.now() - timestamp >= 0;
}

app.get("/:id", async (req, res) => {
  const attestationMetadata = await db.attestation.getByIdOrCid(req.params.id);
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
