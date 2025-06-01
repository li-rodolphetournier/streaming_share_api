import { NextFunction, Request, Response } from "express";
export declare class AuthMiddleware {
    private authService;
    constructor();
    authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    requireAdmin: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const authMiddleware: AuthMiddleware;
//# sourceMappingURL=auth.middleware.d.ts.map