import "dotenv/config";
import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import fastifyAutoload from "fastify-autoload";
import fastifyCors from "fastify-cors";
import { join } from "path";

// Instantiate Fastify with some config
const app = Fastify({
  logger: true,
});

app.register(fastifyAutoload, {
  dir: join(__dirname, "Routes"),
  options: { prefix: "/" },
});

app.register(fastifyCors, {
  origin: "*",
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
});

app.addContentTypeParser("application/json", {}, (req, body, done) => {
  // @ts-ignore
  done(null, body.body);
});

export default async (req: FastifyRequest, res: FastifyReply) => {
  await app.ready();
  app.server.emit("request", req, res);
};
