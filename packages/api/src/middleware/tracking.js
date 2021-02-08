"use strict";

const tracking = {
  recordToken: function recordToken(db, tokenObject) {
    db.apiToken
      .update(tokenObject.id, {
        lastSeen: Date.now(),
      })
      .then((_) => {
        // all good
      })
      .catch((e) => {
        console.log("token tracking record error: ", e);
      });
  },
  recordUser: function recordUser(db, userId) {
    db.user
      .update(userId, {
        lastSeen: Date.now(),
      })
      .then((_) => {
        // all good
      })
      .catch((e) => {
        console.log("user tracking record error: ", e);
      });
  },
};

export default tracking;
