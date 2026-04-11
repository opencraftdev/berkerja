import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface KeywordAnalysisNotesProps {
  notes: string | null;
}

export function KeywordAnalysisNotes({ notes }: KeywordAnalysisNotesProps) {
  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-slate-950">Agent reasoning</h3>
      </CardHeader>
      <CardContent className="text-sm text-slate-600">
        {notes || 'Generate keywords to see the agent notes.'}
      </CardContent>
    </Card>
  );
}
