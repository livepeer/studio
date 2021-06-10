import { PushTarget } from "../schema/types";
import Table from "./table";
import { GetOptions, WithId } from "./types";
import * as uuid from "uuid";
import { InternalServerError } from "./errors";

type DbPushTarget = WithId<PushTarget>;

interface PushTargetInput {
  name?: string;
  url: string;
  disabled?: boolean;
  userId: string;
}

const nameFromUrl = (url: string) => new URL(url).host;

export default class PushTargetTable extends Table<DbPushTarget> {
  async fillAndCreate(input: PushTargetInput) {
    const pushTarget: Required<PushTarget> = {
      id: uuid.v4(),
      name: input.name || nameFromUrl(input.url),
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
