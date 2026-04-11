'use client';

import { useState } from 'react';
import { X, Plus, Sparkles, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KeywordEditorProps {
  keywords: string[];
  onChange: (keywords: string[]) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function KeywordEditor({ keywords, onChange, onSave, isSaving }: KeywordEditorProps) {
  const [newKeyword, setNewKeyword] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      onChange([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    onChange(keywords.filter((k) => k !== keyword));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="Type a keyword and press Enter..."
            onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              'pr-20 transition-all duration-200',
              isFocused && 'ring-2 ring-indigo-500/20 border-indigo-500'
            )}
          />
          <Button
            size="sm"
            variant="ghost"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2"
            onClick={addKeyword}
            disabled={!newKeyword.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 min-h-[2rem]">
        {keywords.length === 0 ? (
          <p className="text-sm text-slate-400 py-2">No keywords yet. Add some above.</p>
        ) : (
          keywords.map((keyword, index) => (
            <Badge
              key={keyword}
              variant="secondary"
              className={cn(
                'gap-1.5 pl-3 pr-2 py-1.5 text-sm transition-all duration-200 animate-in fade-in-0 slide-in-from-top-1',
                'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-200/50 hover:from-indigo-500/20 hover:to-purple-500/20'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>{keyword}</span>
              <button
                onClick={() => removeKeyword(keyword)}
                className={cn(
                  'ml-1 p-0.5 rounded-full hover:bg-indigo-100 transition-colors'
                )}
                aria-label={`Remove ${keyword}`}
              >
                <X className="w-3 h-3 text-slate-400 hover:text-indigo-600" />
              </button>
            </Badge>
          ))
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t">
        <p className="text-xs text-slate-400">
          {keywords.length} keyword{keywords.length !== 1 ? 's' : ''}
        </p>
        <Button 
          onClick={onSave} 
          disabled={isSaving || keywords.length === 0}
          className="gap-2"
          size="sm"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
