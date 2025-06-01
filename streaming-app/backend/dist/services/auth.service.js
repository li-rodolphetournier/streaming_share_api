"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const User_1 = require("../entities/User");
const database_1 = require("../config/database");
const UserPreference_1 = require("../entities/UserPreference");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class AuthService {
    userRepository;
    userPreferenceRepository;
    constructor() {
        this.userRepository = database_1.AppDataSource.getRepository(User_1.User);
        this.userPreferenceRepository = database_1.AppDataSource.getRepository(UserPreference_1.UserPreference);
    }
    async register(data) {
        const { email, password, firstName, lastName } = data;
        const existingUser = await this.userRepository.findOne({
            where: { email },
        });
        if (existingUser) {
            throw new Error("Un utilisateur avec cet email existe déjà");
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
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
        const preferences = this.userPreferenceRepository.create({
            user: savedUser,
        });
        preferences.initializeDefaults();
        await this.userPreferenceRepository.save(preferences);
        return this.generateTokens(savedUser);
    }
    async login(credentials) {
        const { email, password } = credentials;
        const user = await this.userRepository.findOne({
            where: { email },
            relations: ["preferences"],
        });
        if (!user) {
            throw new Error("Email ou mot de passe incorrect");
        }
        if (user.isLocked) {
            throw new Error("Compte temporairement verrouillé. Réessayez plus tard.");
        }
        if (!user.isActive) {
            throw new Error("Compte désactivé");
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            user.incrementLoginAttempts();
            await this.userRepository.save(user);
            throw new Error("Email ou mot de passe incorrect");
        }
        user.resetLoginAttempts();
        await this.userRepository.save(user);
        return this.generateTokens(user);
    }
    async refreshToken(refreshToken) {
        try {
            const payload = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
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
        }
        catch (error) {
            throw new Error("Token de rafraîchissement invalide");
        }
    }
    async verifyAccessToken(token) {
        try {
            const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
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
        }
        catch (error) {
            throw new Error("Token d'accès invalide");
        }
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new Error("Utilisateur non trouvé");
        }
        const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new Error("Mot de passe actuel incorrect");
        }
        const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, 12);
        user.password = hashedNewPassword;
        await this.userRepository.save(user);
    }
    async resetPassword(email, newPassword) {
        const user = await this.userRepository.findOne({
            where: { email },
        });
        if (!user) {
            throw new Error("Utilisateur non trouvé");
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
        user.password = hashedPassword;
        user.loginAttempts = 0;
        user.lockedUntil = undefined;
        await this.userRepository.save(user);
    }
    async getUserProfile(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ["preferences", "libraries"],
        });
        if (!user) {
            throw new Error("Utilisateur non trouvé");
        }
        return user;
    }
    async updateProfile(userId, data) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new Error("Utilisateur non trouvé");
        }
        Object.assign(user, data);
        return this.userRepository.save(user);
    }
    async generateTokens(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
        };
        const accessToken = jsonwebtoken_1.default.sign({ ...payload, type: "access" }, process.env.JWT_SECRET, { expiresIn: "15m" });
        const refreshToken = jsonwebtoken_1.default.sign({ ...payload, type: "refresh" }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
        const { password, ...userWithoutPassword } = user;
        return {
            accessToken,
            refreshToken,
            user: userWithoutPassword,
        };
    }
    async createAdminUser(email, password, firstName, lastName) {
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
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
        const preferences = this.userPreferenceRepository.create({
            user: savedAdmin,
        });
        preferences.initializeDefaults();
        await this.userPreferenceRepository.save(preferences);
        return savedAdmin;
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map