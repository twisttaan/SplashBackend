import "dotenv/config";
import Fastify from "fastify";
// Instantiate Fastify with some config
const app = Fastify({
  logger: false,
});

// Register your application as a normal plugin.
app.register(import("../functions/index"), {
  prefix: "/",
});

export default async (req, res) => {
  await app.ready();
  app.server.emit("request", req, res);
};
