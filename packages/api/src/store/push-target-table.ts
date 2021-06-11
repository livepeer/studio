import { PushTarget } from "../schema/types";
import Table from "./table";
import { GetOptions, WithId } from "./types";
import * as uuid from "uuid";
import { InternalServerError, UnprocessableEntityError } from "./errors";

type DbPushTarget = WithId<PushTarget>;

interface PushTargetInput {
  name?: string;
  url: string;
  disabled?: boolean;
  userId: string;
}

const parseUrl = (url: string) => {
  try {
    return new URL(url);
  } catch (err) {
    throw new UnprocessableEntityError(`Bad URL ${url}: ${err}`);
  }
};

export default class PushTargetTable extends Table<DbPushTarget> {
  async fillAndCreate(input: PushTargetInput) {
    const url = parseUrl(input.url);
    const pushTarget: Required<PushTarget> = {
      id: uuid.v4(),
      name: input.name || url.host,
      url: input.url,
      disabled: input.disabled ?? false,
      userId: input.userId,
      createdAt: Date.now(),
    };
    await super.create(pushTarget);

    const created = await this.get(pushTarget.id, { useReplica: false });
    if (!created) {
      throw new InternalServerError("error creating new push target");
    }
    return created;
  }

  async create(doc: DbPushTarget) {
    throw new Error("Unimplemented API, use fillAndCreate instead");
    return doc;
  }

  async getAuthed(
    id: string,
    userId: string,
    isAdmin: boolean,
    opts?: GetOptions
  ) {
    const pushTarget = await super.get(id, opts);
    return isAdmin || userId === pushTarget?.userId ? pushTarget : null;
  }

  async hasAccess(id: string, userId: string, isAdmin: boolean = false) {
    return !!(await this.getAuthed(id, userId, isAdmin));
  }
}
