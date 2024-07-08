import serverPromise, { TestServer } from "../test-server";
import { clearDatabase } from "../test-helpers";
import { calculateOverageOnMinimumSpend } from "./stripe";
import { calculateOverUsage } from "./usage";

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

      // Test 75$ spend with overage reported as 0, corresponding to 100$ invoice
      let billingUsage = {
        totalUsage: 3000, // 3000 * 0.0055 = 16.5
        deliveryUsage: 100000, // 100,000 * 0.0005 = 50
        storageUsage: 10000, // 10,000 * 0.0015 = 15 - total = 75
      };
      let overage = await calculateOverageOnMinimumSpend(product, billingUsage);
      expect(overage.StorageUsageMins * product.usage[2].price).toEqual(0);
      expect(overage.DeliveryUsageMins * product.usage[1].price).toEqual(0);
      expect(overage.TotalUsageMins * product.usage[0].price).toEqual(0);

      // Test 98$ spend with overage reported as 0, corresponding to 100$ invoice
      billingUsage = {
        totalUsage: 6000, // 6000 * 0.0055 = 33
        deliveryUsage: 100000, // 100,000 * 0.0005 = 50
        storageUsage: 10000, // 10,000 * 0.0015 = 15 - total = 98
      };
      overage = await calculateOverageOnMinimumSpend(product, billingUsage);
      expect(overage.StorageUsageMins * product.usage[2].price).toEqual(0);
      expect(overage.DeliveryUsageMins * product.usage[1].price).toEqual(0);
      expect(overage.TotalUsageMins * product.usage[0].price).toEqual(0);

      // Test 103$ spend with overage reported as 3$, corresponding to 103$ invoice distributed across 1 product items
      billingUsage = {
        totalUsage: 0, // 0 * 0.0055 = 0
        deliveryUsage: 206000, // 100,000 * 0.0005 = 103
        storageUsage: 0, // 0 * 0.0015 = 0 - total = 103
      };
      overage = await calculateOverageOnMinimumSpend(product, billingUsage);
      expect(overage.StorageUsageMins * product.usage[2].price).toEqual(0);
      expect(overage.DeliveryUsageMins * product.usage[1].price).toEqual(3);
      expect(overage.TotalUsageMins * product.usage[0].price).toEqual(0);

      // Test 131$ spend with overage reported as 31$, corresponding to 131$ invoice distributed across 3 product items
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

      // Test 30$ spend with overage reported as 0, corresponding to 100$ invoice
      billingUsage = {
        totalUsage: 0, // 0 * 0.0055 = 0
        deliveryUsage: 0, // 0 * 0.0005 = 0
        storageUsage: 20000, // 20,000 * 0.0015 = 30 - total = 30
      };
      overage = await calculateOverageOnMinimumSpend(product, billingUsage);
      expect(overage.StorageUsageMins * product.usage[2].price).toEqual(0);
      expect(overage.DeliveryUsageMins * product.usage[1].price).toEqual(0);
      expect(overage.TotalUsageMins * product.usage[0].price).toEqual(0);

      // Test 60$ spend with overage reported as 0, corresponding to 100$ invoice
      billingUsage = {
        totalUsage: 5000, // 5000 * 0.0055 = 27.5
        deliveryUsage: 50000, // 50,000 * 0.0005 = 25
        storageUsage: 5000, // 5,000 * 0.0015 = 7.5 - total = 60
      };
      overage = await calculateOverageOnMinimumSpend(product, billingUsage);
      expect(overage.StorageUsageMins * product.usage[2].price).toEqual(0);
      expect(overage.DeliveryUsageMins * product.usage[1].price).toEqual(0);
      expect(overage.TotalUsageMins * product.usage[0].price).toEqual(0);

      // Test 147.5$ spend with overage reported as 47.5$, corresponding to 147.5$ invoice distributed across 2 product items
      billingUsage = {
        totalUsage: 0,
        deliveryUsage: 250000,
        storageUsage: 15000, // total = 147.5
      };
      overage = await calculateOverageOnMinimumSpend(product, billingUsage);
      expect(overage.StorageUsageMins * product.usage[2].price).toBeGreaterThan(
        0,
      );
      expect(
        overage.DeliveryUsageMins * product.usage[1].price,
      ).toBeGreaterThan(0);
      expect(overage.TotalUsageMins * product.usage[0].price).toBe(0);
      expect(
        overage.TotalUsageMins * product.usage[0].price +
          overage.DeliveryUsageMins * product.usage[1].price +
          overage.StorageUsageMins * product.usage[2].price,
      ).toEqual(47.5);

      // Test 550$ spend with overage reported as 450, corresponding to 550$ invoice
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

    it("should report correctly the usage for products without minimum spend", async () => {
      const product = {
        minimumSpend: false,
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
      // No overage
      let billingUsage = {
        TotalUsageMins: 3_000,
        DeliveryUsageMins: 100_000,
        StorageUsageMins: 10_000,
      };
      let overusage = await calculateOverUsage(product, billingUsage);
      expect(overusage.TotalUsageMins * product.usage[0].price).toEqual(0);
      expect(overusage.DeliveryUsageMins * product.usage[1].price).toEqual(0);
      expect(overusage.StorageUsageMins * product.usage[2].price).toEqual(0);

      // 1 minute overage for each item
      billingUsage = {
        TotalUsageMins: 3_001,
        DeliveryUsageMins: 100_001,
        StorageUsageMins: 10_001,
      };
      overusage = await calculateOverUsage(product, billingUsage);
      expect(overusage.TotalUsageMins * product.usage[0].price).toEqual(
        product.usage[0].price,
      );
      expect(overusage.DeliveryUsageMins * product.usage[1].price).toEqual(
        product.usage[1].price,
      );
      expect(overusage.StorageUsageMins * product.usage[2].price).toEqual(
        product.usage[2].price,
      );
    });
  });
});
