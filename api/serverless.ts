import { PrismaClient } from ".prisma/client";
import "dotenv/config";
import Fastify from "fastify";
import fastifyAutoload from "fastify-autoload";
import fastifyCors from "fastify-cors";
import { join } from "path";
/** Create a new Fastify instance */
const app = Fastify({
  logger: true,
});

app.prisma = new PrismaClient();

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
  interface FastifySchema {
    validate?: (...arg0: any[]) => ValidationResult;
  }
}

/** Add CORS Support */
app.register(fastifyCors, {
  origin: ["https://splash.evie.pw", /^http:\/\/localhost:\d+$/],
  credentials: true,
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
