import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, Shield, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { LoginForm } from '@/components/auth/LoginForm';
import React from 'react';
import { useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    console.log('🚀 Redirection vers la page d\'accueil');
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulaire de connexion */}
        <div className="flex items-center justify-center">
          <LoginForm
            onSuccess={handleLoginSuccess}
            className="w-full max-w-md"
          />
        </div>

        {/* Informations et comptes de test */}
        <div className="space-y-6">
          {/* Bienvenue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">S</span>
                </div>
                <span>Streaming App</span>
              </CardTitle>
              <CardDescription>
                Plateforme de streaming haute performance optimisée pour les machines puissantes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">4K/8K Support</Badge>
                <Badge variant="secondary">React + Vite</Badge>
                <Badge variant="secondary">TailwindCSS</Badge>
                <Badge variant="secondary">Shadcn/ui</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Comptes de test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="h-5 w-5 text-blue-500" />
                <span>Comptes de test disponibles</span>
              </CardTitle>
              <CardDescription>
                Mode mock activé - Utilisez ces comptes pour tester l'application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Compte Admin */}
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900 dark:text-blue-100">Compte Admin</span>
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <div>Email: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">admin@streaming.com</code></div>
                    <div>Mot de passe: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">admin123</code></div>
                  </div>
                </div>

                {/* Compte User */}
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-900 dark:text-green-100">Compte Utilisateur</span>
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    <div>Email: <code className="bg-green-100 dark:bg-green-800 px-1 rounded">user@streaming.com</code></div>
                    <div>Mot de passe: <code className="bg-green-100 dark:bg-green-800 px-1 rounded">user123</code></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fonctionnalités */}
          <Card>
            <CardHeader>
              <CardTitle>Fonctionnalités implémentées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span>Authentification JWT</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span>Player vidéo HLS</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span>Interface moderne</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span>Gestion médias</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span>Bibliothèque</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span>Navigation responsive</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}; 