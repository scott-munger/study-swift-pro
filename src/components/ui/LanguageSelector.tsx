import { Button } from '@/components/ui/enhanced-button';
import { Languages, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2"
          title={language === 'fr' ? 'Passer au créole' : 'Switch to French'}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">
            {language === 'fr' ? 'Français' : 'Kreyòl'}
          </span>
          <span className="sm:hidden">
            {language === 'fr' ? 'FR' : 'HT'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => setLanguage('fr')}
          className={language === 'fr' ? 'bg-accent' : ''}
        >
          <span className="mr-2">🇫🇷</span>
          <span>Français</span>
          {language === 'fr' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage('ht')}
          className={language === 'ht' ? 'bg-accent' : ''}
        >
          <span className="mr-2">🇭🇹</span>
          <span>Kreyòl</span>
          {language === 'ht' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


