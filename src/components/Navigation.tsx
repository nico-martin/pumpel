import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Menu, Home, Dumbbell, BarChart3, User } from 'lucide-react';
import packageJson from '../../package.json';

export function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '';
    }
    return location.pathname === path;
  };

  return (
    <div className="fixed top-4 left-0 right-0 z-50 pointer-events-none">
      <div className="mx-auto max-w-2xl px-4 flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" className="rounded-full shadow-lg pointer-events-auto">
              <Menu className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => navigate('/')}
              className={isActive('/') ? 'bg-accent' : ''}
            >
              <Home className="h-4 w-4" />
              Training
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate('/exercises')}
              className={isActive('/exercises') ? 'bg-accent' : ''}
            >
              <Dumbbell className="h-4 w-4" />
              Exercises
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate('/stats')}
              className={isActive('/stats') ? 'bg-accent' : ''}
            >
              <BarChart3 className="h-4 w-4" />
              Statistics
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate('/account')}
              className={isActive('/account') ? 'bg-accent' : ''}
            >
              <User className="h-4 w-4" />
              Account
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-[0.6rem] text-muted-foreground flex justify-between items-center">
              <span>Version {packageJson.version}</span><span>::</span><a href="https://github.com/nico-martin/pumpel/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">MIT License</a><span>::</span><a href="https://github.com/nico-martin/pumpel/" target="_blank" rel="noopener noreferrer">GitHub</a>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
