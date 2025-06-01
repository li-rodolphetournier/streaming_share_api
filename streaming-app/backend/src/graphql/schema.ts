import "reflect-metadata";

import { AuthResolver } from "./resolvers/AuthResolver";
import { GraphQLContext } from "./context";
import { MediaResolver } from "./resolvers/MediaResolver";
import { buildSchema } from "type-graphql";

// Fonction d'autorisation personnalisée
export const customAuthChecker = (
  { context }: { context: GraphQLContext },
  roles: string[]
) => {
  // Vérifier si l'utilisateur est authentifié
  if (!context.isAuthenticated || !context.user) {
    return false;
  }

  // Si aucun rôle spécifique n'est requis, l'authentification suffit
  if (!roles || roles.length === 0) {
    return true;
  }

  // Vérifier si l'utilisateur a l'un des rôles requis
  return roles.includes(context.user.role);
};

export const createGraphQLSchema = async () => {
  try {
    const schema = await buildSchema({
      resolvers: [AuthResolver, MediaResolver],
      authChecker: customAuthChecker,
      validate: true,
      emitSchemaFile:
        process.env.NODE_ENV === "development" ? "schema.gql" : false,
    });

    return schema;
  } catch (error) {
    console.error("Erreur lors de la création du schéma GraphQL:", error);
    throw error;
  }
};
