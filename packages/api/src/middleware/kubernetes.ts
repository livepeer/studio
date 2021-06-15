/**
 * Injects getOrchestrators() and getBroadcasters() from the local k8s environment
 */

import { RequestHandler } from "express";
import { render } from "mustache";
import * as k8s from "@kubernetes/client-node";

import { timeout } from "../util";

export default function kubernetesMiddleware({
  kubeNamespace,
  kubeBroadcasterService,
  kubeOrchestratorService,
  kubeBroadcasterTemplate,
  kubeOrchestratorTemplate,
}): RequestHandler {
  const cache = {};
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();

  const kubeApi = kc.makeApiClient(k8s.CoreV1Api);

  // Try to read namespaced endpoints, return most recent data if we can't
  const cachedReadNamespacedEndpoints = async (kubeService, kubeNamespace) => {
    // % isn't allowed in k8s names, so it's a suitable delimiter
    const cacheKey = `${kubeService}%${kubeNamespace}`;
    try {
      const endpoints = await timeout(5000, () =>
        kubeApi.readNamespacedEndpoints(kubeService, kubeNamespace)
      );
      cache[cacheKey] = endpoints;
      return endpoints;
    } catch (e) {
      if (cache[cacheKey]) {
        console.error(
          "WARNING: kubernetes control plane unavailable, returning cached data",
          e
        );
        return cache[cacheKey];
      }
      console.error(
        "ERROR: kubernetes control plane unavailable, cached data unavailable, cannot provide orchestrator list"
      );
      throw e;
    }
  };

  const getBroadcasters = async () => {
    const endpoints = await cachedReadNamespacedEndpoints(
      kubeBroadcasterService,
      kubeNamespace
    );
    const ret = [];
    if (endpoints.body && endpoints.body.subsets) {
      for (const subset of endpoints.body.subsets) {
        if (!subset.addresses) {
          continue;
        }
        for (const address of subset.addresses) {
          ret.push({
            address: render(kubeBroadcasterTemplate, {
              nodeName: address.nodeName,
              ip: address.ip,
            }),
            cliAddress: `http://${address.ip}:7935`,
          });
        }
      }
    }
    return ret;
  };

  const getOrchestrators = async () => {
    const endpoints = await cachedReadNamespacedEndpoints(
      kubeOrchestratorService,
      kubeNamespace
    );
    const ret = [];
    if (endpoints.body && endpoints.body.subsets) {
      for (const subset of endpoints.body.subsets) {
        if (!subset.addresses) {
          continue;
        }
        for (const address of subset.addresses) {
          ret.push({
            address: render(kubeOrchestratorTemplate, {
              nodeName: address.nodeName,
              ip: address.ip,
            }),
            cliAddress: `http://${address.ip}:7935`,
          });
        }
      }
    }
    return ret;
  };

  return (req, res, next) => {
    if (kubeBroadcasterService) {
      req.getBroadcasters = getBroadcasters;
    }

    if (kubeOrchestratorService) {
      req.getOrchestrators = getOrchestrators;
    }

    return next();
  };
}
