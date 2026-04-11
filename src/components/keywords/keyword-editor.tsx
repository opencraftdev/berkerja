'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface KeywordEditorProps {
  keywords: string[];
  onChange: (keywords: string[]) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function KeywordEditor({ keywords, onChange, onSave, isSaving }: KeywordEditorProps) {
  const [newKeyword, setNewKeyword] = useState('');

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
      <div className="flex gap-2">
        <Input
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          placeholder="Add a keyword..."
          onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
        />
        <Button onClick={addKeyword} variant="secondary">
          Add
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword) => (
          <Badge key={keyword} variant="secondary" className="gap-1">
            {keyword}
            <button onClick={() => removeKeyword(keyword)} className="ml-1" aria-label={`Remove ${keyword}`}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      <Button onClick={onSave} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Keywords'}
      </Button>
    </div>
  );
}