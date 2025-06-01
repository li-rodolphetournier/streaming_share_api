import { User, UserRole } from "../entities/User";

import { AppDataSource } from "../config/database";
import { Repository } from "typeorm";
import { UserPreference } from "../entities/UserPreference";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: Partial<User>;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
  type: "access" | "refresh";
}

export class AuthService {
  private userRepository: Repository<User>;
  private userPreferenceRepository: Repository<UserPreference>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.userPreferenceRepository = AppDataSource.getRepository(UserPreference);
  }

  // Inscription d'un nouvel utilisateur
  async register(data: RegisterData): Promise<AuthTokens> {
    const { email, password, firstName, lastName } = data;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new Error("Un utilisateur avec cet email existe déjà");
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'utilisateur
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: "user",
      isActive: true,
      emailVerified: false,
    });

    const savedUser = await this.userRepository.save(user);

    // Créer les préférences par défaut
    const preferences = this.userPreferenceRepository.create({
      user: savedUser,
    });
    preferences.initializeDefaults();
    await this.userPreferenceRepository.save(preferences);

    // Générer les tokens
    return this.generateTokens(savedUser);
  }

  // Connexion d'un utilisateur
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const { email, password } = credentials;

    // Trouver l'utilisateur
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ["preferences"],
    });

    if (!user) {
      throw new Error("Email ou mot de passe incorrect");
    }

    // Vérifier si le compte est verrouillé
    if (user.isLocked) {
      throw new Error("Compte temporairement verrouillé. Réessayez plus tard.");
    }

    if (!user.isActive) {
      throw new Error("Compte désactivé");
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Incrémenter les tentatives de connexion
      user.incrementLoginAttempts();
      await this.userRepository.save(user);
      throw new Error("Email ou mot de passe incorrect");
    }

    // Réinitialiser les tentatives de connexion
    user.resetLoginAttempts();
    await this.userRepository.save(user);

    // Générer les tokens
    return this.generateTokens(user);
  }

  // Rafraîchir le token d'accès
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!
      ) as JwtPayload;

      if (payload.type !== "refresh") {
        throw new Error("Token invalide");
      }

      const user = await this.userRepository.findOne({
        where: { id: payload.userId },
        relations: ["preferences"],
      });

      if (!user || !user.isActive) {
        throw new Error("Utilisateur non trouvé ou inactif");
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new Error("Token de rafraîchissement invalide");
    }
  }

  // Vérifier un token d'accès
  async verifyAccessToken(token: string): Promise<User> {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

      if (payload.type !== "access") {
        throw new Error("Token invalide");
      }

      const user = await this.userRepository.findOne({
        where: { id: payload.userId },
        relations: ["preferences"],
      });

      if (!user || !user.isActive) {
        throw new Error("Utilisateur non trouvé ou inactif");
      }

      return user;
    } catch (error) {
      throw new Error("Token d'accès invalide");
    }
  }

  // Changer le mot de passe
  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      throw new Error("Mot de passe actuel incorrect");
    }

    // Hasher le nouveau mot de passe
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Mettre à jour le mot de passe
    user.password = hashedNewPassword;
    await this.userRepository.save(user);
  }

  // Réinitialiser le mot de passe (version simplifiée)
  async resetPassword(email: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Mettre à jour le mot de passe
    user.password = hashedPassword;
    user.loginAttempts = 0;
    user.lockedUntil = undefined;
    await this.userRepository.save(user);
  }

  // Obtenir le profil utilisateur
  async getUserProfile(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["preferences", "libraries"],
    });

    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    return user;
  }

  // Mettre à jour le profil utilisateur
  async updateProfile(
    userId: number,
    data: Partial<Pick<User, "firstName" | "lastName" | "avatar">>
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    Object.assign(user, data);
    return this.userRepository.save(user);
  }

  // Générer les tokens JWT
  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload: Omit<JwtPayload, "type"> = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(
      { ...payload, type: "access" },
      process.env.JWT_SECRET!,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { ...payload, type: "refresh" },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: "7d" }
    );

    // Retourner les données utilisateur sans le mot de passe
    const { password, ...userWithoutPassword } = user;

    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword,
    };
  }

  // Créer un utilisateur admin (pour les seeds)
  async createAdminUser(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: "admin",
      isActive: true,
      emailVerified: true,
    });

    const savedAdmin = await this.userRepository.save(admin);

    // Créer les préférences par défaut
    const preferences = this.userPreferenceRepository.create({
      user: savedAdmin,
    });
    preferences.initializeDefaults();
    await this.userPreferenceRepository.save(preferences);

    return savedAdmin;
  }
}
