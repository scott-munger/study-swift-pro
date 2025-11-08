import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/enhanced-button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, ThumbsUp, Edit, Trash2, Pin, Lock, Reply, MoreVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface ForumPost {
  id: number;
  title: string;
  content: string;
  author: {
    id: number;
    firstName: string;
    lastName: string;
    role: string;
    profilePhoto?: string;
  };
  subject?: {
    id: number;
    name: string;
  };
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  replies: ForumReply[];
  likes: Array<{ id: number; userId: number }>;
  _count: {
    replies: number;
    likes: number;
  };
}

interface ForumReply {
  id: number;
  content: string;
  author: {
    id: number;
    firstName: string;
    lastName: string;
    role: string;
    profilePhoto?: string;
  };
  createdAt: string;
  updatedAt: string;
  likes: Array<{ id: number; userId: number }>;
  _count: {
    likes: number;
  };
}

interface ForumPostDetailProps {
  post: ForumPost | null;
  open: boolean;
  onClose: () => void;
  onDelete: (postId: number) => Promise<void>;
  onEdit: (post: ForumPost) => void;
  onLike: (postId: number) => Promise<void>;
  onReply: (postId: number, content: string) => Promise<void>;
  onLikeReply: (replyId: number) => Promise<void>;
  onDeleteReply: (replyId: number) => Promise<void>;
}

const ForumPostDetail: React.FC<ForumPostDetailProps> = ({
  post,
  open,
  onClose,
  onDelete,
  onEdit,
  onLike,
  onReply,
  onLikeReply,
  onDeleteReply
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [replyContent, setReplyContent] = useState('');
  const [replying, setReplying] = useState(false);
  const [showDeletePostConfirm, setShowDeletePostConfirm] = useState(false);
  const [showDeleteReplyConfirm, setShowDeleteReplyConfirm] = useState(false);
  const [replyToDelete, setReplyToDelete] = useState<number | null>(null);

  const handleReply = async () => {
    if (!replyContent.trim() || !post) return;
    
    try {
      await onReply(post.id, replyContent.trim());
      setReplyContent('');
      setReplying(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la réponse",
        variant: "destructive"
      });
    }
  };

  const handleDelete = () => {
    if (!post) return;
    setShowDeletePostConfirm(true);
  };

  const confirmDeletePost = async () => {
    if (!post) return;
    
    try {
      await onDelete(post.id);
      onClose();
      setShowDeletePostConfirm(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le post",
        variant: "destructive"
      });
    }
  };

  const handleDeleteReply = (replyId: number) => {
    setReplyToDelete(replyId);
    setShowDeleteReplyConfirm(true);
  };

  const confirmDeleteReply = async () => {
    if (!replyToDelete) return;
    
    try {
      await onDeleteReply(replyToDelete);
      setShowDeleteReplyConfirm(false);
      setReplyToDelete(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la réponse",
        variant: "destructive"
      });
    }
  };

  const isLiked = post ? post.likes.some(like => like.userId === user?.id) : false;
  // Vérifier si l'utilisateur peut modifier/supprimer (auteur ou admin)
  const canEdit = user && post && (
    user.id === post.author.id || user.role === 'ADMIN'
  );
  const canDelete = user && post && (
    user.id === post.author.id || user.role === 'ADMIN'
  );

  if (!post) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {post.isPinned && <Pin className="w-4 h-4 text-primary" />}
                {post.isLocked && <Lock className="w-4 h-4 text-red-500" />}
                <DialogTitle className="text-xl">{post.title}</DialogTitle>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage 
                      src={post.author.profilePhoto ? `http://localhost:8081/api/profile/photos/${post.author.profilePhoto}` : undefined} 
                    />
                    <AvatarFallback className="text-xs">
                      {post.author.firstName[0]}{post.author.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span>{post.author.firstName} {post.author.lastName}</span>
                  <Badge variant={post.author.role === 'TUTOR' ? 'secondary' : 'outline'}>
                    {post.author.role === 'TUTOR' ? 'Tuteur' : 'Étudiant'}
                  </Badge>
                </div>
                {post.subject && (
                  <Badge variant="outline">{post.subject.name}</Badge>
                )}
                <span>{new Date(post.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => onEdit(post)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </DropdownMenuItem>
                  {canDelete && (
                    <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contenu du post */}
          <div className="p-4 bg-muted/20 rounded-lg">
            <p className="whitespace-pre-wrap">{post.content}</p>
          </div>

          {/* Actions du post */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant={isLiked ? "default" : "outline"}
                size="sm"
                onClick={() => onLike(post.id)}
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                {post._count.likes} {post._count.likes === 1 ? 'j\'aime' : 'j\'aimes'}
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquare className="w-4 h-4" />
                {post._count.replies} {post._count.replies === 1 ? 'réponse' : 'réponses'}
              </div>
            </div>
            {!post.isLocked && user && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReplying(!replying)}
              >
                <Reply className="w-4 h-4 mr-2" />
                Répondre
              </Button>
            )}
          </div>

          {/* Formulaire de réponse */}
          {replying && (
            <div className="space-y-3 p-4 bg-muted/10 rounded-lg">
              <Textarea
                placeholder="Écrivez votre réponse..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={3}
                maxLength={1000}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  {replyContent.length}/1000 caractères
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setReplying(false)}>
                    Annuler
                  </Button>
                  <Button size="sm" onClick={handleReply} disabled={!replyContent.trim()}>
                    Répondre
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Réponses */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">
              Réponses ({post.replies.length})
            </h3>
            {post.replies.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aucune réponse pour le moment. Soyez le premier à répondre !
              </p>
            ) : (
              post.replies.map((reply) => {
                const isReplyLiked = reply.likes.some(like => like.userId === user?.id);
                const canDeleteReply = user && (user.id === reply.author.id || user.role === 'ADMIN');
                
                return (
                  <div key={reply.id} className="p-4 bg-muted/10 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage 
                            src={reply.author.profilePhoto ? `http://localhost:8081/api/profile/photos/${reply.author.profilePhoto}` : undefined} 
                          />
                          <AvatarFallback className="text-xs">
                            {reply.author.firstName[0]}{reply.author.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">
                          {reply.author.firstName} {reply.author.lastName}
                        </span>
                        <Badge variant={reply.author.role === 'TUTOR' ? 'secondary' : 'outline'} className="text-xs">
                          {reply.author.role === 'TUTOR' ? 'Tuteur' : 'Étudiant'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(reply.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      {canDeleteReply && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteReply(reply.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap text-sm mb-3">{reply.content}</p>
                    <Button
                      variant={isReplyLiked ? "default" : "outline"}
                      size="sm"
                      onClick={() => onLikeReply(reply.id)}
                    >
                      <ThumbsUp className="w-3 h-3 mr-1" />
                      {reply._count.likes}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>

      {/* AlertDialog de confirmation de suppression de post */}
      <AlertDialog open={showDeletePostConfirm} onOpenChange={setShowDeletePostConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le post</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce post ? Cette action est irréversible et supprimera toutes les réponses associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePost}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog de confirmation de suppression de réponse */}
      <AlertDialog open={showDeleteReplyConfirm} onOpenChange={setShowDeleteReplyConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la réponse</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette réponse ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteReply}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default ForumPostDetail;
