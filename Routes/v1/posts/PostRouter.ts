import type { FastifyInstance } from "fastify";
import Joi from "joi";
interface postReq {
  postID: string;
}

interface postQuery {
  postID: string;
}

export default async function BaseRouter(fastify: FastifyInstance) {
  const { prisma } = fastify;

  fastify.get<{ Body: postReq; Querystring: postQuery }>(
    "/:postID",
    {
      schema: {
        params: Joi.object().keys({
          postID: Joi.string().required().length(25),
        }),
      },
    },
    async (request, reply) => {
      const post = await prisma.post.findFirst({
        where: {
          id: request.query.postID,
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
