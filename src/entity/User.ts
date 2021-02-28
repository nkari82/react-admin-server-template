import jwt from 'jsonwebtoken';
import {Arg, Authorized, Directive, Field, ID, InputType, Int, Mutation, ObjectType, Query, Resolver} from 'type-graphql';
import {Entity, Column, PrimaryColumn, BeforeInsert, BaseEntity} from 'typeorm';
import * as uuid from 'uuid';

// example simple role
enum ROLE {
  GUEST,
  USER,
  ADMIN,
}

@Directive(`@key(fields: "id")`)
@ObjectType('User') // typegraphql
@Entity('users') //typeorm
export class User extends BaseEntity {
  @PrimaryColumn()
  @Field(() => ID)
  id: string;

  @Column()
  @Field()
  password: string;

  @Column()
  @Field()
  username: string;

  @Column()
  uuid: string;

  @Column('int')
  @Field(() => Int)
  role: ROLE;

  @BeforeInsert()
  generateUUID() {
    this.uuid = uuid.v4();
  }
}

//
@InputType()
class UserFilter {
  @Field({defaultValue: ''})
  q: string;

  @Field(() => ID)
  id: string;

  @Field({defaultValue: ''})
  title: string;

  @Field(() => Int, {defaultValue: 0})
  views: number;

  @Field(() => Int, {defaultValue: 0})
  views_lt: number;

  @Field(() => Int, {defaultValue: 0})
  views_lte: number;

  @Field(() => Int, {defaultValue: 0})
  views_gt: number;

  @Field(() => Int, {defaultValue: 0})
  views_gte: number;

  @Field(() => ID, {defaultValue: ''})
  user_id: string;
}

@ObjectType()
class ListMetadata {
  @Field(() => Int, {defaultValue: 0})
  count: number;
}

// https://typegraphql.com/docs/0.17.0/resolvers.html
@Resolver(of => User) // typegraphql
export class UserResolver {
  //@Authorized('ADMIN')
  @Query(() => User) // return one
  async User(@Arg('id', () => ID) id: string) {
    const user = await User.findOne({id: id});
    if (user === undefined) {
      throw Error('The id does not exist.');
    }
    return user;
  }

  //@Authorized('ADMIN')
  @Query(() => [User]) // return array
  async allUsers(
    @Arg('page', () => Int, {defaultValue: 0}) page: number, // 0
    @Arg('perPage', () => Int, {defaultValue: 0}) perPage: number, // 10
    @Arg('sortField', {defaultValue: ''}) sortField: string, // id, username
    @Arg('sortOrder', {defaultValue: ''}) sortOrder: 'ASC' | 'DESC', // ASC, DESC
    @Arg('userFilter', {defaultValue: new UserFilter()}) userFilter: UserFilter,
  ) {
    // https://github.com/typeorm/typeorm/blob/master/docs/select-query-builder.md
    const users = await User.createQueryBuilder('user')
      .orderBy(sortField, sortOrder)
      .offset(page * perPage)
      .limit(perPage)
      .getMany();
    return users;
  }

  @Query(() => ListMetadata) // return array
  async _allUsersMeta(
    @Arg('page', () => Int, {defaultValue: 0}) page: number,
    @Arg('perPage', () => Int, {defaultValue: 0}) perPage: number,
    @Arg('sortField', {defaultValue: ''}) sortField: string,
    @Arg('sortOrder', {defaultValue: ''}) sortOrder: string,
    @Arg('userFilter', {defaultValue: new UserFilter()}) userFilter: UserFilter,
  ) {
    const meta = {
      count: await User.count(),
    };
    return meta;
  }

  //@Authorized('ADMIN')
  @Mutation(() => User)
  async createUser(@Arg('id', () => ID) id: string, @Arg('username') username: string, @Arg('password') password: string) {
    let user = await User.findOne(id);
    if (user != undefined) {
      throw new Error('This ID already exists.');
    }
    user = User.create({id: id, username: username, password: password});
    await user.save();
    return user;
  }

  //@Authorized('ADMIN')
  @Mutation(() => User)
  async updateUser(@Arg('id', () => ID) id: string, @Arg('username') username: string) {
    const user = await User.findOne({id: id});
    if (user === undefined) {
      throw new Error('The id does not exist.');
    }
    user.username = username;
    await user.save();
    return user;
  }

  //@Authorized('ADMIN')
  @Mutation(() => User)
  async deleteUser(@Arg('id', () => ID) id: string) {
    const user = await User.findOne({id: id});
    if (user === undefined) {
      throw new Error('Deletion failed.');
    }

    await User.delete(user);
    return user;
  }
}

@Resolver() // typegraphql
export class AccountResolver {
  // Auth server
  // https://www.apollographql.com/blog/setting-up-authentication-and-authorization-with-apollo-federation/
  @Query(() => String)
  async login(@Arg('id', () => ID) id: string, @Arg('password') password: string, @Arg('role', () => Int, {defaultValue: 0}) role: number) {
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

  @Query(() => String)
  async hello(@Arg('id', () => ID) id: string, @Arg('password') password: string) {
    return 'Hello!';
  }
}

export async function resolveUserReference(reference: Pick<User, 'id'>): Promise<User> {
  const user = await User.findOne(reference.id);
  if (user === undefined) throw new Error('undefined!');
  return user;
}
