import 'reflect-metadata';
import {ApolloServer} from 'apollo-server-express';
import Express from 'express';
import {AuthChecker, buildSchema} from 'type-graphql';
import {createConnection} from 'typeorm';
import {UserResolver} from './entity/User';
import jwt from 'express-jwt';

const main = async () => {
  // AuthChecker
  // https://kishe89.github.io/javascript/2019/01/19/graphql-tutorial-04.html

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface ContextType {}
  const authChecker: AuthChecker<ContextType> = ({root, args, context, info}, roles) => {
    // here we can read the user from context
    // and check his permission in the db against the `roles` argument
    // that comes from the `@Authorized` decorator, eg. ["ADMIN", "MODERATOR"]

    return true; // or false if access is denied
  };

  // If we need silent auth guards and don't want to return authorization errors to users,
  // we can set the authMode property of the buildSchema config object to "null":
  const schema = await buildSchema({
    resolvers: [UserResolver],
    authChecker: authChecker,
    authMode: 'null',
  });

  const server = new ApolloServer({
    schema,
    context: (req: any) => {
      const context = {
        req,
        user: req.user, // `req.user` comes from `express-jwt`
      };

      return context;
    },
  });

  const app = Express();
  app.use(
    '/graphql',
    jwt({
      algorithms: [],
      secret: 'TypeGraphQL',
      credentialsRequired: false,
    }),
  );

  server.applyMiddleware({app});

  await createConnection().then(() => {
    console.log('started');
  });

  app.listen(4000, () => {
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
  });
};

main();
