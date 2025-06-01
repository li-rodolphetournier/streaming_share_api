import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, Clock, Play, Search, Star, TrendingUp } from 'lucide-react';
import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Media } from '@/types/media.types';
import { MediaCard } from '@/components/media/MediaCard';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { cn } from '@/lib/utils';

export const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);

  // Mock data - will be replaced with real API calls
  const featuredContent: Media = {
    id: '1',
    title: 'Dune: Part Two',
    description: 'Paul Atreides s\'unit aux Fremen et entame un voyage spirituel et martial pour devenir Muad\'Dib, tout en tentant d\'empêcher l\'horrible futur qu\'il a entrevu.',
    poster: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg',
    type: 'movie',
    year: 2024,
    duration: 166,
    rating: 8.5,
    genres: ['Science-Fiction', 'Aventure', 'Drame'],
    qualities: ['4K', '1080p', '720p'],
    streamUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    viewCount: 2500000,
    isFavorite: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const trendingMovies: Media[] = [
    {
      id: '2',
      title: 'Oppenheimer',
      poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
      type: 'movie',
      year: 2023,
      duration: 180,
      rating: 8.3,
      genres: ['Drame', 'Histoire'],
      qualities: ['4K', '1080p'],
      streamUrl: '',
      isFavorite: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      title: 'Spider-Man: Across the Spider-Verse',
      poster: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
      type: 'movie',
      year: 2023,
      duration: 140,
      rating: 8.7,
      genres: ['Animation', 'Action', 'Aventure'],
      qualities: ['4K', '1080p'],
      streamUrl: '',
      isFavorite: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '4',
      title: 'The Bear',
      poster: 'https://image.tmdb.org/t/p/w500/zPyj25VzDCUKNrnbzQJGH3sB4bq.jpg',
      type: 'series',
      year: 2022,
      duration: 30,
      rating: 8.9,
      genres: ['Comédie', 'Drame'],
      qualities: ['1080p', '720p'],
      streamUrl: '',
      isFavorite: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const categories = [
    { name: 'Action', count: 245, color: 'bg-red-500' },
    { name: 'Comédie', count: 189, color: 'bg-yellow-500' },
    { name: 'Drame', count: 312, color: 'bg-blue-500' },
    { name: 'Science-Fiction', count: 156, color: 'bg-purple-500' },
    { name: 'Documentaire', count: 98, color: 'bg-green-500' },
    { name: 'Horreur', count: 87, color: 'bg-gray-800' },
  ];

  const handlePlayMedia = (media: Media) => {
    setSelectedMedia(media);
    setShowPlayer(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  if (showPlayer && selectedMedia) {
    return (
      <div className="min-h-screen bg-black">
        <VideoPlayer
          src={selectedMedia.streamUrl || featuredContent.streamUrl}
          title={selectedMedia.title}
          poster={selectedMedia.poster}
          className="h-screen"
          onEnded={() => setShowPlayer(false)}
        />
        <Button
          variant="ghost"
          className="absolute top-4 left-4 text-white hover:bg-white/20"
          onClick={() => setShowPlayer(false)}
        >
          ← Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${featuredContent.backdrop})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col justify-center h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <Badge className="mb-4 bg-primary text-primary-foreground">
              Nouveau
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              {featuredContent.title}
            </h1>

            <p className="text-lg text-gray-200 mb-6 line-clamp-3">
              {featuredContent.description}
            </p>

            <div className="flex items-center space-x-4 mb-8">
              <div className="flex items-center space-x-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="text-white font-medium">
                  {(featuredContent.rating / 10).toFixed(1)}
                </span>
              </div>

              <div className="flex items-center space-x-1">
                <Clock className="h-5 w-5 text-gray-300" />
                <span className="text-white">
                  {Math.floor(featuredContent.duration / 60)}h {featuredContent.duration % 60}m
                </span>
              </div>

              <Badge variant="secondary">
                {featuredContent.qualities?.[0]}
              </Badge>
            </div>

            <div className="flex space-x-4">
              <Button
                size="lg"
                onClick={() => handlePlayMedia(featuredContent)}
                className="bg-white text-black hover:bg-gray-200"
              >
                <Play className="h-5 w-5 mr-2" />
                Regarder maintenant
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                Plus d'infos
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-8 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher des films, séries, documentaires..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 text-lg"
              />
              <Button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                Rechercher
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-8">Parcourir par catégorie</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Card
                key={category.name}
                className="group cursor-pointer hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="p-6 text-center">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center',
                      category.color
                    )}
                  >
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {category.count} contenus
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Content */}
      <section className="py-12 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Tendances</h2>
            <Button variant="ghost" className="group">
              Voir tout
              <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {trendingMovies.map((media) => (
              <MediaCard
                key={media.id}
                media={media}
                onPlay={handlePlayMedia}
                variant="default"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Continue Watching */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-8">Continuer à regarder</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingMovies.slice(0, 3).map((media) => (
              <MediaCard
                key={`continue-${media.id}`}
                media={{
                  ...media,
                  watchProgress: {
                    currentTime: Math.floor(Math.random() * media.duration * 60),
                    duration: media.duration * 60,
                    progressPercentage: Math.floor(Math.random() * 80) + 10,
                    lastWatched: new Date(),
                  },
                }}
                onPlay={handlePlayMedia}
                variant="detailed"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <h3 className="text-3xl font-bold text-primary mb-2">10,000+</h3>
              <p className="text-muted-foreground">Films & Séries</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-primary mb-2">4K</h3>
              <p className="text-muted-foreground">Qualité Ultra HD</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-primary mb-2">50+</h3>
              <p className="text-muted-foreground">Genres</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-primary mb-2">24/7</h3>
              <p className="text-muted-foreground">Streaming</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}; 