import {InputType, Field, ID, Int, ObjectType, Query, Arg, Mutation, Resolver, Directive, Authorized} from 'type-graphql';
import {User as DB, ROLE} from '../../entity/User';

@Directive('@extends')
@Directive(`@key(fields: "id")`)
@ObjectType('User') // typegraphql
class User {
  @Field(() => ID, {defaultValue: ''})
  @Directive('@external')
  id: string;
}

@InputType()
class UserFilter {
  @Field({defaultValue: ''})
  q: string;

  @Field(() => ID, {defaultValue: ''})
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
  @Authorized(ROLE.ADMIN)
  @Query(() => User) // return one
  async User(@Arg('id', () => ID) id: string) {
    const user = await DB.findOne({id: id});
    if (user === undefined) {
      throw Error('The id does not exist.');
    }
    return user;
  }

  @Authorized(ROLE.ADMIN)
  @Query(() => [User]) // return array
  async allUsers(
    @Arg('page', () => Int, {defaultValue: 0}) page: number, // 0
    @Arg('perPage', () => Int, {defaultValue: 0}) perPage: number, // 10
    @Arg('sortField', {defaultValue: ''}) sortField: string, // id, username
    @Arg('sortOrder', {defaultValue: ''}) sortOrder: 'ASC' | 'DESC', // ASC, DESC
    @Arg('filter', {defaultValue: null}) filter: UserFilter,
  ) {
    // https://github.com/typeorm/typeorm/blob/master/docs/select-query-builder.md
    const users = await DB.createQueryBuilder('user')
      .orderBy(sortField, sortOrder)
      .offset(page * perPage)
      .limit(perPage)
      .getMany();
    return users;
  }

  @Authorized(ROLE.ADMIN)
  @Query(() => ListMetadata) // return array
  async _allUsersMeta(
    @Arg('page', () => Int, {defaultValue: 0}) page: number,
    @Arg('perPage', () => Int, {defaultValue: 0}) perPage: number,
    @Arg('sortField', {defaultValue: ''}) sortField: string,
    @Arg('sortOrder', {defaultValue: ''}) sortOrder: string,
    @Arg('filter', {defaultValue: null}) filter: UserFilter,
  ) {
    const meta = {
      count: await DB.count(),
    };
    return meta;
  }

  @Authorized(ROLE.ADMIN)
  @Mutation(() => User)
  async createUser(@Arg('id', () => ID) id: string, @Arg('username') username: string, @Arg('password') password: string) {
    let user = await DB.findOne(id);
    if (user != undefined) {
      throw new Error('This ID already exists.');
    }
    user = DB.create({id: id, username: username, password: password});
    await user.save();
    return user;
  }

  @Authorized(ROLE.ADMIN)
  @Mutation(() => User)
  async updateUser(@Arg('id', () => ID) id: string, @Arg('username') username: string) {
    const user = await DB.findOne({id: id});
    if (user === undefined) {
      throw new Error('The id does not exist.');
    }
    user.username = username;
    await user.save();
    return user;
  }

  @Authorized(ROLE.ADMIN)
  @Mutation(() => User)
  async deleteUser(@Arg('id', () => ID) id: string) {
    const user = await DB.findOne({id: id});
    if (user === undefined) {
      throw new Error('Deletion failed.');
    }

    await DB.delete(user);
    return user;
  }
}
