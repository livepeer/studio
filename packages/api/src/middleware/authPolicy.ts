import HttpHash from "http-hash";
import { ApiToken } from "../schema/types";

export type AuthRule = ApiToken["access"]["rules"][0];

export class AuthPolicy {
  private allowRouter: any; //: HttpHash

  constructor(public rules: AuthRule[]) {
    const allowRouter = new HttpHash();
    for (const rule of rules) {
      for (const resource of rule.resources) {
        try {
          allowRouter.set(resource, rule.methods ?? ["*"]);
        } catch (err) {
          throw new Error(`Bad route ${resource}: ${err}`);
        }
      }
    }
    this.allowRouter = allowRouter;
  }

  allows(method: string, path: string) {
    const match = this.allowRouter.get(path);
    const methods = match.handler;
    if (!methods) return false;
    return methods.includes(method.toLowerCase()) || methods.includes("*");
  }
}
