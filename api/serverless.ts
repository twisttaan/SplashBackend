import { PrismaClient, User } from ".prisma/client";
import { verify } from "argon2";
import "dotenv/config";
import Fastify from "fastify";
import fastifyAutoload from "fastify-autoload";
import fastifyCors from "fastify-cors";
import fastifyPassport from "fastify-passport";
import fastifySecureSession from "fastify-secure-session";
import { Strategy } from "passport-local";
import { join } from "path";
/** Create a new Fastify instance */
const app = Fastify();

app.prisma = new PrismaClient();

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
  interface PassportUser extends User {}
  interface FastifySchema {
    validate?: (...arg0: any[]) => ValidationResult;
  }
}

/** Add CORS Support */
app.register(fastifyCors, {
  origin: ["https://splash.evie.pw", /^http:\/\/localhost:\d+$/],
  credentials: true,
});

/** Add Secure Session Support */
app.register(fastifySecureSession, {
  key: Buffer.from(process.env.COOKIE_KEY as string, "hex"),
  cookie: {
    path: "/",
  },
});

/** Add Passport Support */
app.register(fastifyPassport.initialize());
app.register(fastifyPassport.secureSession());

fastifyPassport.use(
  new Strategy(
    async (
      username: any,
      password: string | Buffer,
      done: (arg0: null, arg1: User | boolean) => any
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
      });

      if (!user || !(await verify(user.password, password))) {
        return done(null, false);
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

/** Load all routes */
app.register(fastifyAutoload, {
  dir: join(__dirname, "../Routes"),
});

/** Use Joi */
// @ts-expect-error Argument of type '({ schema }: FastifyRouteSchemaDef<FastifySchema>) => (data: any) => ValidationResult | null' is not assignable to parameter of type 'FastifySchemaCompiler<FastifySchema>'.
app.setValidatorCompiler(({ schema }) => {
  return (data) => (schema.validate ? schema.validate(data) : null);
});

/** Vercel Hook */
export default async (req: any, res: any) => {
  await app.ready();
  app.server.emit("request", req, res);
};
