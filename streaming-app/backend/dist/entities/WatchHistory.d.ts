import { Media } from "./Media";
import { User } from "./User";
export declare class WatchHistory {
    id: number;
    watchedDuration: number;
    totalDuration: number;
    progressPercentage: number;
    isCompleted: boolean;
    lastWatched: Date;
    watchCount: number;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    media: Media;
    updateProgress(currentTime: number, totalDuration?: number): void;
    incrementWatchCount(): void;
    get formattedProgress(): string;
    get remainingTime(): number;
    get formattedRemainingTime(): string;
}
//# sourceMappingURL=WatchHistory.d.ts.map