import HttpHash from "http-hash";
import { ApiToken } from "../schema/types";

type PolicyName = ApiToken["access"]["policies"][0];

export const Policies: Record<PolicyName, Policy> = {
  broadcasterHooks: {
    rules: [
      {
        resources: ["/api/stream/hook/*"],
        methods: ["post"],
        effect: "allow",
      },
    ],
  },
  fullAccess: {
    rules: [
      {
        resources: ["/*"],
        methods: ["*"],
        effect: "allow",
      },
    ],
  },
};

interface Rule {
  resources: string[];
  methods: string[];
  effect: "allow";
}

interface Policy {
  rules: Rule[];
}

class ProcessedPolicy implements Policy {
  rules: Rule[];

  private allowRouter: any; //: HttpHash

  constructor(policy: Policy) {
    this.rules = policy.rules;

    const allowRouter = new HttpHash();
    for (const rule of policy.rules) {
      for (const resource of rule.resources) {
        if (rule.effect === "allow") {
          allowRouter.set(resource, rule.methods);
        }
      }
    }
    this.allowRouter = allowRouter;
  }

  allows(method: string, path: string) {
    const match = this.allowRouter.get(path);
    const methods = match.handler;
    if (!methods) return false;
    return methods.includes(method) || methods.includes("*");
  }
}

export const ProcessedPolicies = Object.fromEntries(
  Object.entries(Policies).map(([name, policy]) => [
    name,
    new ProcessedPolicy(policy),
  ])
);
