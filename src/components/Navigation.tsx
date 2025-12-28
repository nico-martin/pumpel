import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, Home, Dumbbell, BarChart3, User } from 'lucide-react';

interface NavigationProps {
  currentPage: 'training' | 'exercises' | 'stats' | 'account';
  onNavigate: (page: 'training' | 'exercises' | 'stats' | 'account') => void;
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  return (
    <div className="fixed top-4 right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" className="rounded-full shadow-lg">
            <Menu className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => onNavigate('training')}
            className={currentPage === 'training' ? 'bg-accent' : ''}
          >
            <Home className="h-4 w-4" />
            Training
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onNavigate('exercises')}
            className={currentPage === 'exercises' ? 'bg-accent' : ''}
          >
            <Dumbbell className="h-4 w-4" />
            Exercises
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onNavigate('stats')}
            className={currentPage === 'stats' ? 'bg-accent' : ''}
          >
            <BarChart3 className="h-4 w-4" />
            Statistics
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onNavigate('account')}
            className={currentPage === 'account' ? 'bg-accent' : ''}
          >
            <User className="h-4 w-4" />
            Account
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
