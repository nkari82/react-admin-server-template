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
  username: string;

  @Column()
  @Field()
  password: string;

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
    const user = await User.find({id: id});
    if (user === undefined) {
      throw Error(id);
    }
    return user;
  }

  @Query(() => [User]) // return array
  async allUsers(
    @Arg('page', () => Int, {defaultValue: 0}) page: number,
    @Arg('perPage', () => Int, {defaultValue: 0}) perPage: number,
    @Arg('sortField', {defaultValue: ''}) sortField: string,
    @Arg('sortOrder', {defaultValue: ''}) sortOrder: string,
    @Arg('userFilter', {defaultValue: new UserFilter()}) userFilter: UserFilter,
  ) {
    return await User.find();
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
      count: (await User.find()).length,
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
    const user = await User.findOneOrFail({id: id});
    if (user === undefined) {
      throw new Error(id);
    }
    user.username = username;
    return user;
  }

  @Mutation(() => User)
  async deleteUser(@Arg('id', () => ID) id: string) {
    const user = await User.findOneOrFail({id: id});
    if (user === undefined) {
      throw new Error(id);
    }

    await User.remove(user);
    return user;
  }
}
