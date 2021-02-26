import {Arg, Args, ArgsType, Field, ID, InputType, Int, Mutation, ObjectType, Query, Resolver} from 'type-graphql';
import {Entity, Column, PrimaryColumn, BeforeInsert, BaseEntity, PrimaryGeneratedColumn} from 'typeorm';
import * as uuid from 'uuid';

@ObjectType() // typegraphql
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

@Resolver() // typegraphql
export class UserResolver {
  @Query(() => User) // return one
  async User(@Arg('id', () => ID) id: string) {
    const user = await User.findOne({id: id});
    if (user === undefined) {
      throw Error('The id does not exist.');
    }
    return user;
  }

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

  // https://typegraphql.com/docs/0.17.0/resolvers.html
  @Mutation(() => User)
  async updateUser(@Arg('id', () => ID) id: string, @Arg('username') username: string) {
    const user = await User.findOne({id: id});
    if (user === undefined) {
      throw new Error('The id does not exist.');
    }
    user.username = username;
    return user;
  }

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
