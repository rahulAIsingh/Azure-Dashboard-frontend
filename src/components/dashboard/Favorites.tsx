import { useState, useEffect } from "react";
import { Star, X, Server, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { motion, AnimatePresence } from "framer-motion";

interface Favorite {
  id: string;
  name: string;
  type: "resource" | "resourceGroup";
  resourceGroup?: string;
}

interface FavoritesProps {
  onSelectFavorite: (fav: Favorite) => void;
}

const STORAGE_KEY = "azure-cost-favorites";

export function Favorites({ onSelectFavorite }: FavoritesProps) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse favorites:", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const removeFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  };

  if (favorites.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="glass-card p-4">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="font-semibold text-sm">Favorites</span>
              <Badge variant="secondary" className="text-xs">{favorites.length}</Badge>
            </div>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-3 space-y-1">
            <AnimatePresence>
              {favorites.map((fav) => (
                <motion.div
                  key={fav.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 group cursor-pointer"
                  onClick={() => onSelectFavorite(fav)}
                >
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm flex-1 truncate">{fav.name}</span>
                  {fav.resourceGroup && (
                    <span className="text-xs text-muted-foreground">{fav.resourceGroup}</span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFavorite(fav.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// Export a helper to add favorites from other components
export function useFavorites() {
  const addFavorite = (fav: Omit<Favorite, "id">) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const favorites: Favorite[] = stored ? JSON.parse(stored) : [];
    
    const newFav = { ...fav, id: `${fav.type}-${fav.name}-${Date.now()}` };
    
    // Check if already exists
    if (favorites.some((f) => f.name === fav.name && f.type === fav.type)) {
      return false;
    }
    
    favorites.push(newFav);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    window.dispatchEvent(new Event("storage"));
    return true;
  };

  return { addFavorite };
}
