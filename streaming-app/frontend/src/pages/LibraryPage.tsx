import { Card, CardContent } from '@/components/ui/card';
import { Clock, Folder, Grid, Heart, List, Plus } from 'lucide-react';
import type { Collection, Media } from '@/types/media.types';
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MediaCard } from '@/components/media/MediaCard';
import { cn } from '@/lib/utils';

export const LibraryPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('recent');
  const [filterGenre, setFilterGenre] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const favoriteMovies: Media[] = [
    {
      id: '1',
      title: 'Dune: Part Two',
      poster: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
      type: 'movie',
      year: 2024,
      duration: 166,
      rating: 8.5,
      genres: ['Science-Fiction', 'Aventure'],
      qualities: ['4K', '1080p'],
      streamUrl: '',
      isFavorite: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      title: 'The Bear',
      poster: 'https://image.tmdb.org/t/p/w500/zPyj25VzDCUKNrnbzQJGH3sB4bq.jpg',
      type: 'series',
      year: 2022,
      duration: 30,
      rating: 8.9,
      genres: ['Comédie', 'Drame'],
      qualities: ['1080p'],
      streamUrl: '',
      isFavorite: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const watchHistory: Media[] = [
    {
      id: '3',
      title: 'Oppenheimer',
      poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
      type: 'movie',
      year: 2023,
      duration: 180,
      rating: 8.3,
      genres: ['Drame', 'Histoire'],
      qualities: ['4K'],
      streamUrl: '',
      isFavorite: false,
      watchProgress: {
        currentTime: 5400, // 1h30
        duration: 10800, // 3h
        progressPercentage: 50,
        lastWatched: new Date(Date.now() - 86400000), // Yesterday
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const collections: Collection[] = [
    {
      id: '1',
      name: 'Films Marvel',
      description: 'Tous les films de l\'univers Marvel',
      poster: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
      mediaCount: 28,
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'Documentaires Nature',
      description: 'Documentaires sur la nature et l\'environnement',
      poster: 'https://image.tmdb.org/t/p/w500/placeholder.jpg',
      mediaCount: 15,
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const genres = ['Action', 'Comédie', 'Drame', 'Science-Fiction', 'Documentaire', 'Horreur'];

  const handlePlayMedia = (media: Media) => {
    console.log('Playing:', media.title);
  };

  const handleToggleFavorite = (media: Media) => {
    console.log('Toggle favorite:', media.title);
  };

  const handleAddToCollection = (media: Media) => {
    console.log('Add to collection:', media.title);
  };

  const handleCreateCollection = () => {
    console.log('Create new collection');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Ma Bibliothèque</h1>
          <p className="text-muted-foreground">
            Gérez vos favoris, collections et historique de visionnage
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="favorites" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="favorites" className="flex items-center space-x-2">
              <Heart className="h-4 w-4" />
              <span>Favoris</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Historique</span>
            </TabsTrigger>
            <TabsTrigger value="collections" className="flex items-center space-x-2">
              <Folder className="h-4 w-4" />
              <span>Collections</span>
            </TabsTrigger>
            <TabsTrigger value="watchlist" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>À regarder</span>
            </TabsTrigger>
          </TabsList>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <Input
                  placeholder="Rechercher dans les favoris..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />

                <Select value={filterGenre} onValueChange={setFilterGenre}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrer par genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les genres</SelectItem>
                    {genres.map((genre) => (
                      <SelectItem key={genre} value={genre.toLowerCase()}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Récemment ajouté</SelectItem>
                    <SelectItem value="title">Titre A-Z</SelectItem>
                    <SelectItem value="year">Année</SelectItem>
                    <SelectItem value="rating">Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            {favoriteMovies.length > 0 ? (
              <div className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'space-y-4'
              )}>
                {favoriteMovies.map((media) => (
                  <MediaCard
                    key={media.id}
                    media={media}
                    onPlay={handlePlayMedia}
                    onToggleFavorite={handleToggleFavorite}
                    onAddToCollection={handleAddToCollection}
                    variant={viewMode === 'list' ? 'detailed' : 'default'}
                  />
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun favori</h3>
                  <p className="text-muted-foreground">
                    Ajoutez des contenus à vos favoris pour les retrouver facilement
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Historique de visionnage</h2>
              <Button variant="outline" size="sm">
                Effacer l'historique
              </Button>
            </div>

            {watchHistory.length > 0 ? (
              <div className="space-y-4">
                {watchHistory.map((media) => (
                  <MediaCard
                    key={media.id}
                    media={media}
                    onPlay={handlePlayMedia}
                    onToggleFavorite={handleToggleFavorite}
                    onAddToCollection={handleAddToCollection}
                    variant="detailed"
                  />
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun historique</h3>
                  <p className="text-muted-foreground">
                    Votre historique de visionnage apparaîtra ici
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Collections Tab */}
          <TabsContent value="collections" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Mes Collections</h2>
              <Button onClick={handleCreateCollection}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle collection
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection) => (
                <Card key={collection.id} className="group cursor-pointer hover:shadow-lg transition-all">
                  <div className="relative">
                    <img
                      src={collection.poster}
                      alt={collection.name}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg flex items-center justify-center">
                      <Button variant="ghost" className="text-white">
                        Voir la collection
                      </Button>
                    </div>
                    {!collection.isPublic && (
                      <Badge className="absolute top-2 right-2 bg-black/70">
                        Privée
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">{collection.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {collection.description}
                    </p>
                    <p className="text-sm font-medium">
                      {collection.mediaCount} contenus
                    </p>
                  </CardContent>
                </Card>
              ))}

              {/* Create new collection card */}
              <Card
                className="border-dashed border-2 cursor-pointer hover:border-primary transition-colors"
                onClick={handleCreateCollection}
              >
                <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                  <Plus className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">Créer une collection</h3>
                  <p className="text-sm text-muted-foreground">
                    Organisez vos contenus en collections personnalisées
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Watchlist Tab */}
          <TabsContent value="watchlist" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">À regarder plus tard</h2>
              <Badge variant="secondary">0 contenus</Badge>
            </div>

            <Card className="text-center py-12">
              <CardContent>
                <Plus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Liste vide</h3>
                <p className="text-muted-foreground">
                  Ajoutez des contenus à votre liste pour les regarder plus tard
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}; 