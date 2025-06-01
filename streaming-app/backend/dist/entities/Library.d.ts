import { Media } from "./Media";
import { User } from "./User";
export type LibraryType = "movie" | "tv" | "music" | "photo";
export declare class Library {
    id: number;
    name: string;
    path: string;
    type: LibraryType;
    description?: string;
    isActive: boolean;
    lastScanDate?: Date;
    scanInProgress: boolean;
    autoScan: boolean;
    scanInterval: number;
    createdAt: Date;
    updatedAt: Date;
    owner: User;
    medias: Media[];
    get mediaCount(): number;
    get totalSize(): number;
    get formattedTotalSize(): string;
    needsScan(): boolean;
    startScan(): void;
    finishScan(): void;
}
//# sourceMappingURL=Library.d.ts.map