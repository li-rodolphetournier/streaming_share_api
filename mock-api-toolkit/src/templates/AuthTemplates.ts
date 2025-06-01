import type { MockAuthResponse, MockEndpoint, MockUser } from "../types";

// Utilisateurs de test par défaut
export const DEFAULT_MOCK_USERS: MockUser[] = [
  {
    id: 1,
    email: "admin@example.com",
    password: "admin123",
    firstName: "Admin",
    lastName: "User",
    role: "admin",
    isActive: true,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    preferences: {
      language: "fr",
      theme: "dark",
      notifications: true,
    },
    profile: {
      bio: "Administrateur système",
      avatar: "",
    },
    permissions: ["read", "write", "delete", "admin"],
  },
  {
    id: 2,
    email: "user@example.com",
    password: "user123",
    firstName: "Test",
    lastName: "User",
    role: "user",
    isActive: true,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    preferences: {
      language: "fr",
      theme: "light",
      notifications: true,
    },
    profile: {
      bio: "Utilisateur test",
      avatar: "",
    },
    permissions: ["read"],
  },
];

// Fonction pour créer une réponse d'authentification
function createAuthResponse(user: MockUser): MockAuthResponse {
  const { password, ...userWithoutPassword } = user;
  return {
    user: userWithoutPassword,
    accessToken: `mock-access-token-${Date.now()}`,
    refreshToken: `mock-refresh-token-${Date.now()}`,
    expiresIn: 3600,
    tokenType: "Bearer",
  };
}

// Templates d'endpoints d'authentification
export const AUTH_ENDPOINTS: Omit<MockEndpoint, "id">[] = [
  // Login
  {
    name: "Login",
    description: "Authentification utilisateur",
    method: "POST",
    path: "/auth/login",
    enabled: true,
    response: {
      status: 200,
      data: createAuthResponse(DEFAULT_MOCK_USERS[0]),
    },
    conditions: [
      // Admin login
      {
        field: "body.email",
        operator: "equals",
        value: "admin@example.com",
        response: {
          status: 200,
          data: createAuthResponse(DEFAULT_MOCK_USERS[0]),
        },
      },
      // User login
      {
        field: "body.email",
        operator: "equals",
        value: "user@example.com",
        response: {
          status: 200,
          data: createAuthResponse(DEFAULT_MOCK_USERS[1]),
        },
      },
      // Invalid credentials
      {
        field: "body.password",
        operator: "equals",
        value: "wrong",
        response: {
          status: 401,
          data: { error: "Invalid credentials" },
        },
      },
    ],
    scenarios: [
      {
        id: "success",
        name: "Connexion réussie",
        response: {
          status: 200,
          data: createAuthResponse(DEFAULT_MOCK_USERS[0]),
        },
      },
      {
        id: "invalid-credentials",
        name: "Identifiants invalides",
        response: {
          status: 401,
          data: { error: "Invalid credentials" },
        },
      },
      {
        id: "account-locked",
        name: "Compte verrouillé",
        response: {
          status: 423,
          data: { error: "Account locked" },
        },
      },
      {
        id: "server-error",
        name: "Erreur serveur",
        response: {
          status: 500,
          data: { error: "Internal server error" },
          delay: 2000,
        },
      },
    ],
  },

  // Register
  {
    name: "Register",
    description: "Inscription utilisateur",
    method: "POST",
    path: "/auth/register",
    enabled: true,
    response: {
      status: 201,
      data: createAuthResponse({
        ...DEFAULT_MOCK_USERS[1],
        id: Date.now(),
        email: "new@example.com",
      }),
    },
    scenarios: [
      {
        id: "success",
        name: "Inscription réussie",
        response: {
          status: 201,
          data: createAuthResponse({
            ...DEFAULT_MOCK_USERS[1],
            id: Date.now(),
            email: "new@example.com",
          }),
        },
      },
      {
        id: "email-exists",
        name: "Email déjà utilisé",
        response: {
          status: 409,
          data: { error: "Email already exists" },
        },
      },
      {
        id: "validation-error",
        name: "Erreur de validation",
        response: {
          status: 422,
          data: {
            error: "Validation failed",
            details: {
              email: "Invalid email format",
              password: "Password too weak",
            },
          },
        },
      },
    ],
  },

  // Get current user
  {
    name: "Get Current User",
    description: "Récupérer les informations de l'utilisateur connecté",
    method: "GET",
    path: "/auth/me",
    enabled: true,
    response: {
      status: 200,
      data: DEFAULT_MOCK_USERS[0],
    },
    conditions: [
      {
        field: "headers.authorization",
        operator: "contains",
        value: "Bearer",
        response: {
          status: 200,
          data: DEFAULT_MOCK_USERS[0],
        },
      },
    ],
    scenarios: [
      {
        id: "authenticated",
        name: "Utilisateur authentifié",
        response: {
          status: 200,
          data: DEFAULT_MOCK_USERS[0],
        },
      },
      {
        id: "unauthorized",
        name: "Non authentifié",
        response: {
          status: 401,
          data: { error: "Unauthorized" },
        },
      },
    ],
  },

  // Logout
  {
    name: "Logout",
    description: "Déconnexion utilisateur",
    method: "POST",
    path: "/auth/logout",
    enabled: true,
    response: {
      status: 200,
      data: { message: "Logged out successfully" },
    },
  },

  // Refresh token
  {
    name: "Refresh Token",
    description: "Renouveler le token d'accès",
    method: "POST",
    path: "/auth/refresh",
    enabled: true,
    response: {
      status: 200,
      data: {
        accessToken: `mock-access-token-${Date.now()}`,
        refreshToken: `mock-refresh-token-${Date.now()}`,
        expiresIn: 3600,
        tokenType: "Bearer",
      },
    },
    scenarios: [
      {
        id: "success",
        name: "Renouvellement réussi",
        response: {
          status: 200,
          data: {
            accessToken: `mock-access-token-${Date.now()}`,
            refreshToken: `mock-refresh-token-${Date.now()}`,
            expiresIn: 3600,
            tokenType: "Bearer",
          },
        },
      },
      {
        id: "invalid-token",
        name: "Token invalide",
        response: {
          status: 401,
          data: { error: "Invalid refresh token" },
        },
      },
    ],
  },

  // Forgot password
  {
    name: "Forgot Password",
    description: "Demande de réinitialisation de mot de passe",
    method: "POST",
    path: "/auth/forgot-password",
    enabled: true,
    response: {
      status: 200,
      data: { message: "Password reset email sent" },
      delay: 1000,
    },
  },

  // Reset password
  {
    name: "Reset Password",
    description: "Réinitialisation du mot de passe",
    method: "POST",
    path: "/auth/reset-password",
    enabled: true,
    response: {
      status: 200,
      data: { message: "Password reset successfully" },
    },
    scenarios: [
      {
        id: "success",
        name: "Réinitialisation réussie",
        response: {
          status: 200,
          data: { message: "Password reset successfully" },
        },
      },
      {
        id: "invalid-token",
        name: "Token invalide",
        response: {
          status: 400,
          data: { error: "Invalid or expired reset token" },
        },
      },
    ],
  },
];
