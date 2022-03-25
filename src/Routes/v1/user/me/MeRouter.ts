import { FastifyInstance } from "fastify";
interface getUserParams {
  id: string;
}

export default async function AuthRouter(fastify: FastifyInstance) {
  const { prisma } = fastify;
  fastify.get<{ Params: getUserParams }>(
    "/",

    async (request, reply) => {
      const id = request.params.id;
      const { user } = request;

      if (!user) {
        return reply.code(401).send({
          message: "Unauthorized, no session.",
          session: request.user,
        });
      }

      return reply.code(200).send({
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          createdAt: user.createdAt,
          staff: user.staff,
          inviteUsed: user.inviteUsed,
          email: user.email,
        },
      });
    }
  );
}

export const autoPrefix = "/v1/user/me";
