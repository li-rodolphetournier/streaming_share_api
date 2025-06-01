import { AlertCircle, AlertTriangle, CheckCircle, Download, Eye, EyeOff, Info, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { DiagnosticSystem, type DiagnosticReport } from '../utils/diagnostics';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export const DiagnosticPanel: React.FC = () => {
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const runDiagnostic = async () => {
    setIsRunning(true);
    try {
      const newReport = await DiagnosticSystem.runFullDiagnostic();
      setReport(newReport);
    } catch (error) {
      console.error('Erreur lors du diagnostic:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const exportReport = () => {
    if (report) {
      DiagnosticSystem.exportReport(report);
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  useEffect(() => {
    // Lancer un diagnostic automatique au chargement
    runDiagnostic();
  }, []);

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50"
        variant="outline"
        size="sm"
      >
        <Eye className="w-4 h-4 mr-2" />
        Diagnostic
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[80vh] overflow-y-auto z-50">
      <Card className="bg-background/95 backdrop-blur border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              🔍 Diagnostic Système
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={runDiagnostic}
                disabled={isRunning}
                size="sm"
                variant="outline"
              >
                {isRunning ? 'En cours...' : 'Relancer'}
              </Button>
              <Button
                onClick={() => setIsVisible(false)}
                size="sm"
                variant="ghost"
              >
                <EyeOff className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isRunning && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Diagnostic en cours...</p>
            </div>
          )}

          {report && !isRunning && (
            <>
              {/* Résumé rapide */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  {getStatusIcon(report.environment.mockApiEnabled)}
                  <span>Mode Mock</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(report.network.localhost)}
                  <span>Localhost</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(report.api.serviceLoaded)}
                  <span>Service API</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(report.browser.cookiesEnabled)}
                  <span>Cookies</span>
                </div>
              </div>

              {/* Environnement */}
              <div>
                <h4 className="font-semibold text-sm mb-2">🔧 Environnement</h4>
                <div className="space-y-1 text-xs">
                  <div>Mode: <Badge variant="outline">{report.environment.mode}</Badge></div>
                  <div>Mock API: <Badge variant={report.environment.mockApiEnabled ? "default" : "destructive"}>
                    {report.environment.mockApiEnabled ? "Activé" : "Désactivé"}
                  </Badge></div>
                  <div>Dev: <Badge variant={report.environment.isDev ? "default" : "secondary"}>
                    {report.environment.isDev ? "Oui" : "Non"}
                  </Badge></div>
                </div>
              </div>

              {/* Réseau */}
              <div>
                <h4 className="font-semibold text-sm mb-2">🌐 Réseau</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(report.network.localhost)}
                    <span>Localhost accessible</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(report.network.internetConnection)}
                    <span>Connexion internet</span>
                  </div>
                </div>
              </div>

              {/* API */}
              <div>
                <h4 className="font-semibold text-sm mb-2">🔌 API</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(report.api.serviceLoaded)}
                    <span>Service chargé</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(report.api.mockTest.success)}
                    <span>Test mock</span>
                  </div>
                  {report.api.mockTest.error && (
                    <div className="text-red-500 text-xs">
                      Erreur: {report.api.mockTest.error}
                    </div>
                  )}
                </div>
              </div>

              {/* Navigateur */}
              <div>
                <h4 className="font-semibold text-sm mb-2">🌐 Navigateur</h4>
                <div className="space-y-1 text-xs">
                  <div>Type: <Badge variant="outline">
                    {report.browser.isOpera ? 'Opera' :
                      report.browser.isChrome ? 'Chrome' :
                        report.browser.isFirefox ? 'Firefox' :
                          report.browser.isSafari ? 'Safari' : 'Inconnu'}
                  </Badge></div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(report.browser.cookiesEnabled)}
                    <span>Cookies activés</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(report.browser.onlineStatus)}
                    <span>En ligne</span>
                  </div>
                </div>
              </div>

              {/* Stockage */}
              <div>
                <h4 className="font-semibold text-sm mb-2">💾 Stockage</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(report.localStorage.available)}
                    <span>LocalStorage disponible</span>
                  </div>
                  <div>Tokens: <Badge variant={report.localStorage.accessToken ? "default" : "secondary"}>
                    {report.localStorage.accessToken ? "Présents" : "Absents"}
                  </Badge></div>
                  <div>Cache: {report.localStorage.cacheKeys.length} éléments</div>
                </div>
              </div>

              {/* Recommandations */}
              {report.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">💡 Recommandations</h4>
                  <div className="space-y-2">
                    {report.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 rounded border">
                        {getRecommendationIcon(rec.type)}
                        <div className="flex-1 text-xs">
                          <div className="font-medium">{rec.message}</div>
                          <div className="text-muted-foreground mt-1">{rec.action}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={exportReport}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
                <Button
                  onClick={() => DiagnosticSystem.clearLogs()}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  Nettoyer
                </Button>
              </div>

              {/* Timestamp */}
              <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                Dernière analyse: {new Date(report.timestamp).toLocaleTimeString()}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 