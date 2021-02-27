import 'reflect-metadata';
import {ApolloGateway} from '@apollo/gateway';
import {ApolloServer} from 'apollo-server-express';
import Express from 'express';
import * as admin from './admin';

const host = 'localhost';
const port = 4000;

const main = async () => {
  const app = Express();

  const gateway = new ApolloGateway({
    serviceList: [{name: 'admin', url: await admin.listen()}],
  });

  const server = new ApolloServer({
    gateway,
    tracing: false,
    playground: true,
    subscriptions: false,
  });

  server.applyMiddleware({app});

  const url = `http://${host}:${port}${server.graphqlPath}`;
  app.listen(port, () => console.log(`🚀Gateway Server ready at ${url}`));
};

main();
