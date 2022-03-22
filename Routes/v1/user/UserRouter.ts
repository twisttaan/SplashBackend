import { FastifyInstance } from "fastify";
import Joi from "joi";

interface getUserQuery {
  id: string;
}

export default async function AuthRouter(fastify: FastifyInstance) {
  const { prisma } = fastify;
  fastify.get<{ Querystring: getUserQuery }>(
    "/get",
    {
      schema: {
        querystring: Joi.object().keys({
          id: Joi.string().required().length(25),
        }),
      },
    },
    async (request, reply) => {
      const { id } = request.query;
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
    }
  );
}

export const autoPrefix = "/v1/user";
