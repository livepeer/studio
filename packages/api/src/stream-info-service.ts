import "./dotenv";
import "source-map-support/register";
import makeApp from "./app/stream-info/stream-info-app";
import { parseCli } from "./app/stream-info/parse-cli";

if (require.main === module) {
  makeApp(parseCli());
}
