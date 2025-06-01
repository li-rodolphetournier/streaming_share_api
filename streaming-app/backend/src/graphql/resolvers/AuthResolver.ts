import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { AuthService } from "../../services/AuthService";
import { UserService } from "../../services/UserService";
import { GraphQLContext } from "../context";
import {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RefreshTokenInput,
  RegisterInput,
  ResetPasswordInput,
} from "../inputs/AuthInputs";
import { AuthPayload, User } from "../types/User";

@Resolver(() => User)
export class AuthResolver {
  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  @Query(() => User, { nullable: true })
  @Authorized()
  async me(@Ctx() ctx: GraphQLContext): Promise<User | null> {
    if (!ctx.user) {
      return null;
    }

    try {
      const user = await this.userService.findById(ctx.user.id);
      return user;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
      return null;
    }
  }

  @Mutation(() => AuthPayload)
  async login(@Arg("input") input: LoginInput): Promise<AuthPayload> {
    try {
      const result = await this.authService.login(
        input.email,
        input.password,
        input.rememberMe
      );

      return {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
        tokenType: "Bearer",
      };
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      throw new Error("Identifiants invalides");
    }
  }

  @Mutation(() => AuthPayload)
  async register(@Arg("input") input: RegisterInput): Promise<AuthPayload> {
    // Vérifier que les mots de passe correspondent
    if (input.password !== input.confirmPassword) {
      throw new Error("Les mots de passe ne correspondent pas");
    }

    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await this.userService.findByEmail(input.email);
      if (existingUser) {
        throw new Error("Un utilisateur avec cet email existe déjà");
      }

      // Créer l'utilisateur
      const user = await this.userService.create({
        email: input.email,
        password: input.password,
        firstName: input.firstName,
        lastName: input.lastName,
        role: "user",
        isActive: true,
        emailVerified: false,
      });

      // Générer les tokens
      const tokens = await this.authService.generateTokens(user);

      return {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        tokenType: "Bearer",
      };
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      throw new Error("Erreur lors de la création du compte");
    }
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("input") input: ForgotPasswordInput
  ): Promise<boolean> {
    try {
      await this.authService.forgotPassword(input.email);
      return true;
    } catch (error) {
      console.error("Erreur lors de la demande de réinitialisation:", error);
      // Ne pas révéler si l'email existe ou non pour des raisons de sécurité
      return true;
    }
  }

  @Mutation(() => Boolean)
  async resetPassword(
    @Arg("input") input: ResetPasswordInput
  ): Promise<boolean> {
    // Vérifier que les mots de passe correspondent
    if (input.password !== input.confirmPassword) {
      throw new Error("Les mots de passe ne correspondent pas");
    }

    try {
      await this.authService.resetPassword(input.token, input.password);
      return true;
    } catch (error) {
      console.error("Erreur lors de la réinitialisation:", error);
      throw new Error("Token invalide ou expiré");
    }
  }

  @Mutation(() => Boolean)
  @Authorized()
  async changePassword(
    @Arg("input") input: ChangePasswordInput,
    @Ctx() ctx: GraphQLContext
  ): Promise<boolean> {
    if (!ctx.user) {
      throw new Error("Utilisateur non authentifié");
    }

    // Vérifier que les nouveaux mots de passe correspondent
    if (input.newPassword !== input.confirmNewPassword) {
      throw new Error("Les nouveaux mots de passe ne correspondent pas");
    }

    try {
      await this.authService.changePassword(
        ctx.user.id,
        input.currentPassword,
        input.newPassword
      );
      return true;
    } catch (error) {
      console.error("Erreur lors du changement de mot de passe:", error);
      throw new Error("Mot de passe actuel incorrect");
    }
  }

  @Mutation(() => AuthPayload)
  async refreshToken(
    @Arg("input") input: RefreshTokenInput
  ): Promise<AuthPayload> {
    try {
      const result = await this.authService.refreshToken(input.refreshToken);

      return {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
        tokenType: "Bearer",
      };
    } catch (error) {
      console.error("Erreur lors du refresh token:", error);
      throw new Error("Token de rafraîchissement invalide");
    }
  }

  @Mutation(() => Boolean)
  @Authorized()
  async logout(@Ctx() ctx: GraphQLContext): Promise<boolean> {
    if (!ctx.user) {
      throw new Error("Utilisateur non authentifié");
    }

    try {
      await this.authService.logout(ctx.user.id);
      return true;
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      throw new Error("Erreur lors de la déconnexion");
    }
  }

  @Mutation(() => Boolean)
  @Authorized()
  async verifyEmail(
    @Arg("token") token: string,
    @Ctx() ctx: GraphQLContext
  ): Promise<boolean> {
    if (!ctx.user) {
      throw new Error("Utilisateur non authentifié");
    }

    try {
      await this.authService.verifyEmail(token);
      return true;
    } catch (error) {
      console.error("Erreur lors de la vérification email:", error);
      throw new Error("Token de vérification invalide");
    }
  }

  @Mutation(() => Boolean)
  @Authorized()
  async resendVerificationEmail(@Ctx() ctx: GraphQLContext): Promise<boolean> {
    if (!ctx.user) {
      throw new Error("Utilisateur non authentifié");
    }

    try {
      await this.authService.resendVerificationEmail(ctx.user.email);
      return true;
    } catch (error) {
      console.error("Erreur lors du renvoi de l'email de vérification:", error);
      throw new Error("Erreur lors du renvoi de l'email de vérification");
    }
  }
}
