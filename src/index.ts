import { ChatRoomMember, PrismaClient, User } from ".prisma/client";
import { verify } from "argon2";
import cloudinary from "cloudinary";
import "dotenv/config";
import Fastify from "fastify";
import fastifyAutoload from "fastify-autoload";
import fastifyCors from "fastify-cors";
import fastifyFileUpload from "fastify-file-upload";
import fastifyHelmet from "fastify-helmet";
import multipart from "fastify-multipart";
import fastifyPassport from "fastify-passport";
import fastifyRateLimit from "fastify-rate-limit";
import fastifySecureSession from "fastify-secure-session";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { IVerifyOptions, Strategy } from "passport-local";
import { join } from "path";

/** Create a new Fastify instance */
const app = Fastify({
  trustProxy: true,
});

app.prisma = new PrismaClient();
app.storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
});

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
    storage: CloudinaryStorage;
    cloudinary: typeof cloudinary.v2;
  }
  interface PassportUser extends User {
    chatRooms: ChatRoomMember[];
  }
  interface FastifySchema {
    validate?: (...arg0: any[]) => ValidationResult;
  }
}

cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
  secure: true,
});

app.cloudinary = cloudinary.v2;

app.register(multipart, {
  addToBody: true,
  sharedSchemaId: "MultipartFileType",
});

app.register(fastifyCors, {
  origin: ["https://splash.evie.pw", /^http:\/\/localhost:\d+$/],
  credentials: true,
});

app.register(fastifyFileUpload);

app.register(fastifyRateLimit, {
  timeWindow: 1000 * 60,
  max: 20,
});

app.register(fastifySecureSession, {
  key: Buffer.from(process.env.COOKIE_KEY as string, "hex"),
  cookie: {
    path: "/",
  },
});

app.register(fastifyHelmet);

app.register(fastifyPassport.initialize());
app.register(fastifyPassport.secureSession());

fastifyPassport.use(
  new Strategy(
    async (
      username: string,
      password: string,
      done: (error: any, user?: any, options?: IVerifyOptions) => void
    ) => {
      const user = await app.prisma.user.findFirst({
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
                equals: username,
                mode: "insensitive",
              },
            },
          ],
        },
        include: {
          chatRooms: true,
        },
      });

      if (!user || !(await verify(user.password, password))) {
        return done(null);
      }

      return done(null, user);
    }
  )
);

fastifyPassport.registerUserSerializer(async (user: User) => user.id);
fastifyPassport.registerUserDeserializer(async (id: string) => {
  console.log(`Deserializing user ${id}`);
  return await app.prisma.user.findFirst({
    where: { id },
  });
});

app.register(fastifyAutoload, {
  dir: join(__dirname, "./Routes"),
});

// @ts-expect-error Argument of type '({ schema }: FastifyRouteSchemaDef<FastifySchema>) => (data: any) => ValidationResult | null' is not assignable to parameter of type 'FastifySchemaCompiler<FastifySchema>'.
app.setValidatorCompiler(({ schema }) => {
  return (data) => (schema.validate ? schema.validate(data) : null);
});

app.listen(process.env.PORT ?? 3000, "0.0.0.0", (err, address) => {
  if (err) {
    console.trace(err);
    process.exit(1);
  }
  console.log(`Server listening on ${address}`);
});
