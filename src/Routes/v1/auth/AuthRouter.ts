import { hash } from "argon2";
import { FastifyInstance } from "fastify";
import fastifyPassport from "fastify-passport";
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
          inviteUsed: inviteCode ?? "tristan",
          invite:
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15),
        },
      });

      return reply.status(200).send({
        message: `Successfully registered ${newUser.username}`,
        user: {
          id: newUser.id,
          username: newUser.username,
          displayName: newUser.displayName,
          createdAt: newUser.createdAt,
          staff: newUser.staff,
          inviteUsed: newUser.inviteUsed,
        },
      });
    }
  );

  interface loginBody {
    username: string;
    password: string;
  }

  fastify.post("/logout", async (request, reply) => {
    request.logout();
    return reply.code(200).send({
      message: "Successfully yeeted the user's auth cookies!",
    });
  });

  fastify.post<{ Body: loginBody }>(
    "/login",
    {
      schema: {
        body: Joi.object().keys({
          username: Joi.string().required(),
          password: Joi.string().required(),
        }),
      },
      preValidation: fastifyPassport.authenticate(
        "local",
        async function (request, reply, _, user) {
          if (!user) {
            return reply.code(401).send({
              message: "Invalid username or password.",
            });
          }

          request.logIn(user);
        }
      ),
    },

    async (request, reply) => {
      const { user } = request;

      if (!user) {
        return reply.code(400).send({
          message: "Missing user!",
        });
      }

      return reply.code(200).send({
        message: "Successfully logged in",
        user: request.user,
      });
    }
  );
}

export const autoPrefix = "/v1/auth";
