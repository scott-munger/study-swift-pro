import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';

interface SocialShareButtonProps {
  url?: string;
  title?: string;
  description?: string;
  author?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'default';
}

const SocialShareButton: React.FC<SocialShareButtonProps> = ({
  url = window.location.href,
  title = '',
  description = '',
  author = '',
  className = '',
  size = 'sm',
  variant = 'ghost'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Fermer le menu quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const shareText = title ? `"${title}"${author ? ` - ${author}` : ''}` : '';
  const fullText = `${shareText}${description ? `\n${description}` : ''}\n${url}`;

  const shareOptions = [
    {
      name: 'Facebook',
      icon: 'f',
      color: 'bg-blue-600',
      action: () => {
        const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(shareUrl, '_blank', 'width=600,height=400');
        setIsOpen(false);
      }
    },
    {
      name: 'Twitter/X',
      icon: '𝕏',
      color: 'bg-sky-500',
      action: () => {
        const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
        window.open(shareUrl, '_blank', 'width=600,height=400');
        setIsOpen(false);
      }
    },
    {
      name: 'WhatsApp',
      icon: 'W',
      color: 'bg-green-500',
      action: () => {
        const shareUrl = `https://wa.me/?text=${encodeURIComponent(fullText)}`;
        window.open(shareUrl, '_blank');
        setIsOpen(false);
      }
    },
    {
      name: 'LinkedIn',
      icon: 'in',
      color: 'bg-blue-700',
      action: () => {
        const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        window.open(shareUrl, '_blank', 'width=600,height=400');
        setIsOpen(false);
      }
    },
    {
      name: 'Telegram',
      icon: 'T',
      color: 'bg-blue-500',
      action: () => {
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`;
        window.open(shareUrl, '_blank');
        setIsOpen(false);
      }
    },
    {
      name: 'Email',
      icon: '✉',
      color: 'bg-gray-600',
      action: () => {
        const subject = title || 'Partage depuis Tyala';
        const body = `${shareText}\n\n${description}\n\nLien: ${url}`;
        const shareUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = shareUrl;
        setIsOpen(false);
      }
    }
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      // Vous pouvez ajouter une notification toast ici si nécessaire
      setIsOpen(false);
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
    }
  };

  const sizeClasses = {
    sm: 'h-8 w-8 p-0',
    md: 'h-10 w-10 p-0',
    lg: 'h-12 w-12 p-0'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className="relative">
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(!isOpen)}
        className={`${sizeClasses[size]} ${className} hover:bg-blue-50 hover:text-blue-600 transition-colors`}
        title="Partager"
      >
        <Share2 className={iconSizes[size]} />
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 top-9 z-50 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 animate-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
            Partager sur les réseaux sociaux
          </div>
          
          {shareOptions.map((option) => (
            <button
              key={option.name}
              onClick={option.action}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
            >
              <div className={`w-5 h-5 ${option.color} rounded flex items-center justify-center`}>
                <span className="text-white text-xs font-bold">{option.icon}</span>
              </div>
              <span>{option.name}</span>
            </button>
          ))}
          
          <div className="border-t border-gray-100 my-1"></div>
          
          <button
            onClick={copyToClipboard}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
          >
            <div className="w-5 h-5 bg-gray-500 rounded flex items-center justify-center">
              <span className="text-white text-xs">📋</span>
            </div>
            <span>Copier le lien</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default SocialShareButton;


