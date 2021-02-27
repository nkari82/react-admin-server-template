import {ApolloServer} from 'apollo-server-express';
import Express from 'express';
import jwt from 'express-jwt';
import {AuthChecker} from 'type-graphql';
import {createConnection} from 'typeorm';
import {buildFederatedSchema} from '../helper/buildFederatedSchema';
import {UserResolver, resolveUserReference, User} from '../entity/User';

const host = 'localhost';
const port = 4001;

export async function listen(): Promise<string> {
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
  const schema = await buildFederatedSchema(
    {
      resolvers: [UserResolver],
      orphanedTypes: [User],
      authChecker: authChecker,
      authMode: 'null',
      emitSchemaFile: {
        path: __dirname + '/admin.gql',
        commentDescriptions: true,
        sortedSchema: false, // by default the printed schema is sorted alphabetically
      },
    },
    {
      User: {__resolveReference: resolveUserReference},
    },
  );

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

  const url = `http://${host}:${port}${server.graphqlPath}`;
  app.listen(port, () => console.log(`🚀Admin Server ready at ${url}`));
  return url;
}
