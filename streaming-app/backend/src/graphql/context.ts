import { Request, Response } from "express";

import { User } from "./types/User";

export interface GraphQLContext {
  req: Request;
  res: Response;
  user?: User;
  isAuthenticated: boolean;
}

export const createGraphQLContext = async ({
  req,
  res,
}: {
  req: Request;
  res: Response;
}): Promise<GraphQLContext> => {
  // L'utilisateur sera ajouté par le middleware d'authentification
  const user = (req as any).user;

  return {
    req,
    res,
    user,
    isAuthenticated: !!user,
  };
};
