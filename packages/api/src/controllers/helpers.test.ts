import serverPromise, { TestServer } from "../test-server";
import { clearDatabase } from "../test-helpers";
import { ObjectStore, User } from "../schema/types";
import { db } from "../store";
import { v4 as uuid } from "uuid";
import {
  deleteCredentialsFromObjectStoreUrl,
  getS3PresignedUrl,
  toObjectStoreUrl,
} from "./helpers";

let server: TestServer;

// jest.setTimeout(70000)

beforeAll(async () => {
  server = await serverPromise;
});

afterEach(async () => {
  await clearDatabase(server);
});

describe("controllers/helpers", () => {
  describe("osS3Urls", () => {
    const makePresignedUrl = async (url: string, file = "test.txt") => {
      const os = await db.objectStore.create({
        id: uuid(),
        name: "test",
        url,
      });
      return getS3PresignedUrl(os, file);
    };

    it("should support old object store URLs with region", async () => {
      const presignedUrl = await makePresignedUrl(
        "s3+http://localhost:8000/test-region/test-bucket"
      );
      expect(presignedUrl).toMatch(
        /^http:\/\/localhost:8000\/test-bucket\/test\.txt.+test-region.+$/
      );
    });

    it("should support new object store URLs without region", async () => {
      const presignedUrl = await makePresignedUrl(
        "s3+https://localhost:8000/test-bucket"
      );
      expect(presignedUrl).toMatch(
        /^https:\/\/localhost:8000\/test-bucket\/test\.txt.+ignored.+$/
      );
    });

    it("should support access credentials", async () => {
      const presignedUrl = await makePresignedUrl(
        "s3+https://poweruser:secretpwd@localhost:8000/test-bucket"
      );
      expect(presignedUrl).toMatch(
        /^https:\/\/localhost:8000\/test-bucket\/test\.txt.+poweruser.+$/
      );
      expect(presignedUrl).not.toContain("secretpwd");
    });

    it("should NOT support invalid object store URLs", async () => {
      await expect(
        makePresignedUrl("not-s3://localhost:8000/test-bucket")
      ).rejects.toThrow(/not-s3:/);
      await expect(
        makePresignedUrl("s3+https://localhost:8000/")
      ).rejects.toThrow(/"\/"/);
      await expect(
        makePresignedUrl("s3+https://localhost:8000/region/bucket/path")
      ).rejects.toThrow(/"\/region\/bucket\/path"/);
    });
  });

  describe("convert object to object store URL", () => {
    it("should convert correct object", () => {
      const storageObj = {
        endpoint: "https://gateway.storjshare.io",
        bucket: "testbucket",
        credentials: {
          accessKeyId: "AKIAIOSFODNN7EXAMPLE",
          secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        },
        additionalProperty: "someAdditionalProperty",
      };
      expect(toObjectStoreUrl(storageObj)).toBe(
        "s3+https://AKIAIOSFODNN7EXAMPLE:wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY@gateway.storjshare.io/testbucket"
      );
    });
    // TODO: Add more unit tests here
  });

  describe("delete credentials from object store URL", () => {
    it("should delete credentials form Object Store URL", () => {
      expect(
        deleteCredentialsFromObjectStoreUrl(
          "s3+https://AKIAIOSFODNN7EXAMPLE:wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY@gateway.storjshare.io/testbucket"
        )
      ).toBe("s3+https://***:***@gateway.storjshare.io/testbucket");
    });

    it("should not modify a standard URL", () => {
      expect(
        deleteCredentialsFromObjectStoreUrl(
          "https://s3.amazonaws.com/my-bucket/path/filename.mp4"
        )
      ).toBe("https://s3.amazonaws.com/my-bucket/path/filename.mp4");
    });
  });
});
