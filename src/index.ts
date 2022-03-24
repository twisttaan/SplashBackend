import { PrismaClient, User } from ".prisma/client";
import { verify } from "argon2";
import "dotenv/config";
import Fastify from "fastify";
import fastifyAutoload from "fastify-autoload";
import fastifyCors from "fastify-cors";
import fastifyHelmet from "fastify-helmet";
import fastifyPassport from "fastify-passport";
import fastifyRateLimit from "fastify-rate-limit";
import fastifySecureSession from "fastify-secure-session";
import { IVerifyOptions, Strategy } from "passport-local";
import { join } from "path";

/** Create a new Fastify instance */
const app = Fastify({
  trustProxy: true,
});

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

app.register(fastifyCors, {
  origin: ["https://splash.evie.pw", /^http:\/\/localhost:\d+$/],
  credentials: true,
});

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

app.listen(process.env.PORT ?? 3000, (err, address) => {
  if (err) {
    console.trace(err);
    process.exit(1);
  }
  console.log(`Server listening on ${address}`);
});
