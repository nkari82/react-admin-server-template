import {ApolloServer} from 'apollo-server-express';
import Express from 'express';
import {createConnection, getConnectionManager} from 'typeorm';
import {buildFederatedSchema} from '../helper/buildFederatedSchema';
import {UserResolver} from './Users';

const host = 'localhost';
const port = 4001;

export async function listen(): Promise<string> {
  const schema = await buildFederatedSchema({
    resolvers: [UserResolver],
    emitSchemaFile: {
      path: __dirname + '/admin.gql',
      commentDescriptions: true,
      sortedSchema: false, // by default the printed schema is sorted alphabetically
    },
  });

  const server = new ApolloServer({
    schema,
  });

  const app = Express();
  server.applyMiddleware({app});

  const manager = getConnectionManager();
  if (!manager.has('default')) {
    await createConnection().then(() => {
      console.log('started');
    });
  }

  const url = `http://${host}:${port}${server.graphqlPath}`;
  app.listen(port, () => console.log(`🚀Admin Server ready at ${url}`));
  return url;
}
