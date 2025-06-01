import { Field, ID, ObjectType, registerEnumType } from "type-graphql";
import { IsEmail, IsOptional, Length } from "class-validator";

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  MODERATOR = "moderator",
}

registerEnumType(UserRole, {
  name: "UserRole",
  description: "Rôles disponibles pour les utilisateurs",
});

@ObjectType()
export class User {
  @Field(() => ID)
  id!: number;

  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @Length(2, 50)
  firstName!: string;

  @Field()
  @Length(2, 50)
  lastName!: string;

  @Field(() => UserRole)
  role!: UserRole;

  @Field({ nullable: true })
  @IsOptional()
  avatar?: string;

  @Field()
  isActive!: boolean;

  @Field()
  emailVerified!: boolean;

  @Field({ nullable: true })
  lastLogin?: Date;

  @Field()
  loginAttempts!: number;

  @Field({ nullable: true })
  lockedUntil?: Date;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  // Champs calculés
  @Field()
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  @Field()
  get isLocked(): boolean {
    return this.lockedUntil ? this.lockedUntil > new Date() : false;
  }
}

@ObjectType()
export class AuthPayload {
  @Field(() => User)
  user!: User;

  @Field()
  accessToken!: string;

  @Field()
  refreshToken!: string;

  @Field()
  expiresIn!: number;

  @Field()
  tokenType!: string;
}

@ObjectType()
export class UserConnection {
  @Field(() => [User])
  nodes!: User[];

  @Field()
  totalCount!: number;

  @Field()
  hasNextPage!: boolean;

  @Field()
  hasPreviousPage!: boolean;
}
