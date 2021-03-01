import 'reflect-metadata';
import {ApolloGateway, RemoteGraphQLDataSource} from '@apollo/gateway';
import {ApolloServer} from 'apollo-server-express';
import Express from 'express';
import expressJwt from 'express-jwt';
import * as admin from './admin';
import * as account from './account';

const host = 'localhost';
const port = 4000;

class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  willSendRequest(res: any) {
    const request = res.request;
    const context = res.context;
    request.http.headers.set('authorization', context.auth);
  }
}

const main = async () => {
  const gateway = new ApolloGateway({
    serviceList: [
      {name: 'account', url: await account.listen()},
      {name: 'admin', url: await admin.listen()},
    ],
    buildService({name, url}) {
      return new AuthenticatedDataSource({url});
    },
  });

  // Connect to the gateway port 4000 with the token that is the result of logging in to the 4002 port of the Account.
  const {schema, executor} = await gateway.load();
  const server = new ApolloServer({
    schema,
    executor,
    tracing: false,
    playground: true,
    subscriptions: false,
    context: (res: any) => {
      const token = res.req.headers?.authorization;
      const context = {
        auth: token,
      };
      return context;
    },
  });

  const app = Express();
  app.use(
    expressJwt({
      secret: 'f1BtnWgD3VKY',
      algorithms: ['HS256'],
      credentialsRequired: false,
    }),
  );
  server.applyMiddleware({app});

  const url = `http://${host}:${port}${server.graphqlPath}`;
  app.listen(port, () => console.log(`🚀Gateway Server ready at ${url}`));
};

main();
