import serverPromise, { TestServer } from "../test-server";
import { clearDatabase } from "../test-helpers";
import { ObjectStore, User } from "../schema/types";
import { db } from "../store";
import { v4 as uuid } from "uuid";
import {
  deleteCredentials,
  getS3PresignedUrl,
  toObjectStoreUrl,
  toWeb3StorageUrl,
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

  describe("convert storage object to object store URL", () => {
    it("should convert correct object", () => {
      const storageObj = {
        endpoint: "https://gateway.storjshare.io",
        bucket: "testbucket",
        credentials: {
          accessKeyId: "AKIAIOSFODNN7EXAMPLE",
          secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        },
      };
      expect(toObjectStoreUrl(storageObj)).toBe(
        "s3+https://AKIAIOSFODNN7EXAMPLE:wJalrXUtnFEMI%2FK7MDENG%2FbPxRfiCYEXAMPLEKEY@gateway.storjshare.io/testbucket"
      );
    });

    it("should fail if endpoint is not defined", () => {
      const storageObj = {
        bucket: "testbucket",
        credentials: {
          accessKeyId: "AKIAIOSFODNN7EXAMPLE",
          secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        },
      };
      expect(() => toObjectStoreUrl(storageObj)).toThrow(
        "undefined property 'endpoint'"
      );
    });

    it("should fail if endpoint is empty", () => {
      const storageObj = {
        endpoint: "",
        bucket: "testbucket",
        credentials: {
          accessKeyId: "AKIAIOSFODNN7EXAMPLE",
          secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        },
      };
      expect(() => toObjectStoreUrl(storageObj)).toThrow(
        "undefined property 'endpoint'"
      );
    });

    it("should fail if bucket is not defined", () => {
      const storageObj = {
        endpoint: "https://gateway.storjshare.io",
        credentials: {
          accessKeyId: "AKIAIOSFODNN7EXAMPLE",
          secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        },
      };
      expect(() => toObjectStoreUrl(storageObj)).toThrow(
        "undefined property 'bucket'"
      );
    });

    it("should fail if credentials are not defined", () => {
      const storageObj = {
        endpoint: "https://gateway.storjshare.io",
        bucket: "testbucket",
      };
      expect(() => toObjectStoreUrl(storageObj)).toThrow(
        "undefined property 'credentials'"
      );
    });

    it("should fail if credentials are not defined", () => {
      const storageObj = {
        endpoint: "https://gateway.storjshare.io",
        bucket: "testbucket",
        credentials: {
          accessKeyId: "",
          secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        },
        additionalProperty: "someAdditionalProperty",
      };
      expect(() => toObjectStoreUrl(storageObj)).toThrow(
        "undefined property 'credentials'"
      );
    });
  });

  describe("delete credentials from object store URL", () => {
    it("should delete credentials form object store URL", () => {
      expect(
        deleteCredentials(
          "s3+https://AKIAIOSFODNN7EXAMPLE:wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY@gateway.storjshare.io/testbucket"
        )
      ).toBe("s3+https://***:***@gateway.storjshare.io/testbucket");
    });

    it("should not modify a standard URL", () => {
      expect(
        deleteCredentials(
          "https://s3.amazonaws.com/my-bucket/path/filename.mp4"
        )
      ).toBe("https://s3.amazonaws.com/my-bucket/path/filename.mp4");
    });

    it("should not modify incorrect object store URL", () => {
      expect(
        deleteCredentials(
          "s3+https://USERNAME_NO_PASSWORD:@gateway.storjshare.io/testbucket"
        )
      ).toBe(
        "s3+https://USERNAME_NO_PASSWORD:@gateway.storjshare.io/testbucket"
      );
    });
  });
});

describe("convert w3 storage to object store URL", () => {
  it("should convert correct object with base64-encoded proof", () => {
    const storageObj = {
      type: "web3.storage",
      credentials: {
        proof:
          "EaJlcm9vdHOAZ3ZlcnNpb24BmgIBcRIg2uxHpcPYSWNtifMKFkPC7IEDvFDCxCd3ADViv0coV7SnYXNYRO2hA0AnblHEW38s3lSlcwaDjPn+/",
      },
    };
    expect(toWeb3StorageUrl(storageObj)).toBe(
      "w3s://EaJlcm9vdHOAZ3ZlcnNpb24BmgIBcRIg2uxHpcPYSWNtifMKFkPC7IEDvFDCxCd3ADViv0coV7SnYXNYRO2hA0AnblHEW38s3lSlcwaDjPn-_@/"
    );
  });

  it("should convert correct object with base64url-encoded proof", () => {
    const storageObj = {
      type: "web3.storage",
      credentials: {
        proof:
          "EaJlcm9vdHOAZ3ZlcnNpb24BmgIBcRIg2uxHpcPYSWNtifMKFkPC7IEDvFDCxCd3ADViv0coV7SnYXNYRO2hA0AnblHEW38s3lSlcwaDjPn-_",
      },
    };
    expect(toWeb3StorageUrl(storageObj)).toBe(
      "w3s://EaJlcm9vdHOAZ3ZlcnNpb24BmgIBcRIg2uxHpcPYSWNtifMKFkPC7IEDvFDCxCd3ADViv0coV7SnYXNYRO2hA0AnblHEW38s3lSlcwaDjPn-_@/"
    );
  });

  it("should fail if credentials are not defined", () => {
    const storageObj = {
      type: "web3.storage",
    };
    // @ts-expect-error
    expect(() => toWeb3StorageUrl(storageObj)).toThrow(
      "undefined property 'credentials.proof'"
    );
  });

  it("should fail if proof is not defined", () => {
    const storageObj = {
      type: "web3.storage",
      credentials: {},
    };
    // @ts-expect-error
    expect(() => toWeb3StorageUrl(storageObj)).toThrow(
      "undefined property 'credentials.proof'"
    );
  });
});
