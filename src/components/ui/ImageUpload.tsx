import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/enhanced-button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Image as ImageIcon, Camera, Trash2 } from 'lucide-react';

interface ImageUploadProps {
  onImagesChange: (images: File[]) => void;
  maxImages?: number;
  maxSize?: number; // en MB
  acceptedTypes?: string[];
  className?: string;
}

interface PreviewImage {
  file: File;
  preview: string;
  id: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImagesChange,
  maxImages = 5,
  maxSize = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  className = ''
}) => {
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    // Vérifier le type de fichier
    if (!acceptedTypes.includes(file.type)) {
      toast({
        title: "Type de fichier non supporté",
        description: `Seuls les fichiers ${acceptedTypes.map(type => type.split('/')[1]).join(', ')} sont acceptés`,
        variant: "destructive"
      });
      return false;
    }

    // Vérifier la taille
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: `La taille maximale autorisée est de ${maxSize}MB`,
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const newPreviews: PreviewImage[] = [];

    // Vérifier le nombre maximum d'images
    if (previewImages.length + fileArray.length > maxImages) {
      toast({
        title: "Trop d'images",
        description: `Vous ne pouvez ajouter que ${maxImages} images maximum`,
        variant: "destructive"
      });
      return;
    }

    fileArray.forEach(file => {
      if (validateFile(file)) {
        validFiles.push(file);
        newPreviews.push({
          file,
          preview: URL.createObjectURL(file),
          id: Math.random().toString(36).substr(2, 9)
        });
      }
    });

    if (validFiles.length > 0) {
      const updatedPreviews = [...previewImages, ...newPreviews];
      setPreviewImages(updatedPreviews);
      onImagesChange(updatedPreviews.map(p => p.file));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (id: string) => {
    const updatedPreviews = previewImages.filter(img => img.id !== id);
    setPreviewImages(updatedPreviews);
    onImagesChange(updatedPreviews.map(p => p.file));
    
    // Nettoyer l'URL de prévisualisation
    const imageToRemove = previewImages.find(img => img.id === id);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const openCamera = () => {
    // Pour l'instant, on ouvre le sélecteur de fichiers
    // Dans une vraie app, on utiliserait getUserMedia pour accéder à la caméra
    openFileDialog();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Affichage conditionnel : zone de drop ou bouton minimaliste */}
      {previewImages.length === 0 ? (
        /* Zone de drop complète */
        <Card 
          className={`p-6 border-2 border-dashed transition-colors cursor-pointer ${
            isDragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-gray-300 hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Upload className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ajouter des images
            </h3>
            <p className="text-gray-600 mb-4">
              Glissez-déposez vos images ici ou cliquez pour sélectionner
            </p>
            <div className="flex justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  openFileDialog();
                }}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Fichiers
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  openCamera();
                }}
              >
                <Camera className="w-4 h-4 mr-2" />
                Caméra
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Maximum {maxImages} images, {maxSize}MB par image
            </p>
          </div>
        </Card>
      ) : (
        /* Bouton minimaliste après sélection */
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {previewImages.slice(0, 3).map((preview, index) => (
                <div key={preview.id} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden">
                  <img
                    src={preview.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {previewImages.length > 3 && (
                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">
                    +{previewImages.length - 3}
                  </span>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {previewImages.length} image{previewImages.length > 1 ? 's' : ''} sélectionnée{previewImages.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-gray-500">
                Cliquez pour ajouter ou modifier
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openFileDialog}
            >
              <ImageIcon className="w-4 h-4 mr-1" />
              Modifier
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setPreviewImages([]);
                onImagesChange([]);
              }}
              className="text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Prévisualisations détaillées (optionnelles) */}
      {previewImages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">
              Aperçu des images ({previewImages.length}/{maxImages})
            </h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setPreviewImages([]);
                onImagesChange([]);
              }}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Tout supprimer
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {previewImages.map((preview) => (
              <div key={preview.id} className="relative group">
                <Card className="p-2">
                  <div className="aspect-square relative overflow-hidden rounded-lg">
                    <img
                      src={preview.preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeImage(preview.id)}
                        className="opacity-90 hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-600 truncate">
                      {preview.file.name}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {(preview.file.size / 1024 / 1024).toFixed(1)}MB
                    </Badge>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input caché */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
};

export default ImageUpload;
