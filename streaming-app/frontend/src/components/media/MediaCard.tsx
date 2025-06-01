import { Card, CardContent } from '@/components/ui/card';
import { Clock, Eye, Heart, MoreVertical, Play, Star } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Media } from '@/types/media.types';
import { Progress } from '@/components/ui/progress';
import React from 'react';
import { cn } from '@/lib/utils';

interface MediaCardProps {
  media: Media;
  onPlay?: (media: Media) => void;
  onToggleFavorite?: (media: Media) => void;
  onAddToCollection?: (media: Media) => void;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
}

export const MediaCard: React.FC<MediaCardProps> = ({
  media,
  onPlay,
  onToggleFavorite,
  onAddToCollection,
  className,
  variant = 'default',
}) => {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatRating = (rating: number) => {
    return (rating / 10).toFixed(1);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'movie':
        return 'bg-blue-500';
      case 'series':
        return 'bg-green-500';
      case 'documentary':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'movie':
        return 'Film';
      case 'series':
        return 'Série';
      case 'documentary':
        return 'Documentaire';
      default:
        return type;
    }
  };

  if (variant === 'compact') {
    return (
      <Card className={cn('media-card group overflow-hidden hover:shadow-lg transition-all duration-300', className)}>
        <div className="relative">
          <img
            src={media.poster || '/placeholder-poster.jpg'}
            alt={media.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Button
              size="lg"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => onPlay?.(media)}
            >
              <Play className="h-6 w-6" />
            </Button>
          </div>

          {/* Type badge */}
          <Badge className={cn('absolute top-2 left-2 text-white border-none', getTypeColor(media.type))}>
            {getTypeLabel(media.type)}
          </Badge>

          {/* Favorite button */}
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-2 right-2 text-white hover:bg-white/20"
            onClick={() => onToggleFavorite?.(media)}
          >
            <Heart className={cn('h-4 w-4', media.isFavorite ? 'fill-red-500 text-red-500' : '')} />
          </Button>
        </div>

        <CardContent className="p-3">
          <h3 className="font-semibold text-sm truncate mb-1">{media.title}</h3>
          <p className="text-xs text-muted-foreground mb-2">{media.year}</p>

          {media.rating && (
            <div className="flex items-center space-x-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs">{formatRating(media.rating)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'detailed') {
    return (
      <Card className={cn('media-card group overflow-hidden hover:shadow-xl transition-all duration-300', className)}>
        <div className="flex">
          {/* Poster */}
          <div className="relative w-48 flex-shrink-0">
            <img
              src={media.poster || '/placeholder-poster.jpg'}
              alt={media.title}
              className="w-full h-72 object-cover"
            />

            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <Button
                size="lg"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={() => onPlay?.(media)}
              >
                <Play className="h-8 w-8" />
              </Button>
            </div>

            <Badge className={cn('absolute top-2 left-2 text-white border-none', getTypeColor(media.type))}>
              {getTypeLabel(media.type)}
            </Badge>
          </div>

          {/* Content */}
          <CardContent className="flex-1 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold mb-2">{media.title}</h3>
                <p className="text-muted-foreground mb-2">{media.year}</p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => onToggleFavorite?.(media)}>
                    <Heart className="h-4 w-4 mr-2" />
                    {media.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAddToCollection?.(media)}>
                    Ajouter à une collection
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 mb-4">
              {media.rating && (
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">{formatRating(media.rating)}</span>
                </div>
              )}

              {media.duration && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{formatDuration(media.duration)}</span>
                </div>
              )}

              {media.viewCount && (
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{media.viewCount.toLocaleString()} vues</span>
                </div>
              )}
            </div>

            {/* Genres */}
            {media.genres && media.genres.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {media.genres.slice(0, 3).map((genre) => (
                  <Badge key={genre} variant="secondary" className="text-xs">
                    {genre}
                  </Badge>
                ))}
              </div>
            )}

            {/* Description */}
            {media.description && (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {media.description}
              </p>
            )}

            {/* Watch progress */}
            {media.watchProgress && media.watchProgress.progressPercentage > 0 && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">Progression</span>
                  <span className="text-xs text-muted-foreground">
                    {media.watchProgress.progressPercentage}%
                  </span>
                </div>
                <Progress value={media.watchProgress.progressPercentage} className="h-1" />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex space-x-2">
              <Button onClick={() => onPlay?.(media)} className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                {media.watchProgress?.progressPercentage ? 'Continuer' : 'Regarder'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleFavorite?.(media)}
              >
                <Heart className={cn('h-4 w-4', media.isFavorite ? 'fill-red-500 text-red-500' : '')} />
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className={cn('media-card group overflow-hidden hover:shadow-lg transition-all duration-300', className)}>
      <div className="relative">
        <img
          src={media.poster || '/placeholder-poster.jpg'}
          alt={media.title}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Button
            size="lg"
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={() => onPlay?.(media)}
          >
            <Play className="h-6 w-6" />
          </Button>
        </div>

        {/* Type badge */}
        <Badge className={cn('absolute top-2 left-2 text-white border-none', getTypeColor(media.type))}>
          {getTypeLabel(media.type)}
        </Badge>

        {/* Favorite button */}
        <Button
          size="sm"
          variant="ghost"
          className="absolute top-2 right-2 text-white hover:bg-white/20"
          onClick={() => onToggleFavorite?.(media)}
        >
          <Heart className={cn('h-4 w-4', media.isFavorite ? 'fill-red-500 text-red-500' : '')} />
        </Button>

        {/* Quality badge */}
        {media.qualities && media.qualities.length > 0 && (
          <Badge
            variant="secondary"
            className="absolute bottom-2 right-2 bg-black/70 text-white border-none"
          >
            {media.qualities[0]}
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 truncate">{media.title}</h3>

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{media.year}</span>

          {media.rating && (
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm">{formatRating(media.rating)}</span>
            </div>
          )}
        </div>

        {/* Genres */}
        {media.genres && media.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {media.genres.slice(0, 2).map((genre) => (
              <Badge key={genre} variant="secondary" className="text-xs">
                {genre}
              </Badge>
            ))}
          </div>
        )}

        {/* Description */}
        {media.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {media.description}
          </p>
        )}

        {/* Watch progress */}
        {media.watchProgress && media.watchProgress.progressPercentage > 0 && (
          <div className="mb-3">
            <Progress value={media.watchProgress.progressPercentage} className="h-1" />
            <span className="text-xs text-muted-foreground mt-1">
              {media.watchProgress.progressPercentage}% regardé
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex space-x-2">
          <Button onClick={() => onPlay?.(media)} className="flex-1" size="sm">
            <Play className="h-4 w-4 mr-2" />
            {media.watchProgress?.progressPercentage ? 'Continuer' : 'Regarder'}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onToggleFavorite?.(media)}>
                <Heart className="h-4 w-4 mr-2" />
                {media.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddToCollection?.(media)}>
                Ajouter à une collection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}; 