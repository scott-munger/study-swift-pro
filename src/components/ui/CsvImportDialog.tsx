import React, { useState, useRef } from 'react';
import { Button } from './button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
import { Alert, AlertDescription } from './alert';
import { Badge } from './badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Progress } from './progress';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Download,
  Eye,
  EyeOff,
  Target
} from 'lucide-react';
import { ImportError, ImportResult } from '../../lib/csvUtils';

interface CsvImportDialogProps {
  trigger: React.ReactNode;
  title: string;
  description: string;
  onImport: (file: File, options?: ImportOptions) => Promise<ImportResult<any>>;
  onConfirmImport: (data: any[]) => Promise<void>;
  templateGenerator?: () => void;
  previewComponent?: (data: any[], errors: ImportError[]) => React.ReactNode;
  // Options de pré-sélection
  showSubjectSelector?: boolean;
  showDifficultySelector?: boolean;
  showTestSelector?: boolean;
  subjects?: { id: number; name: string; level?: string }[];
  availableTests?: { id: number; title: string; subject: { name: string } }[];
}

interface ImportOptions {
  defaultSubjectId?: number;
  defaultDifficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  defaultTestId?: number;
}

export const CsvImportDialog: React.FC<CsvImportDialogProps> = ({
  trigger,
  title,
  description,
  onImport,
  onConfirmImport,
  templateGenerator,
  previewComponent,
  showSubjectSelector = false,
  showDifficultySelector = false,
  showTestSelector = false,
  subjects = [],
  availableTests = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult<any> | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Options de pré-sélection
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | undefined>(undefined);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [selectedTestId, setSelectedTestId] = useState<number | undefined>(undefined);
  const [selectedClass, setSelectedClass] = useState<string>('all');

  // Grouper les matières par classe
  const subjectsByClass = subjects.reduce((acc, subject) => {
    const className = subject.level || 'Non classé';
    if (!acc[className]) {
      acc[className] = [];
    }
    acc[className].push(subject);
    return acc;
  }, {} as Record<string, typeof subjects>);

  // Obtenir la liste des classes uniques
  const classes = Object.keys(subjectsByClass).sort();

  // Filtrer les matières selon la classe sélectionnée
  const filteredSubjects = selectedClass === 'all' 
    ? subjects 
    : subjectsByClass[selectedClass] || [];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Veuillez sélectionner un fichier CSV');
      return;
    }

    // Validation : Vérifier que la matière est sélectionnée si le sélecteur est affiché
    if (showSubjectSelector && !selectedSubjectId) {
      alert('⚠️ Veuillez sélectionner une matière avant d\'importer');
      event.target.value = ''; // Reset le input file
      return;
    }

    // Validation : Vérifier que le test est sélectionné si le sélecteur est affiché
    if (showTestSelector && !selectedTestId) {
      alert('⚠️ Veuillez sélectionner un test avant d\'importer');
      event.target.value = ''; // Reset le input file
      return;
    }

    setIsLoading(true);
    try {
      const options: ImportOptions = {
        defaultSubjectId: selectedSubjectId,
        defaultDifficulty: selectedDifficulty,
        defaultTestId: selectedTestId
      };
      const result = await onImport(file, options);
      setImportResult(result);
      setShowPreview(true);
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      setImportResult({
        success: false,
        data: [],
        errors: [{ row: 0, field: 'file', message: 'Erreur lors de la lecture du fichier' }],
        totalRows: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importResult || !importResult.success) return;

    setIsLoading(true);
    try {
      await onConfirmImport(importResult.data);
      setIsOpen(false);
      setImportResult(null);
      setShowPreview(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Erreur lors de la confirmation de l\'import:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    if (templateGenerator) {
      templateGenerator();
    }
  };

  const resetDialog = () => {
    setImportResult(null);
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getSuccessRate = () => {
    if (!importResult) return 0;
    return Math.round((importResult.data.length / importResult.totalRows) * 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetDialog();
    }}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Options de pré-sélection */}
          {!importResult && (showSubjectSelector || showDifficultySelector || showTestSelector) && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Options d'importation
                </h3>
                <div className="space-y-4">
                  {showSubjectSelector && subjects.length > 0 && (
                    <>
                      {/* Sélecteur de classe */}
                      {classes.length > 1 && (
                        <div>
                          <label className="block text-sm font-medium text-blue-900 mb-2">
                            Classe / Niveau
                          </label>
                          <select
                            value={selectedClass}
                            onChange={(e) => {
                              setSelectedClass(e.target.value);
                              setSelectedSubjectId(undefined); // Reset la matière sélectionnée
                            }}
                            className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            <option value="all">Toutes les classes</option>
                            {classes.map((className) => (
                              <option key={className} value={className}>
                                {className} ({subjectsByClass[className].length} matière{subjectsByClass[className].length > 1 ? 's' : ''})
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-blue-700 mt-1">
                            Filtrer les matières par classe
                          </p>
                        </div>
                      )}

                      {/* Sélecteur de matière */}
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-2">
                          Matière <span className="text-red-600">*</span>
                        </label>
                        <select
                          value={selectedSubjectId || ''}
                          onChange={(e) => setSelectedSubjectId(e.target.value ? parseInt(e.target.value) : undefined)}
                          className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          required
                        >
                          <option value="">-- Sélectionnez une matière --</option>
                          {filteredSubjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>
                              {subject.name} {subject.level ? `(${subject.level})` : ''}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-blue-700 mt-1">
                          ⚠️ Obligatoire - Toutes les flashcards importées seront associées à cette matière
                        </p>
                      </div>
                    </>
                  )}
                  
                  {showDifficultySelector && (
                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-2">
                        Difficulté <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={selectedDifficulty}
                        onChange={(e) => setSelectedDifficulty(e.target.value as 'EASY' | 'MEDIUM' | 'HARD')}
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="EASY">Facile</option>
                        <option value="MEDIUM">Moyen</option>
                        <option value="HARD">Difficile</option>
                      </select>
                      <p className="text-xs text-blue-700 mt-1">
                        ⚠️ Obligatoire - Toutes les flashcards importées auront cette difficulté
                      </p>
                    </div>
                  )}
                  
                  {showTestSelector && (
                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-2">
                        Test <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={selectedTestId || ''}
                        onChange={(e) => setSelectedTestId(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        required
                      >
                        <option value="">-- Sélectionnez un test --</option>
                        {availableTests.map((test) => (
                          <option key={test.id} value={test.id}>
                            {test.title} ({test.subject.name})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-blue-700 mt-1">
                        ⚠️ Obligatoire - Toutes les questions importées seront associées à ce test
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Section de sélection de fichier */}
          {!importResult && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Sélectionner un fichier CSV
                </h3>
                <p className="text-gray-600 mb-4">
                  Choisissez un fichier CSV contenant les données à importer
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  {isLoading ? 'Traitement...' : 'Sélectionner un fichier'}
                </Button>
              </div>

              {templateGenerator && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    Besoin d'un modèle de fichier CSV ?
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleDownloadTemplate}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger le modèle
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Résultats de l'import */}
          {importResult && (
            <div className="space-y-4">
              {/* Statistiques */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">Total lignes</p>
                        <p className="text-2xl font-bold text-gray-900">{importResult.totalRows}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">Valides</p>
                        <p className="text-2xl font-bold text-gray-900">{importResult.data.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <XCircle className="h-8 w-8 text-red-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">Erreurs</p>
                        <p className="text-2xl font-bold text-gray-900">{importResult.errors.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="h-8 w-8 flex items-center justify-center">
                        <div className="text-lg font-bold text-purple-600">{getSuccessRate()}%</div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">Taux de réussite</p>
                        <Progress value={getSuccessRate()} className="h-2 mt-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Statut global */}
              <Alert className={importResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <div className="flex items-center">
                  {importResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  <AlertDescription className="ml-2">
                    {importResult.success ? (
                      <span className="text-green-800">
                        Toutes les données sont valides et prêtes à être importées !
                      </span>
                    ) : (
                      <span className="text-red-800">
                        Des erreurs ont été détectées. Veuillez les corriger avant de continuer.
                      </span>
                    )}
                  </AlertDescription>
                </div>
              </Alert>

              {/* Erreurs détaillées */}
              {importResult.errors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <XCircle className="h-5 w-5" />
                      Erreurs détectées ({importResult.errors.length})
                    </CardTitle>
                    <CardDescription>
                      Corrigez ces erreurs dans votre fichier CSV et réimportez
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-red-50 rounded">
                          <Badge variant="destructive" className="text-xs">
                            Ligne {error.row}
                          </Badge>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-800">
                              {error.field}: {error.message}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Prévisualisation */}
              {importResult.data.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Eye className="h-5 w-5" />
                          Prévisualisation des données
                        </CardTitle>
                        <CardDescription>
                          {importResult.data.length} éléments prêts à être importés
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                      >
                        {showPreview ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Masquer
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Afficher
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  {showPreview && (
                    <CardContent>
                      {previewComponent ? (
                        previewComponent(importResult.data, importResult.errors)
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {importResult.data.slice(0, 10).map((item, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded border">
                              <pre className="text-sm text-gray-700">
                                {JSON.stringify(item, null, 2)}
                              </pre>
                            </div>
                          ))}
                          {importResult.data.length > 10 && (
                            <p className="text-sm text-gray-500 text-center">
                              ... et {importResult.data.length - 10} autres éléments
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Annuler
          </Button>
          {importResult && importResult.success && (
            <Button 
              onClick={handleConfirmImport}
              disabled={isLoading}
            >
              {isLoading ? 'Import en cours...' : `Importer ${importResult.data.length} éléments`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
