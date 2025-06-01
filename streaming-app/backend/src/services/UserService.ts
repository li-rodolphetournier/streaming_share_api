import { User } from "../graphql/types/User";

export class UserService {
  async findById(id: number): Promise<User | null> {
    // Mock implementation
    const mockUser: User = {
      id,
      email: "mock@example.com",
      firstName: "Mock",
      lastName: "User",
      role: "user" as any,
      avatar: undefined,
      isActive: true,
      emailVerified: true,
      lastLogin: undefined,
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

    return mockUser;
  }

  async findByEmail(email: string): Promise<User | null> {
    // Mock implementation - return null to simulate user not found
    return null;
  }

  async create(userData: any): Promise<User> {
    // Mock implementation
    const mockUser: User = {
      id: Math.floor(Math.random() * 1000),
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role as any,
      avatar: userData.avatar || undefined,
      isActive: userData.isActive || true,
      emailVerified: userData.emailVerified || false,
      lastLogin: undefined,
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

    return mockUser;
  }
}
