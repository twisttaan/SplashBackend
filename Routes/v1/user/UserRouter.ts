import { FastifyInstance } from "fastify";

interface getUserParams {
  id: string;
}

export default async function AuthRouter(fastify: FastifyInstance) {
  const { prisma } = fastify;
  fastify.get<{ Params: getUserParams }>("/:id", async (request, reply) => {
    const id = request.params.id;
    const { authorization } = request.headers;
    const requestor = await prisma.user.findFirst({
      where: {
        password: authorization,
      },
    });

    if (!requestor) {
      return reply.code(401).send({
        message: "Unauthorized",
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        id,
      },
    });

    if (!user) {
      return reply.code(404).send({
        message: "User not found",
      });
    }

    return reply.code(200).send({
      user,
    });
  });
}

export const autoPrefix = "/v1/user";
