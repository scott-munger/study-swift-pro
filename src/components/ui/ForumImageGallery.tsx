import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Download, X } from 'lucide-react';
import { Button } from './enhanced-button';

interface ForumImage {
  id: number;
  filename: string;
  mimetype: string;
  size: number;
  createdAt: string;
  uploader?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

interface ForumImageGalleryProps {
  images: ForumImage[];
  postId?: number;
  replyId?: number;
  onImageDelete?: (imageId: number) => void;
  className?: string;
}

const ForumImageGallery: React.FC<ForumImageGalleryProps> = ({
  images,
  className = ''
}) => {
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<ForumImage | null>(null);

  if (!images || images.length === 0) {
    return null;
  }

  const getImageUrl = (filename: string) => {
    return `http://localhost:8081/api/forum/images/${filename}`;
  };

  const downloadImage = (image: ForumImage, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = getImageUrl(image.filename);
    link.download = image.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Téléchargement",
      description: "L'image est en cours de téléchargement...",
    });
  };

  const openImage = (image: ForumImage) => {
    setSelectedImage(image);
  };

  const closeImage = () => {
    setSelectedImage(null);
  };

  
  return (
    <>
      <div className={`w-full ${className}`}>
        {/* Images avec même padding que le contenu */}
        <div className="space-y-2">
          {images.map((image) => (
            <div 
              key={image.id}
              className="relative w-full overflow-hidden rounded-lg cursor-pointer group"
              onClick={() => openImage(image)}
              title="Cliquer pour agrandir"
            >
              {/* Image pleine largeur */}
              <img
                src={getImageUrl(image.filename)}
                alt={image.filename}
                className="w-full h-auto object-contain"
                loading="lazy"
              />
              
              {/* Overlay au survol */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-white text-sm bg-black/50 px-4 py-2 rounded-lg">
                    Cliquer pour agrandir
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal pour afficher l'image en grand */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={closeImage}
        >
          <div className="relative max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
            {/* Boutons d'action */}
            <div className="absolute top-0 right-0 flex gap-2 p-4 z-10">
              <Button
                variant="default"
                size="sm"
                onClick={(e) => downloadImage(selectedImage, e)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={closeImage}
              >
                <X className="w-4 h-4 mr-2" />
                Fermer
              </Button>
            </div>

            {/* Image en grand */}
            <img
              src={getImageUrl(selectedImage.filename)}
              alt={selectedImage.filename}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ForumImageGallery;
