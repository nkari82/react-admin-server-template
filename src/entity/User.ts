import {Arg, Args, ArgsType, Field, ID, InputType, Int, ObjectType, Query, Resolver} from 'type-graphql';
import {Entity, Column, PrimaryColumn, BeforeInsert, BaseEntity, PrimaryGeneratedColumn} from 'typeorm';
import * as uuid from 'uuid';

@ObjectType() // typegraphql
@Entity('users') //typeorm
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  @Field(() => ID)
  id: string;

  @Column()
  @Field()
  username: string;
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

@Resolver() // type graphql
export class UserResolver {
  @Query(() => User) // return one
  async User(@Arg('id') id: string) {
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

  @Query(() => String)
  async Test(@Arg('id', {defaultValue: 'default'}) id: string) {
    return id;
  }
}
