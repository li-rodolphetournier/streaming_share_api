import { User } from "../graphql/types/User";

export class AuthService {
  async login(email: string, password: string, rememberMe?: boolean) {
    // Mock implementation
    const mockUser: User = {
      id: 1,
      email,
      firstName: "Mock",
      lastName: "User",
      role: "user" as any,
      avatar: undefined,
      isActive: true,
      emailVerified: true,
      lastLogin: new Date(),
      loginAttempts: 0,
      lockedUntil: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      get fullName() {
        return `${this.firstName} ${this.lastName}`;
      },
      get isLocked() {
        return false;
      },
    };

    return {
      user: mockUser,
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
      expiresIn: 3600,
    };
  }

  async generateTokens(user: User) {
    return {
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
      expiresIn: 3600,
    };
  }

  async forgotPassword(email: string) {
    // Mock implementation
    return true;
  }

  async resetPassword(token: string, password: string) {
    // Mock implementation
    return true;
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ) {
    // Mock implementation
    return true;
  }

  async refreshToken(refreshToken: string) {
    const mockUser: User = {
      id: 1,
      email: "mock@example.com",
      firstName: "Mock",
      lastName: "User",
      role: "user" as any,
      avatar: undefined,
      isActive: true,
      emailVerified: true,
      lastLogin: new Date(),
      loginAttempts: 0,
      lockedUntil: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      get fullName() {
        return `${this.firstName} ${this.lastName}`;
      },
      get isLocked() {
        return false;
      },
    };

    return {
      user: mockUser,
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
      expiresIn: 3600,
    };
  }

  async logout(userId: number) {
    // Mock implementation
    return true;
  }

  async verifyEmail(token: string) {
    // Mock implementation
    return true;
  }

  async resendVerificationEmail(email: string) {
    // Mock implementation
    return true;
  }
}
