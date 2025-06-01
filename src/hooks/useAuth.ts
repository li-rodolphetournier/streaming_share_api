import {
  ChangePasswordRequest,
  LoginRequest,
  RegisterRequest,
  UpdatePreferencesRequest,
  UpdateProfileRequest,
  User,
} from "../types/auth.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AuthService } from "../services/auth.service";

// Clés de requête pour React Query
export const authKeys = {
  all: ["auth"] as const,
  user: () => [...authKeys.all, "user"] as const,
  sessions: () => [...authKeys.all, "sessions"] as const,
  securityEvents: () => [...authKeys.all, "security-events"] as const,
  apiKeys: () => [...authKeys.all, "api-keys"] as const,
};

// Hook pour obtenir l'utilisateur actuel
export const useCurrentUser = () => {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: AuthService.getCurrentUser,
    enabled: AuthService.isAuthenticated(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      // Ne pas retry si l'utilisateur n'est pas authentifié
      if (error?.response?.status === 401) return false;
      return failureCount < 3;
    },
  });
};

// Hook pour la connexion
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => AuthService.login(credentials),
    onSuccess: (data) => {
      // Mettre à jour le cache utilisateur
      queryClient.setQueryData(authKeys.user(), data.user);

      // Invalider et refetch les données utilisateur
      queryClient.invalidateQueries({ queryKey: authKeys.all });

      // Précharger les données populaires
      queryClient.prefetchQuery({
        queryKey: ["media", "popular"],
        queryFn: () =>
          import("../services/media.service").then((m) =>
            m.MediaService.preloadPopularMedia()
          ),
        staleTime: 10 * 60 * 1000,
      });
    },
    onError: (error) => {
      console.error("Login failed:", error);
    },
  });
};

// Hook pour l'inscription
export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: RegisterRequest) => AuthService.register(userData),
    onSuccess: (data) => {
      // Mettre à jour le cache utilisateur
      queryClient.setQueryData(authKeys.user(), data.user);

      // Invalider les requêtes d'authentification
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    onError: (error) => {
      console.error("Registration failed:", error);
    },
  });
};

// Hook pour la déconnexion
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: AuthService.logout,
    onSuccess: () => {
      // Nettoyer tout le cache
      queryClient.clear();

      // Rediriger vers la page de connexion
      window.location.href = "/login";
    },
    onError: (error) => {
      console.error("Logout failed:", error);
      // Même en cas d'erreur, nettoyer le cache local
      queryClient.clear();
      window.location.href = "/login";
    },
  });
};

// Hook pour changer le mot de passe
export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) =>
      AuthService.changePassword(data),
    onSuccess: () => {
      // Optionnel: forcer une nouvelle connexion pour plus de sécurité
      console.log("Password changed successfully");
    },
    onError: (error) => {
      console.error("Password change failed:", error);
    },
  });
};

// Hook pour mettre à jour le profil
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => AuthService.updateProfile(data),
    onSuccess: (updatedUser) => {
      // Mettre à jour le cache utilisateur
      queryClient.setQueryData(authKeys.user(), updatedUser);

      // Invalider les requêtes liées au profil
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
    },
    onError: (error) => {
      console.error("Profile update failed:", error);
    },
  });
};

// Hook pour mettre à jour les préférences
export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePreferencesRequest) =>
      AuthService.updatePreferences(data),
    onSuccess: (updatedUser) => {
      // Mettre à jour le cache utilisateur
      queryClient.setQueryData(authKeys.user(), updatedUser);

      // Invalider les requêtes liées aux préférences
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
    },
    // Optimistic update pour une meilleure UX
    onMutate: async (newPreferences) => {
      // Annuler les requêtes en cours
      await queryClient.cancelQueries({ queryKey: authKeys.user() });

      // Sauvegarder l'état précédent
      const previousUser = queryClient.getQueryData<User>(authKeys.user());

      // Mettre à jour optimistiquement
      if (previousUser) {
        queryClient.setQueryData(authKeys.user(), {
          ...previousUser,
          preferences: { ...previousUser.preferences, ...newPreferences },
        });
      }

      return { previousUser };
    },
    onError: (error, variables, context) => {
      // Restaurer l'état précédent en cas d'erreur
      if (context?.previousUser) {
        queryClient.setQueryData(authKeys.user(), context.previousUser);
      }
      console.error("Preferences update failed:", error);
    },
    onSettled: () => {
      // Refetch pour s'assurer de la cohérence
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
    },
  });
};

// Hook pour uploader un avatar
export const useUploadAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => AuthService.uploadAvatar(file),
    onSuccess: (updatedUser) => {
      // Mettre à jour le cache utilisateur
      queryClient.setQueryData(authKeys.user(), updatedUser);

      // Invalider les requêtes liées au profil
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
    },
    onError: (error) => {
      console.error("Avatar upload failed:", error);
    },
  });
};

// Hook pour obtenir les sessions
export const useSessions = () => {
  return useQuery({
    queryKey: authKeys.sessions(),
    queryFn: AuthService.getSessions,
    enabled: AuthService.isAuthenticated(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook pour révoquer une session
export const useRevokeSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => AuthService.revokeSession(sessionId),
    onSuccess: () => {
      // Invalider la liste des sessions
      queryClient.invalidateQueries({ queryKey: authKeys.sessions() });
    },
    onError: (error) => {
      console.error("Session revocation failed:", error);
    },
  });
};

// Hook pour révoquer toutes les sessions
export const useRevokeAllSessions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: AuthService.revokeAllSessions,
    onSuccess: () => {
      // Invalider la liste des sessions
      queryClient.invalidateQueries({ queryKey: authKeys.sessions() });
    },
    onError: (error) => {
      console.error("All sessions revocation failed:", error);
    },
  });
};

// Hook pour obtenir les événements de sécurité
export const useSecurityEvents = () => {
  return useQuery({
    queryKey: authKeys.securityEvents(),
    queryFn: AuthService.getSecurityEvents,
    enabled: AuthService.isAuthenticated(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook pour activer 2FA
export const useEnable2FA = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: AuthService.enable2FA,
    onSuccess: () => {
      // Invalider les données utilisateur pour refléter le changement
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
      queryClient.invalidateQueries({ queryKey: authKeys.securityEvents() });
    },
    onError: (error) => {
      console.error("2FA activation failed:", error);
    },
  });
};

// Hook pour désactiver 2FA
export const useDisable2FA = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: AuthService.disable2FA,
    onSuccess: () => {
      // Invalider les données utilisateur
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
      queryClient.invalidateQueries({ queryKey: authKeys.securityEvents() });
    },
    onError: (error) => {
      console.error("2FA deactivation failed:", error);
    },
  });
};

// Hook pour obtenir les clés API
export const useApiKeys = () => {
  return useQuery({
    queryKey: authKeys.apiKeys(),
    queryFn: AuthService.getApiKeys,
    enabled: AuthService.isAuthenticated() && AuthService.hasRole("admin"),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook pour créer une clé API
export const useCreateApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      name,
      permissions,
    }: {
      name: string;
      permissions: string[];
    }) => AuthService.createApiKey(name, permissions),
    onSuccess: () => {
      // Invalider la liste des clés API
      queryClient.invalidateQueries({ queryKey: authKeys.apiKeys() });
    },
    onError: (error) => {
      console.error("API key creation failed:", error);
    },
  });
};

// Hook pour révoquer une clé API
export const useRevokeApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (keyId: string) => AuthService.revokeApiKey(keyId),
    onSuccess: () => {
      // Invalider la liste des clés API
      queryClient.invalidateQueries({ queryKey: authKeys.apiKeys() });
    },
    onError: (error) => {
      console.error("API key revocation failed:", error);
    },
  });
};

// Hook pour mot de passe oublié
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email: string) => AuthService.forgotPassword(email),
    onError: (error) => {
      console.error("Forgot password failed:", error);
    },
  });
};

// Hook pour réinitialiser le mot de passe
export const useResetPassword = () => {
  return useMutation({
    mutationFn: (data: {
      token: string;
      password: string;
      confirmPassword: string;
    }) => AuthService.resetPassword(data),
    onError: (error) => {
      console.error("Password reset failed:", error);
    },
  });
};

// Hook pour vérifier l'email
export const useVerifyEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => AuthService.verifyEmail(token),
    onSuccess: () => {
      // Invalider les données utilisateur pour refléter la vérification
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
    },
    onError: (error) => {
      console.error("Email verification failed:", error);
    },
  });
};

// Hook pour renvoyer l'email de vérification
export const useResendVerificationEmail = () => {
  return useMutation({
    mutationFn: AuthService.resendVerificationEmail,
    onError: (error) => {
      console.error("Resend verification email failed:", error);
    },
  });
};

// Hook utilitaire pour vérifier l'état d'authentification
export const useAuthStatus = () => {
  const { data: user, isLoading, error } = useCurrentUser();

  return {
    user,
    isAuthenticated: AuthService.isAuthenticated(),
    isLoading,
    error,
    hasRole: (role: string) => AuthService.hasRole(role),
    hasPermission: (permission: string) =>
      AuthService.hasPermission(permission),
  };
};
