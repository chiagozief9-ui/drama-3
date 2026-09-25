import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  Search,
  PlusCircle,
  Eye,
  Trash2,
  AlertCircle,
  Clapperboard,
  Sparkles,
  ShieldCheck,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { apiFetch } from '../utils/api';
import type { CharacterProfile } from '../types';

export const MyCharactersPage: React.FC = () => {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<CharacterProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCharacters = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/characters');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load characters.');
      }
      if (data.characters && Array.isArray(data.characters)) {
        setCharacters(data.characters);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching characters.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  const handleDelete = async (characterId: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete character "${name}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(characterId);
    try {
      const res = await apiFetch(`/api/characters/${characterId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete character.');
      }
      setCharacters((prev) => prev.filter((c) => c.characterId !== characterId));
    } catch (err: any) {
      alert(err.message || 'Could not delete character.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCharacters = characters.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.roleInStory && c.roleInStory.toLowerCase().includes(q)) ||
      (c.storyTitle && c.storyTitle.toLowerCase().includes(q)) ||
      (c.culturalIdentity && c.culturalIdentity.toLowerCase().includes(q))
    );
  });

  return (
    <AppLayout
      activeNav="Characters"
      pageTitle="Master Character Library"
      pageSubtitle="Consistent Nollywood & African drama character bibles and base prompts"
    >
      {/* HEADER & SEARCH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search characters by name, role, or story..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#120e24] border border-purple-900/40 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-purple-400/50 focus:outline-none focus:border-amber-400/80 transition-colors"
          />
          <Search className="w-4 h-4 text-purple-400 absolute left-3 top-3 pointer-events-none" />
        </div>

        <Link
          to="/stories"
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Generate from Story</span>
        </Link>
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/70 border border-red-500/50 flex items-start gap-3 text-red-200 text-xs">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* LOADING STATE */}
      {loading ? (
        <div className="p-16 text-center text-purple-300 text-xs flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p>Loading your character library from Firestore...</p>
        </div>
      ) : characters.length === 0 ? (
        /* EMPTY STATE REQUIRED */
        <div className="drama-card p-12 text-center rounded-2xl border border-dashed border-purple-900/60 bg-[#100c22] my-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-950/70 border border-purple-800/40 flex items-center justify-center mx-auto mb-4 text-amber-400">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No characters yet</h3>
          <p className="text-xs text-purple-300/80 max-w-md mx-auto mb-6">
            Open a saved story and generate your first cast.
          </p>
          <Link
            to="/stories"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-purple-600 text-slate-950 text-xs font-bold inline-flex items-center gap-2 shadow-lg active:scale-95"
          >
            <Clapperboard className="w-4 h-4" />
            <span>Open Saved Stories</span>
          </Link>
        </div>
      ) : filteredCharacters.length === 0 ? (
        <div className="p-12 text-center text-purple-300 text-xs">
          No characters match your search query "{searchQuery}".
        </div>
      ) : (
        /* CHARACTERS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCharacters.map((char) => {
            const initials = char.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            const formattedDate = char.createdAt
              ? new Date(char.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Recent';

            return (
              <div
                key={char.characterId}
                onClick={() => navigate(`/characters/${char.characterId}`)}
                className="drama-card p-5 rounded-2xl border border-purple-900/40 bg-[#120e24] hover:border-amber-500/50 hover:bg-[#15102a] transition-all cursor-pointer flex flex-col justify-between group shadow-md"
              >
                <div>
                  {/* Top card header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 via-purple-600/30 to-indigo-900/40 border border-purple-700/40 flex items-center justify-center text-amber-300 font-black text-sm shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                        {initials}
                      </div>

                      <div>
                        <h4 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                          {char.name}
                        </h4>
                        <span className="text-xs text-amber-400 font-semibold block">
                          {char.roleInStory}
                        </span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-purple-900/40 border border-purple-700/40 text-purple-300 text-[10px] font-medium shrink-0">
                      {char.age} yrs
                    </span>
                  </div>

                  {/* Story tag if available */}
                  {char.storyTitle && (
                    <div className="mb-2.5 px-2.5 py-1 rounded-lg bg-[#181232] border border-purple-900/30 flex items-center gap-1.5 text-[11px] text-purple-300">
                      <Clapperboard className="w-3 h-3 text-purple-400 shrink-0" />
                      <span className="truncate">{char.storyTitle}</span>
                    </div>
                  )}

                  {/* Character specs list */}
                  <div className="space-y-1.5 text-xs text-purple-200/90 my-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-purple-400">Visual Style:</span>
                      <span className="text-slate-200 font-medium">{char.visualStyle}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-purple-400">Cultural Origin:</span>
                      <span className="text-slate-200 font-medium truncate max-w-[160px] text-right">
                        {char.culturalIdentity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-purple-400">Main Outfit:</span>
                      <span className="text-slate-200 font-medium truncate max-w-[160px] text-right">
                        {char.mainOutfit || 'Traditional African'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card footer */}
                <div className="pt-3 border-t border-purple-900/30 flex items-center justify-between gap-2 mt-2">
                  <span className="text-[10px] text-purple-400/80 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formattedDate}</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => handleDelete(char.characterId, char.name, e)}
                      disabled={deletingId === char.characterId}
                      className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 transition-colors"
                      title="Delete character"
                    >
                      {deletingId === char.characterId ? (
                        <div className="w-3.5 h-3.5 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <Link
                      to={`/characters/${char.characterId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
};
