import {ApolloServer} from 'apollo-server-express';
import Express from 'express';
import {Arg, ID, Query, Resolver} from 'type-graphql';
import {createConnection, getConnectionManager} from 'typeorm';
import {buildFederatedSchema} from '../common/buildFederatedSchema';
import {User} from '../entity/User';
import jwt from 'jsonwebtoken';
import {authChecker} from '../common/authChecker';

const host = 'localhost';
const port = 4002;

export async function resolveUserReference(reference: Pick<User, 'id'>): Promise<User> {
  const user = await User.findOne(reference.id);
  if (user === undefined) return new User(); // dummy
  return user;
}

@Resolver(of => User) // typegraphql
class AccountResolver {
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
      authChecker: authChecker,
      authMode: 'null',
    },
    {
      User: {__resolveReference: resolveUserReference},
    },
  );

  const server = new ApolloServer({
    schema,
    context: (res: any) => {
      const token = res.req.headers?.authorization;
      const context = {
        auth: token,
      };
      return context;
    },
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
