/*
 * Global Imports
 */
import { FastifyInstance } from "fastify";

export default async (server: FastifyInstance) => {
  /*
   * Withdraw Endpoint
   */
  server.get("/hello", async (request, reply) => {
    reply.code(200).send({ hello: "world" });
  });
};

/*
 * Fastify Route Config
 */
export const autoPrefix = "/v1";
