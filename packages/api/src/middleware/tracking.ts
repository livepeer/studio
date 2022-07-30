import { ApiToken } from "../schema/types";
import { db } from "../store";

class Tracker {
  recordToken({ id }: ApiToken) {
    Promise.resolve().then(async () => {
      try {
        await db.apiToken.update(id, { lastSeen: Date.now() });
      } catch (err) {
        console.log("token tracking record error: ", err);
      }
    });
  }

  recordUser(userId: string) {
    Promise.resolve().then(async () => {
      try {
        await db.user.update(userId, { lastSeen: Date.now() });
      } catch (err) {
        console.log("user tracking record error: ", err);
      }
    });
  }
}

const tracking = new Tracker();
export default tracking;
