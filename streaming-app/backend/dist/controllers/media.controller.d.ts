import { Request, Response } from "express";
export declare class MediaController {
    private mediaService;
    constructor();
    createMedia: (req: Request, res: Response) => Promise<void>;
    getMediaById: (req: Request, res: Response) => Promise<void>;
    searchMedias: (req: Request, res: Response) => Promise<void>;
    getPopularMedias: (req: Request, res: Response) => Promise<void>;
    getRecentMedias: (req: Request, res: Response) => Promise<void>;
    getRecommendations: (req: Request, res: Response) => Promise<void>;
    updateMedia: (req: Request, res: Response) => Promise<void>;
    deleteMedia: (req: Request, res: Response) => Promise<void>;
    recordView: (req: Request, res: Response) => Promise<void>;
    updateWatchProgress: (req: Request, res: Response) => Promise<void>;
    getWatchHistory: (req: Request, res: Response) => Promise<void>;
    getMediaStats: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=media.controller.d.ts.map