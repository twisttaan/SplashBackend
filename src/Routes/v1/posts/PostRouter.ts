import type { FastifyInstance } from "fastify";
import Joi from "joi";
interface postQuery {
  id: string;
}

export default async function BaseRouter(fastify: FastifyInstance) {
  const { prisma } = fastify;

  fastify.get<{ Querystring: postQuery }>(
    "/getPost",
    {
      schema: {
        querystring: Joi.object().keys({
          id: Joi.string().required().length(25),
        }),
      },
    },
    async (request, reply) => {
      const post = await prisma.post.findFirst({
        where: {
          id: request.query.id,
        },
      });

      if (!post) {
        return reply.code(404).send({
          message: "Post not found.",
        });
      }

      return reply.code(200).send({
        post,
      });
    }
  );
}

export const autoPrefix = "/v1/post";
