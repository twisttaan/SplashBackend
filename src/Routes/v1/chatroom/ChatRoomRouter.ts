import type { FastifyInstance } from "fastify";
import Joi from "joi";
import generateInviteCode from "../../../utils/generateInviteCode";
interface createRoomBody {
  name: string;
  inviteCode?: string;
}

export default async function BaseRouter(fastify: FastifyInstance) {
  const { prisma } = fastify;

  fastify.post<{ Body: createRoomBody }>(
    "/createRoom",
    {
      schema: {
        body: Joi.object().keys({
          name: Joi.string().required().min(2).max(30),
          inviteCode: Joi.string().optional().min(2).max(15),
        }),
      },
    },
    async (request, reply) => {
      const { user } = request;

      if (!user) {
        return reply.code(401).send({
          message: "You must be logged in to create a room.",
        });
      }
      if (!user.staff) {
        return reply.code(401).send({
          message: "You must be a staff member to create a room.",
        });
      }

      try {
        const newRoom = await prisma.chatRoom.create({
          data: {
            name: request.body.name,
            inviteCode: user.staff
              ? request.body.inviteCode || generateInviteCode()
              : generateInviteCode(),
            members: {
              create: [
                {
                  owner: true,
                  user: user,
                  userId: user.id,
                },
              ],
            },
          },
        });

        return reply.code(200).send({
          message: "Room created successfully.",
          room: newRoom,
        });
      } catch (err) {
        return reply.code(400).send({
          message: "Error creating room.",
        });
      }
    }
  );
}

export const autoPrefix = "/v1/chatroom";
