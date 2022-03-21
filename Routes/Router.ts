import type { FastifyInstance } from "fastify";

export default async function BaseRouter(fastify: FastifyInstance) {
  fastify.get("/", async () => {
    return { statusCode: 200, message: "Hello World!" };
  });
}

export const autoPrefix = "/";
