'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { JiraProject } from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';

interface ProjectSelectorProps {
  projects: JiraProject[];
  selectedProject: string;
  onProjectChange: (projectKey: string) => void;
}

export function ProjectSelector({
  projects,
  selectedProject,
  onProjectChange,
}: ProjectSelectorProps) {
  const { t } = useLanguage();
  const [favorites, setFavorites] = useLocalStorage<string[]>('jira-favorite-projects', []);

  const toggleFavorite = (projectKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(projectKey)
        ? prev.filter((key) => key !== projectKey)
        : [...prev, projectKey]
    );
  };

  const sortedProjects = React.useMemo(() => {
    const favoriteProjects = projects.filter((p) => favorites.includes(p.key));
    const regularProjects = projects.filter((p) => !favorites.includes(p.key));
    return [...favoriteProjects, ...regularProjects];
  }, [projects, favorites]);

  const selectedProjectName =
    selectedProject === 'all'
      ? t('all_projects')
      : projects.find((p) => p.key === selectedProject)?.name || selectedProject;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[300px] justify-between">
          <span className="truncate">{selectedProjectName}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[300px]">
        <DropdownMenuItem
          onClick={() => onProjectChange('all')}
          className="cursor-pointer"
        >
          <Check
            className={cn(
              'mr-2 h-4 w-4',
              selectedProject === 'all' ? 'opacity-100' : 'opacity-0'
            )}
          />
          {t('all_projects')}
        </DropdownMenuItem>
        {sortedProjects.length > 0 && <DropdownMenuSeparator />}
        {sortedProjects.map((project) => (
          <DropdownMenuItem
            key={project.key}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('.star-button')) {
                return;
              }
              onProjectChange(project.key);
            }}
            className="cursor-pointer group"
          >
            <Check
              className={cn(
                'mr-2 h-4 w-4',
                selectedProject === project.key ? 'opacity-100' : 'opacity-0'
              )}
            />
            <span className="flex-1 truncate">{project.name}</span>
            <div
              className="star-button p-1 -m-1 rounded hover:bg-accent"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                toggleFavorite(project.key, e);
              }}
            >
              <Star
                className={cn(
                  'h-4 w-4 cursor-pointer transition-colors',
                  favorites.includes(project.key)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-400 hover:text-yellow-400'
                )}
              />
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}