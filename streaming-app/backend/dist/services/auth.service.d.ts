import { User, UserRole } from "../entities/User";
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
export declare class AuthService {
    private userRepository;
    private userPreferenceRepository;
    constructor();
    register(data: RegisterData): Promise<AuthTokens>;
    login(credentials: LoginCredentials): Promise<AuthTokens>;
    refreshToken(refreshToken: string): Promise<AuthTokens>;
    verifyAccessToken(token: string): Promise<User>;
    changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void>;
    resetPassword(email: string, newPassword: string): Promise<void>;
    getUserProfile(userId: number): Promise<User>;
    updateProfile(userId: number, data: Partial<Pick<User, "firstName" | "lastName" | "avatar">>): Promise<User>;
    private generateTokens;
    createAdminUser(email: string, password: string, firstName?: string, lastName?: string): Promise<User>;
}
//# sourceMappingURL=auth.service.d.ts.map