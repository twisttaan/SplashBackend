import { ChatRoomMember, User } from ".prisma/client";
import { FastifyInstance } from "fastify";

interface getUserParams {
  id: string;
}

export default async function AuthRouter(fastify: FastifyInstance) {
  const { prisma } = fastify;

  fastify.post("/pfp", async (request, reply) => {
    const { user } = request;
    if (!user) return reply.code(401).send({ message: "Unauthorized" });

    if (!request.isMultipart()) {
      reply.code(400).send({ message: "Request must be multipart." });
      return;
    }
    try {
      const image = await new Promise((resolve, reject) => {
        fastify.cloudinary.uploader
          .upload_stream({ folder: "ugc" }, (error, result) => {
            if (error) {
              reject(error);
            }

            resolve(result);
          })
          // @ts-ignore allow unknown field
          .end(request.body.file[0].data);
      });

      reply.code(200).send({ image });
    } catch (err) {
      reply.code(500).send({ message: "Error uploading image." });
    }
  });

  fastify.get<{ Params: getUserParams }>(
    "/",

    async (request, reply) => {
      const id = request.params.id;
      const user = request.user as
        | (User & {
            chatRooms: ChatRoomMember[];
          })
        | null;

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
          chatRooms: user.chatRooms,
        },
      });
    }
  );
}

export const autoPrefix = "/v1/user/me";
