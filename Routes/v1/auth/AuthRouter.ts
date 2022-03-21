import { hash } from "argon2";
import { FastifyInstance } from "fastify";
import Joi from "joi";

interface registerBody {
  username: string;
  displayName: string;
  email: string;
  password: string;
  inviteCode: string;
}

export default async function AuthRouter(fastify: FastifyInstance) {
  const { prisma } = fastify;
  fastify.post<{ Body: registerBody }>(
    "/register",
    {
      schema: {
        body: Joi.object().keys({
          username: Joi.string()
            .required()
            .min(2)
            .max(30)
            .pattern(/^(?=.{2,30}$)(?:[a-zA-Z\d]+(?:(?:\.|-|_)[a-zA-Z\d])*)+$/),
          displayName: Joi.string().min(2).max(30),
          email: Joi.string().required().email().lowercase(),
          password: Joi.string().required().min(5).max(90),
          inviteCode: Joi.string().required(),
        }),
      },
    },
    async (request, reply) => {
      const { username, displayName, email, password, inviteCode } =
        request.body;
      const userThatUsedInvite = await prisma.user.findFirst({
        where: {
          inviteUsed: inviteCode,
        },
      });

      if (!userThatUsedInvite) {
        return reply.code(400).send({
          statusCode: 400,
          message: "Invalid or already used Invite Code.",
        });
      }

      const checkUser = await prisma.user.findFirst({
        where: {
          OR: [
            {
              username: {
                equals: username,
                mode: "insensitive",
              },
            },
            {
              email: {
                equals: email,
                mode: "insensitive",
              },
            },
          ],
        },
      });

      if (checkUser) {
        return reply.code(400).send({
          statusCode: 400,
          message:
            checkUser.username === username
              ? "Username already taken"
              : "Email already taken",
        });
      }

      const newUser = await prisma.user.create({
        data: {
          username,
          displayName: displayName ?? username,
          email,
          password: await hash(password),
          inviteUsed: inviteCode,
          token: "",
          invite:
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15),
        },
      });

      return reply.send({
        statusCode: 200,
        message: `Successfully registered ${newUser.username}`,
        user: newUser,
      });
    }
  );

  fastify.post(
    "/login",
    {
      schema: {
        body: Joi.object().keys({
          username: Joi.string().required(),
          password: Joi.string().required(),
          reCaptchaToken: Joi.string().required(),
        }),
      },
    },
    async (request) => {
      return {
        statusCode: 200,
        message: "Successfully logged in",
      };
    }
  );
}

export const autoPrefix = "/v1/auth";
