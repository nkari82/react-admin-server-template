import {ApolloServer} from 'apollo-server-express';
import Express from 'express';
import {Arg, Directive, ID, Query, Resolver} from 'type-graphql';
import {createConnection, getConnectionManager} from 'typeorm';
import {buildFederatedSchema} from '../helper/buildFederatedSchema';
import {User} from '../entity/User';
import jwt from 'jsonwebtoken';

const host = 'localhost';
const port = 4002;

export async function resolveUserReference(reference: Pick<User, 'id'>): Promise<User> {
  const user = await User.findOne(reference.id);
  if (user === undefined) return new User(); // dummy
  return user;
}

@Resolver(of => User) // typegraphql
class AccountResolver {
  // https://www.apollographql.com/blog/setting-up-authentication-and-authorization-with-apollo-federation/
  @Query(() => String)
  async login(@Arg('id', () => ID) id: string, @Arg('password') password: string) {
    const user = await User.findOne(id);
    if (user === undefined) {
      throw new Error('The id does not exist.');
    }

    if (user.id == id && user.password == password) {
      return jwt.sign({role: user.role}, 'f1BtnWgD3VKY', {
        algorithm: 'HS256',
        subject: id,
        expiresIn: '1d',
      });
    }
    throw new Error('The ID or password was entered incorrectly.');
  }

  @Query(() => User)
  async Test() {
    const user = await User.findOne('1');
    return user;
  }

  @Query(() => String)
  async hello() {
    return 'Hello!';
  }
}

export async function listen(): Promise<string> {
  const schema = await buildFederatedSchema(
    {
      resolvers: [AccountResolver],
      orphanedTypes: [User],
      emitSchemaFile: {
        path: __dirname + '/account.gql',
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
  app.listen(port, () => console.log(`🚀Account Server ready at ${url}`));
  return url;
}
