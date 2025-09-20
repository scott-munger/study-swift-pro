import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/enhanced-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';

interface SimpleForumDialogProps {
  trigger?: React.ReactNode;
  onSave?: (data: { title: string; content: string; subjectId?: number }) => Promise<void>;
  initialData?: { title?: string; content?: string };
  mode?: 'create' | 'edit';
  submitLabel?: string;
  dialogTitle?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const SimpleForumDialog: React.FC<SimpleForumDialogProps> = ({ trigger, onSave, initialData, mode = 'create', submitLabel, dialogTitle, open: controlledOpen, onOpenChange }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [loading, setLoading] = useState(false);

  const isOpen = controlledOpen !== undefined ? controlledOpen : open;

  React.useEffect(() => {
    if (isOpen) {
      // Prefill when opening (for edit mode)
      if (initialData) {
        setTitle(initialData.title || '');
        setContent(initialData.content || '');
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      alert('Veuillez remplir le titre et le contenu');
      return;
    }

    setLoading(true);
    
    try {
      if (onSave) {
        await onSave({ title: title.trim(), content: content.trim() });
      }
      
      if (onOpenChange) onOpenChange(false);
      else setOpen(false);
      setTitle('');
      setContent('');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du post:', error);
      alert('Erreur lors de l\'enregistrement du post');
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle || (mode === 'edit' ? 'Modifier le Post' : 'Créer un Post Simple')}</DialogTitle>
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
