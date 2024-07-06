import serverPromise, { TestServer } from "../test-server";
import { clearDatabase } from "../test-helpers";
import { ObjectStore, User } from "../schema/types";
import { db } from "../store";
import { v4 as uuid } from "uuid";
import {
  addDefaultProjectId,
  deleteCredentials,
  getS3PresignedUrl,
  toObjectStoreUrl,
  toWeb3StorageUrl,
} from "./helpers";
import { Request, Response } from "express";
import { calculateOverageOnMinimumSpend } from "./stripe";

let server: TestServer;

// jest.setTimeout(70000)

beforeAll(async () => {
  server = await serverPromise;
});

afterEach(async () => {
  await clearDatabase(server);
});

describe("controllers/stripe", () => {
  describe("calculate usage", () => {
    it("should calculate correct overage on minimum spend plans", async () => {
      const product = {
        minimumSpend: true,
        monthlyPrice: 100,
        usage: [
          {
            name: "Transcoding",
            description: "Transcoding (minutes)",
            price: 0.0055,
            limit: 3_000,
          },
          {
            name: "Delivery",
            description: "Delivery (minutes)",
            price: 0.0005,
            limit: 100_000,
          },
          {
            name: "Storage",
            description: "Storage (minutes)",
            price: 0.0015,
            limit: 10_000,
          },
        ],
      };

      let billingUsage = {
        totalUsage: 3000, // 3000 * 0.0055 = 16.5
        deliveryUsage: 100000, // 100,000 * 0.0005 = 50
        storageUsage: 10000, // 10,000 * 0.0015 = 15 - total = 75
      };
      let overage = await calculateOverageOnMinimumSpend(product, billingUsage);
      expect(overage.StorageUsageMins * product.usage[2].price).toEqual(0);
      expect(overage.DeliveryUsageMins * product.usage[1].price).toEqual(0);
      expect(overage.TotalUsageMins * product.usage[0].price).toEqual(0);

      billingUsage = {
        totalUsage: 6000, // 6000 * 0.0055 = 33
        deliveryUsage: 100000, // 100,000 * 0.0005 = 50
        storageUsage: 10000, // 10,000 * 0.0015 = 15 - total = 98
      };
      overage = await calculateOverageOnMinimumSpend(product, billingUsage);
      expect(overage.StorageUsageMins * product.usage[2].price).toEqual(0);
      expect(overage.DeliveryUsageMins * product.usage[1].price).toEqual(0);
      expect(overage.TotalUsageMins * product.usage[0].price).toEqual(0);

      billingUsage = {
        totalUsage: 0, // 0 * 0.0055 = 0
        deliveryUsage: 206000, // 100,000 * 0.0005 = 103
        storageUsage: 0, // 0 * 0.0015 = 0 - total = 103
      };
      overage = await calculateOverageOnMinimumSpend(product, billingUsage);
      expect(overage.StorageUsageMins * product.usage[2].price).toEqual(0);
      expect(overage.DeliveryUsageMins * product.usage[1].price).toEqual(3);
      expect(overage.TotalUsageMins * product.usage[0].price).toEqual(0);
      billingUsage = {
        totalUsage: 12000, // 12000 * 0.0055 = 66
        deliveryUsage: 100000, // 100,000 * 0.0005 = 50
        storageUsage: 10000, // 10,000 * 0.0015 = 15 - total = 131
      };
      overage = await calculateOverageOnMinimumSpend(product, billingUsage);
      expect(overage.StorageUsageMins * product.usage[2].price).toBeGreaterThan(
        0,
      );
      expect(
        overage.DeliveryUsageMins * product.usage[1].price,
      ).toBeGreaterThan(0);
      expect(overage.TotalUsageMins * product.usage[0].price).toBeGreaterThan(
        0,
      );
      expect(
        overage.TotalUsageMins * product.usage[0].price +
          overage.DeliveryUsageMins * product.usage[1].price +
          overage.StorageUsageMins * product.usage[2].price,
      ).toEqual(31);

      billingUsage = {
        totalUsage: 0, // 0 * 0.0055 = 0
        deliveryUsage: 0, // 0 * 0.0005 = 0
        storageUsage: 20000, // 20,000 * 0.0015 = 30 - total = 30
      };
      overage = await calculateOverageOnMinimumSpend(product, billingUsage);
      expect(overage.StorageUsageMins * product.usage[2].price).toEqual(0);
      expect(overage.DeliveryUsageMins * product.usage[1].price).toEqual(0);
      expect(overage.TotalUsageMins * product.usage[0].price).toEqual(0);

      billingUsage = {
        totalUsage: 5000, // 5000 * 0.0055 = 27.5
        deliveryUsage: 50000, // 50,000 * 0.0005 = 25
        storageUsage: 5000, // 5,000 * 0.0015 = 7.5 - total = 60
      };
      overage = await calculateOverageOnMinimumSpend(product, billingUsage);
      expect(overage.StorageUsageMins * product.usage[2].price).toEqual(0);
      expect(overage.DeliveryUsageMins * product.usage[1].price).toEqual(0);
      expect(overage.TotalUsageMins * product.usage[0].price).toEqual(0);

      billingUsage = {
        totalUsage: 10000, // 10000 * 0.0055 = 55
        deliveryUsage: 150000, // 150,000 * 0.0005 = 75
        storageUsage: 15000, // 15,000 * 0.0015 = 22.5 - total = 152.5
      };
      overage = await calculateOverageOnMinimumSpend(product, billingUsage);
      expect(overage.StorageUsageMins * product.usage[2].price).toBeGreaterThan(
        0,
      );
      expect(
        overage.DeliveryUsageMins * product.usage[1].price,
      ).toBeGreaterThan(0);
      expect(overage.TotalUsageMins * product.usage[0].price).toBeGreaterThan(
        0,
      );
      expect(
        overage.TotalUsageMins * product.usage[0].price +
          overage.DeliveryUsageMins * product.usage[1].price +
          overage.StorageUsageMins * product.usage[2].price,
      ).toEqual(52.5);

      billingUsage = {
        totalUsage: 100000, // 550
        deliveryUsage: 0,
        storageUsage: 0,
      };
      overage = await calculateOverageOnMinimumSpend(product, billingUsage);
      expect(overage.StorageUsageMins * product.usage[2].price).toEqual(0);
      expect(overage.DeliveryUsageMins * product.usage[1].price).toEqual(0);
      expect(overage.TotalUsageMins * product.usage[0].price).toEqual(450);
    });
  });
});
