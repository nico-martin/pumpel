import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HugeiconsIcon } from '@hugeicons/react';
import { Menu01Icon, Home01Icon, Dumbbell01Icon, Analytics01Icon, UserIcon } from '@hugeicons/core-free-icons';

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
            <HugeiconsIcon icon={Menu01Icon} strokeWidth={2} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => onNavigate('training')}
            className={currentPage === 'training' ? 'bg-accent' : ''}
          >
            <HugeiconsIcon icon={Home01Icon} strokeWidth={2} />
            Training
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onNavigate('exercises')}
            className={currentPage === 'exercises' ? 'bg-accent' : ''}
          >
            <HugeiconsIcon icon={Dumbbell01Icon} strokeWidth={2} />
            Exercises
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onNavigate('stats')}
            className={currentPage === 'stats' ? 'bg-accent' : ''}
          >
            <HugeiconsIcon icon={Analytics01Icon} strokeWidth={2} />
            Statistics
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onNavigate('account')}
            className={currentPage === 'account' ? 'bg-accent' : ''}
          >
            <HugeiconsIcon icon={UserIcon} strokeWidth={2} />
            Account
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
