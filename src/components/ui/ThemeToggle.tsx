import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="relative h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-indigo-400" />
          <span className="sr-only">Changer de thème</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{theme === 'light' ? 'Passer en mode sombre' : 'Passer en mode clair'}</p>
      </TooltipContent>
    </Tooltip>
  );
}



