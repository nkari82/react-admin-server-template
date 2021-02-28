import 'reflect-metadata';
import {ApolloGateway} from '@apollo/gateway';
import {ApolloServer} from 'apollo-server-express';
import Express from 'express';
import expressJwt from 'express-jwt';
import * as admin from './admin';
import * as account from './account';

const host = 'localhost';
const port = 4000;

const main = async () => {
  const gateway = new ApolloGateway({
    serviceList: [
      {name: 'account', url: await account.listen()},
      {name: 'admin', url: await admin.listen()},
    ],
  });

  const {schema, executor} = await gateway.load();
  const server = new ApolloServer({
    schema,
    executor,
    tracing: false,
    playground: true,
    subscriptions: false,
  });

  const app = Express();
  server.applyMiddleware({app});

  const url = `http://${host}:${port}${server.graphqlPath}`;
  app.listen(port, () => console.log(`🚀Gateway Server ready at ${url}`));
};

main();
