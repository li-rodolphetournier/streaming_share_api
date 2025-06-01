import { Field, InputType } from "type-graphql";
import { IsEmail, IsOptional, Length, Matches } from "class-validator";

@InputType()
export class LoginInput {
  @Field()
  @IsEmail({}, { message: "Email invalide" })
  email!: string;

  @Field()
  @Length(6, 100, {
    message: "Le mot de passe doit contenir entre 6 et 100 caractères",
  })
  password!: string;

  @Field({ nullable: true })
  @IsOptional()
  rememberMe?: boolean;
}

@InputType()
export class RegisterInput {
  @Field()
  @IsEmail({}, { message: "Email invalide" })
  email!: string;

  @Field()
  @Length(6, 100, {
    message: "Le mot de passe doit contenir entre 6 et 100 caractères",
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      "Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial",
  })
  password!: string;

  @Field()
  @Length(6, 100, { message: "Confirmation du mot de passe requise" })
  confirmPassword!: string;

  @Field()
  @Length(2, 50, {
    message: "Le prénom doit contenir entre 2 et 50 caractères",
  })
  firstName!: string;

  @Field()
  @Length(2, 50, { message: "Le nom doit contenir entre 2 et 50 caractères" })
  lastName!: string;
}

@InputType()
export class ForgotPasswordInput {
  @Field()
  @IsEmail({}, { message: "Email invalide" })
  email!: string;
}

@InputType()
export class ResetPasswordInput {
  @Field()
  token!: string;

  @Field()
  @Length(6, 100, {
    message: "Le mot de passe doit contenir entre 6 et 100 caractères",
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      "Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial",
  })
  password!: string;

  @Field()
  @Length(6, 100, { message: "Confirmation du mot de passe requise" })
  confirmPassword!: string;
}

@InputType()
export class ChangePasswordInput {
  @Field()
  @Length(6, 100, { message: "Mot de passe actuel requis" })
  currentPassword!: string;

  @Field()
  @Length(6, 100, {
    message: "Le nouveau mot de passe doit contenir entre 6 et 100 caractères",
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      "Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial",
  })
  newPassword!: string;

  @Field()
  @Length(6, 100, { message: "Confirmation du nouveau mot de passe requise" })
  confirmNewPassword!: string;
}

@InputType()
export class RefreshTokenInput {
  @Field()
  refreshToken!: string;
}
