import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/enhanced-button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Image as ImageIcon, 
  Search, 
  Trash2, 
  Download, 
  Eye, 
  Filter,
  Calendar,
  User,
  FileText,
  RefreshCw
} from 'lucide-react';

interface ForumImage {
  id: number;
  filename: string;
  filepath: string;
  mimetype: string;
  size: number;
  postId?: number;
  replyId?: number;
  uploadedBy: number;
  createdAt: string;
  updatedAt: string;
  uploader: {
    id: number;
    firstName: string;
    lastName: string;
  };
  post?: {
    id: number;
    title: string;
  };
  reply?: {
    id: number;
    content: string;
  };
}

const AdminForumImages = () => {
  const [images, setImages] = useState<ForumImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteImageConfirm, setShowDeleteImageConfirm] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<number | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [imagesToBulkDelete, setImagesToBulkDelete] = useState<number[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'posts' | 'replies'>('all');
  const [selectedImage, setSelectedImage] = useState<ForumImage | null>(null);
  const [selectedImages, setSelectedImages] = useState<number[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Vérifier les permissions admin
  useEffect(() => {
    const storageUser = (() => { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null'); } catch { return null; } })();
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const payload = (() => { try { return token ? JSON.parse(atob(token.split('.')[1])) : null; } catch { return null; } })();
    const isAdminEffective = (user?.role === 'ADMIN') || (storageUser?.role === 'ADMIN') || (payload?.role === 'ADMIN');
    if (!isAdminEffective) {
      // Pas d'alerte agressive; juste pas de chargement
      return;
    }
  }, [user, toast]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/admin/forum/images', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setImages(data);
      } else {
        throw new Error('Erreur lors du chargement des images');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des images:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les images",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storageUser = (() => { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null'); } catch { return null; } })();
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const payload = (() => { try { return token ? JSON.parse(atob(token.split('.')[1])) : null; } catch { return null; } })();
    const isAdminEffective = (user?.role === 'ADMIN') || (storageUser?.role === 'ADMIN') || (payload?.role === 'ADMIN');
    if (isAdminEffective) {
      loadImages();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleDeleteImage = (imageId: number) => {
    setImageToDelete(imageId);
    setShowDeleteImageConfirm(true);
  };

  const confirmDeleteImage = async () => {
    if (!imageToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/admin/forum/images/${imageToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setImages(prev => prev.filter(img => img.id !== imageToDelete));
        toast({
          title: "Image supprimée",
          description: "L'image a été supprimée avec succès",
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'image",
        variant: "destructive"
      });
    } finally {
      setShowDeleteImageConfirm(false);
      setImageToDelete(null);
    }
  };

  const handleBulkDelete = (imageIds: number[]) => {
    setImagesToBulkDelete(imageIds);
    setShowBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    if (!imagesToBulkDelete.length) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/admin/forum/images`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageIds: imagesToBulkDelete })
      });

      if (response.ok) {
        const result = await response.json();
        setImages(prev => prev.filter(img => !imagesToBulkDelete.includes(img.id)));
        setSelectedImages([]);
        setIsSelectMode(false);
        toast({
          title: "Images supprimées",
          description: `${result.deletedCount} image(s) supprimée(s) avec succès`,
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression en masse:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer les images",
        variant: "destructive"
      });
    } finally {
      setShowBulkDeleteConfirm(false);
      setImagesToBulkDelete([]);
    }
  };

  const handleSelectImage = (imageId: number) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  const handleSelectAll = () => {
    if (selectedImages.length === filteredImages.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(filteredImages.map(img => img.id));
    }
  };

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedImages([]);
  };

  const getImageUrl = (filename: string) => {
    return `http://localhost:8081/api/forum/images/${filename}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredImages = images.filter(image => {
    const matchesSearch = 
      image.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.uploader.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.uploader.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.post?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.reply?.content.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filterType === 'all' ||
      (filterType === 'posts' && image.postId) ||
      (filterType === 'replies' && image.replyId);

    return matchesSearch && matchesFilter;
  });

  const storageUserGuard = (() => { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null'); } catch { return null; } })();
  const tokenGuard = localStorage.getItem('token') || sessionStorage.getItem('token');
  const payloadGuard = (() => { try { return tokenGuard ? JSON.parse(atob(tokenGuard.split('.')[1])) : null; } catch { return null; } })();
  const isAdminEffectiveGuard = (user?.role === 'ADMIN') || (storageUserGuard?.role === 'ADMIN') || (payloadGuard?.role === 'ADMIN');

  if (!isAdminEffectiveGuard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Accès non autorisé</h2>
          <p className="text-gray-600">
            Seuls les administrateurs peuvent accéder à cette page
          </p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des images...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Gestion des Images du Forum
            </h1>
            <div className="flex gap-2">
              {isSelectMode && selectedImages.length > 0 && (
                <Button 
                  onClick={() => handleBulkDelete(selectedImages)} 
                  variant="destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer ({selectedImages.length})
                </Button>
              )}
              <Button 
                onClick={toggleSelectMode} 
                variant={isSelectMode ? "default" : "outline"}
              >
                {isSelectMode ? "Annuler" : "Sélectionner"}
              </Button>
              <Button onClick={loadImages} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
            </div>
          </div>
          
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Images</p>
                  <p className="text-2xl font-bold text-primary">{images.length}</p>
                </div>
                <ImageIcon className="w-8 h-8 text-primary" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Images Posts</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {images.filter(img => img.postId).length}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Images Réponses</p>
                  <p className="text-2xl font-bold text-green-600">
                    {images.filter(img => img.replyId).length}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-green-600" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taille Totale</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatFileSize(images.reduce((sum, img) => sum + img.size, 0))}
                  </p>
                </div>
                <Download className="w-8 h-8 text-purple-600" />
              </div>
            </Card>
          </div>
        </div>

        {/* Filtres et recherche */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom de fichier, utilisateur, post..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {isSelectMode && filteredImages.length > 0 && (
                <Button
                  onClick={handleSelectAll}
                  variant="outline"
                  size="sm"
                >
                  {selectedImages.length === filteredImages.length ? "Tout désélectionner" : "Tout sélectionner"}
                </Button>
              )}
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
                size="sm"
              >
                Toutes
              </Button>
              <Button
                variant={filterType === 'posts' ? 'default' : 'outline'}
                onClick={() => setFilterType('posts')}
                size="sm"
              >
                Posts
              </Button>
              <Button
                variant={filterType === 'replies' ? 'default' : 'outline'}
                onClick={() => setFilterType('replies')}
                size="sm"
              >
                Réponses
              </Button>
            </div>
          </div>
        </Card>

        {/* Liste des images */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredImages.map((image) => (
            <Card 
              key={image.id} 
              className={`overflow-hidden hover:shadow-lg transition-shadow ${
                isSelectMode && selectedImages.includes(image.id) 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : ''
              } ${isSelectMode ? 'cursor-pointer' : ''}`}
              onClick={() => isSelectMode && handleSelectImage(image.id)}
            >
              <div className="aspect-square relative">
                {isSelectMode && (
                  <div className="absolute top-2 left-2 z-10">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedImages.includes(image.id)
                        ? 'bg-primary border-primary text-white'
                        : 'bg-white border-gray-300'
                    }`}>
                      {selectedImages.includes(image.id) && (
                        <span className="text-xs font-bold">✓</span>
                      )}
                    </div>
                  </div>
                )}
                <img
                  src={getImageUrl(image.filename)}
                  alt={image.filename}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="text-xs">
                    {formatFileSize(image.size)}
                  </Badge>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                <div>
                  <p className="font-medium text-sm truncate" title={image.filename}>
                    {image.filename}
                  </p>
                  <p className="text-xs text-gray-500">
                    {image.mimetype}
                  </p>
                </div>
                
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    <span>{image.uploader.firstName} {image.uploader.lastName}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(image.createdAt)}</span>
                  </div>
                  
                  {image.post && (
                    <div className="flex items-center gap-2">
                      <FileText className="w-3 h-3" />
                      <span className="truncate" title={image.post.title}>
                        Post: {image.post.title}
                      </span>
                    </div>
                  )}
                  
                  {image.reply && (
                    <div className="flex items-center gap-2">
                      <FileText className="w-3 h-3" />
                      <span className="truncate" title={image.reply.content}>
                        Réponse: {image.reply.content.substring(0, 30)}...
                      </span>
                    </div>
                  )}
                </div>
                
                {!isSelectMode && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(image);
                      }}
                      className="flex-1"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Voir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        const link = document.createElement('a');
                        link.href = getImageUrl(image.filename);
                        link.download = image.filename;
                        link.click();
                      }}
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteImage(image.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {filteredImages.length === 0 && (
          <Card className="p-8 text-center">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune image trouvée
            </h3>
            <p className="text-gray-600">
              {searchTerm || filterType !== 'all' 
                ? "Aucune image ne correspond à vos critères de recherche"
                : "Aucune image n'a été uploadée dans le forum"
              }
            </p>
          </Card>
        )}

        {/* Modal de visualisation */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedImage.filename}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedImage(null)}
                >
                  ×
                </Button>
              </div>
              <div className="p-4">
                <img
                  src={getImageUrl(selectedImage.filename)}
                  alt={selectedImage.filename}
                  className="max-w-full max-h-[60vh] object-contain mx-auto"
                />
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Taille:</strong> {formatFileSize(selectedImage.size)}</p>
                    <p><strong>Type:</strong> {selectedImage.mimetype}</p>
                  </div>
                  <div>
                    <p><strong>Uploadé par:</strong> {selectedImage.uploader.firstName} {selectedImage.uploader.lastName}</p>
                    <p><strong>Date:</strong> {formatDate(selectedImage.createdAt)}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* AlertDialog de confirmation de suppression d'image */}
      <AlertDialog open={showDeleteImageConfirm} onOpenChange={setShowDeleteImageConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'image</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette image ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteImage}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog de confirmation de suppression en masse */}
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer les images</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer {imagesToBulkDelete.length} image(s) ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer {imagesToBulkDelete.length} image(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminForumImages;
