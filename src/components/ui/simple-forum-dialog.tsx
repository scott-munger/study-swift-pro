import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/enhanced-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, BookOpen } from 'lucide-react';
import ImageUpload from './ImageUpload';
import { useToast } from '@/hooks/use-toast';

interface SimpleForumDialogProps {
  trigger?: React.ReactNode;
  onSave?: (data: { title: string; content: string; subjectId?: number; images?: File[] }) => Promise<void>;
  initialData?: { title?: string; content?: string; subjectId?: number };
  mode?: 'create' | 'edit';
  submitLabel?: string;
  dialogTitle?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showImageUpload?: boolean;
  subjects?: Array<{ id: number; name: string; level?: string }>;
  showSubjectSelector?: boolean;
}

const SimpleForumDialog: React.FC<SimpleForumDialogProps> = ({ 
  trigger, 
  onSave, 
  initialData, 
  mode = 'create', 
  submitLabel, 
  dialogTitle, 
  open: controlledOpen, 
  onOpenChange,
  showImageUpload = true,
  subjects = [],
  showSubjectSelector = true
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [subjectId, setSubjectId] = useState<number | undefined>(initialData?.subjectId);
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const isOpen = controlledOpen !== undefined ? controlledOpen : open;

  React.useEffect(() => {
    if (isOpen) {
      // Prefill when opening (for edit mode)
      if (initialData) {
        setTitle(initialData.title || '');
        setContent(initialData.content || '');
        setSubjectId(initialData.subjectId);
      }
      // Reset images when opening
      setImages([]);
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir le titre et le contenu",
        variant: "destructive"
      });
      return;
    }

    if (showSubjectSelector && !subjectId) {
      toast({
        title: "Matière requise",
        description: "Veuillez sélectionner une matière pour votre post",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      if (onSave) {
        await onSave({ 
          title: title.trim(), 
          content: content.trim(),
          subjectId: subjectId,
          images: images.length > 0 ? images : undefined
        });
      }
      
      if (onOpenChange) onOpenChange(false);
      else setOpen(false);
      setTitle('');
      setContent('');
      setSubjectId(undefined);
      setImages([]);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du post:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'enregistrement du post",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const defaultTrigger = (
    <Button variant="hero" size="lg">
      <Plus className="w-4 h-4 mr-2" />
      Simple Post
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(v) => onOpenChange ? onOpenChange(v) : setOpen(v)}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle || (mode === 'edit' ? 'Modifier le Post' : 'Créer un Post Simple')}</DialogTitle>
          <DialogDescription className="sr-only">
            {mode === 'edit' ? 'Modifier le contenu du post' : 'Créer un nouveau post dans le forum'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de votre post..."
            />
          </div>

          <div>
            <Label htmlFor="content">Contenu</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Contenu de votre post..."
              rows={4}
            />
          </div>

          {showSubjectSelector && subjects.length > 0 && (
            <div>
              <Label htmlFor="subject" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Matière <span className="text-red-600">*</span>
              </Label>
              <Select value={subjectId?.toString() || ''} onValueChange={(value) => setSubjectId(parseInt(value))}>
                <SelectTrigger id="subject" className="mt-2">
                  <SelectValue placeholder="Sélectionnez une matière" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name} {subject.level ? `(${subject.level})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                ⚠️ Obligatoire - Aide les autres étudiants à filtrer par matière
              </p>
            </div>
          )}

          {showImageUpload && (
            <div>
              <Label>Images (optionnel)</Label>
              <ImageUpload
                onImagesChange={setImages}
                maxImages={5}
                maxSize={10}
                className="mt-2"
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (mode === 'edit' ? 'Enregistrement...' : 'Création...') : (submitLabel || (mode === 'edit' ? 'Enregistrer' : 'Créer'))}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleForumDialog;
