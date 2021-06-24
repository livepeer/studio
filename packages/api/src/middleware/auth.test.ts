import HttpHash from "http-hash";

// TODO: make this test somethign real
describe("routing", () => {
  it("should work", () => {
    const router = HttpHash();

    router.set("/gus/*", ["get", "post"]);
    router.set("/api/stream/hook/*", ["post"]);

    const test = (route) => console.log(route, router.get(route));
    test("/gus/fra/bar");
    test("/gus");
    test("/gus/");
    test("/gu");
    test("/api/stream/hook");
    test("/api/stream/hook/detection");
  });
});
