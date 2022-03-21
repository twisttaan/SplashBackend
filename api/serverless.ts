import "dotenv/config";
import Fastify from "fastify";
import fastifyAutoload from "fastify-autoload";
import { join } from "path";
// Instantiate Fastify with some config
const app = Fastify({
  logger: false,
});

app.register(fastifyAutoload, {
  dir: join(__dirname, "../Routes"),
});

export default async (req, res) => {
  await app.ready();
  app.server.emit("request", req, res);
};
