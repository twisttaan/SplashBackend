# Splash Backend

Welcome to Splash's Serverless Fastify Backend!

## How to setup your development environment

1. Install the dependencies with yarn by typing `yarn install`
2. Run the server with `yarn vercel`, The CLI will now guide you through the setup and then start the server afterwards. Due to the nature of serverless all you need to do is save the file and request an endpoint and it will be updated immediately, no need for building or rerunning the command.
3. Make a volume for the database using docker with `docker volume create --name=splashdb` (you only need to run this once)
4. Start up the database with `docker-compose up --build postgres`, then set the environment variable `DATABASE_URL` to `postgresql://postgres:internalpassword@localhost:5432/splash?schema=public`
