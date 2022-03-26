# Splash Backend

Welcome to Splash's Fastify Backend!

## How to setup your development environment

1. Install the dependencies with yarn by typing `yarn install`
2. Run the server with `yarn dev`
3. Make a volume for the database using docker with `docker volume create --name=splashdb` (you only need to run this once)
4. Start up the database with `docker-compose up --build postgres`, then set the environment variable `DATABASE_URL` to `postgresql://postgres:internalpassword@localhost:5432/splash?schema=public`
