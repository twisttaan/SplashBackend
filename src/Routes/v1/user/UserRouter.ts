import { FastifyInstance } from "fastify";
interface getUserParams {
  id: string;
}

export default async function AuthRouter(fastify: FastifyInstance) {
  const { prisma } = fastify;
  fastify.get<{ Params: getUserParams }>(
    "/:id",

    async (request, reply) => {
      const id = request.params.id;

      const user = await prisma.user.findFirst({
        where: {
          OR: [
            {
              username: {
                equals: id,
                mode: "insensitive",
              },
            },
            {
              id: {
                equals: id,
              },
            },
          ],
        },
        include: {
          followers: true,
          following: true,
        },
      });

      if (!user) {
        return reply.code(404).send({
          message: "User not found",
        });
      }

      if (!request.user) {
        return reply.code(200).send({
          message: "User wasn't found in session, sent less data.",
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            createdAt: user.createdAt,
            staff: user.staff,
            following: user.following,
            followers: user.followers,
          },
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
          following: user.following,
          followers: user.followers,
        },
      });
    }
  );
}

export const autoPrefix = "/v1/user";
