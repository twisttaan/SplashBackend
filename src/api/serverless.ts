import "dotenv/config";
import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import fastifyCors from "fastify-cors";

// Instantiate Fastify with some config
const app = Fastify({
  logger: true,
});

// Register your application as a normal plugin.
app.register(import("../index"), {
  prefix: "/",
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
