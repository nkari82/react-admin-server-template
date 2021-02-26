import 'reflect-metadata';
import {ApolloServer} from 'apollo-server-express';
import Express from 'express';
import {buildSchema} from 'type-graphql';
import {createConnection} from 'typeorm';
import {UserResolver} from './entity/User';

const main = async () => {
  const schema = await buildSchema({
    resolvers: [UserResolver],
  });

  const apolloServer = new ApolloServer({schema});

  const app = Express();

  apolloServer.applyMiddleware({app});

  await createConnection().then(() => {
    console.log('started');
  });

  app.listen(4000, () => {
    console.log('server started on http://localhost:4000/graphql');
  });
};

main();
