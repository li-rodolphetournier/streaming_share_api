import { Library } from "./Library";
import { MediaRating } from "./MediaRating";
import { UserPreference } from "./UserPreference";
import { WatchHistory } from "./WatchHistory";
export type UserRole = "admin" | "user";
export declare class User {
    id: number;
    email: string;
    password: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    isActive: boolean;
    emailVerified: boolean;
    lastLogin?: Date;
    loginAttempts: number;
    lockedUntil?: Date;
    createdAt: Date;
    updatedAt: Date;
    libraries: Library[];
    watchHistory: WatchHistory[];
    ratings: MediaRating[];
    preferences: UserPreference;
    get fullName(): string;
    get isLocked(): boolean;
    incrementLoginAttempts(): void;
    resetLoginAttempts(): void;
    isAdmin(): boolean;
    getStats(): {
        totalWatchTime: number;
        favoriteGenres: string[];
        totalRatings: number;
    };
}
//# sourceMappingURL=User.d.ts.map