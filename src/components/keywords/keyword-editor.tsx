'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface KeywordEditorProps {
  isSaving: boolean;
  keywords: string[];
  onChange: (keywords: string[]) => void;
  onSave: () => Promise<void>;
}

export function KeywordEditor({ isSaving, keywords, onChange, onSave }: KeywordEditorProps) {
  const [draft, setDraft] = useState('');

  function addKeyword() {
    const value = draft.trim();

    if (!value || keywords.includes(value)) {
      return;
    }

    onChange([...keywords, value]);
    setDraft('');
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-white p-5">
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a keyword query"
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addKeyword();
            }
          }}
        />
        <Button type="button" variant="secondary" onClick={addKeyword}>
          Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword) => (
          <Badge key={keyword} className="gap-2 bg-blue-50 text-blue-700">
            {keyword}
            <button type="button" onClick={() => onChange(keywords.filter((item) => item !== keyword))}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Button type="button" onClick={onSave} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save keywords'}
      </Button>
    </div>
  );
}
