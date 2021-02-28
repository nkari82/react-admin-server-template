import {Directive, Field, ID, Int, ObjectType} from 'type-graphql';
import {Entity, Column, PrimaryColumn, BeforeInsert, BaseEntity} from 'typeorm';
import * as uuid from 'uuid';

// example simple role
export enum ROLE {
  GUEST,
  USER,
  ADMIN,
}

@Directive(`@key(fields: "id")`)
@ObjectType('User') // typegraphql
@Entity('Users') //typeorm
export class User extends BaseEntity {
  @Field(() => ID, {defaultValue: ''})
  @PrimaryColumn()
  id: string;

  @Field({defaultValue: ''})
  @Column()
  password: string;

  @Field({defaultValue: ''})
  @Column()
  username: string;

  @Column()
  uuid: string;

  @Field(() => Int, {defaultValue: 0})
  @Column('int', {default: 0})
  role: ROLE;

  @BeforeInsert()
  generateUUID() {
    this.uuid = uuid.v4();
  }
}
