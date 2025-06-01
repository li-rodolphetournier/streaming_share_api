import { Media } from "./Media";
import { User } from "./User";
export declare class MediaRating {
    id: number;
    rating: number;
    review?: string;
    isSpoiler: boolean;
    helpfulCount: number;
    reportedCount: number;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    media: Media;
    get formattedRating(): string;
    get ratingStars(): string;
    isValidRating(): boolean;
    incrementHelpful(): void;
    incrementReported(): void;
    get isReported(): boolean;
    get helpfulRatio(): number;
}
//# sourceMappingURL=MediaRating.d.ts.map