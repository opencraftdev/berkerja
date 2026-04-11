'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Lightbulb, Clock, Zap } from 'lucide-react';
import { KeywordEditor } from '@/components/keywords/keyword-editor';
import { KeywordGenerateButton } from '@/components/keywords/keyword-generate-button';
import { getKeywords, updateKeywords } from '@/features/keyword-generation/api/generate';
import { Keyword } from '@/features/keyword-generation/types/keyword';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userId = 'demo-user';
    getKeywords(userId)
      .then(setKeywords)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  const currentKeywords = keywords[0];

  const handleSave = async () => {
    if (!currentKeywords) return;
    setIsSaving(true);
    try {
      await updateKeywords(currentKeywords.id, currentKeywords.queries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-6 w-24" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Keyword Generation
          </h1>
          <p className="text-sm text-slate-500">AI-powered job search keywords from your CV</p>
        </div>
        <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200">
          <Zap className="w-3 h-3 mr-1" />
          AI Powered
        </Badge>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-slate-200/50 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Generated Keywords</CardTitle>
                <CardDescription>Edit and refine your job search keywords</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {currentKeywords ? (
              <KeywordEditor
                keywords={currentKeywords.queries}
                onChange={(queries) =>
                  setKeywords([{ ...currentKeywords, queries }])
                }
                onSave={handleSave}
                isSaving={isSaving}
              />
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="font-medium text-slate-600 mb-1">No keywords yet</h3>
                <p className="text-sm text-slate-400 mb-4">Upload a CV and generate keywords to get started</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200/50 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <KeywordGenerateButton
              cvId={currentKeywords?.cv_id || ''}
              onGenerated={(result) => {
                console.log('Generated:', result);
              }}
            />
            
            <Separator />
            
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-medium text-slate-700">Tips for keywords:</h4>
              <ul className="space-y-2 text-xs text-slate-500">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5" />
                  Combine role titles with key technologies
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5" />
                  Use specific job titles for better matches
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5" />
                  Include both formal and casual titles
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {currentKeywords?.generation_notes && (
        <Card className="border-slate-200/50 shadow-sm bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-indigo-500" />
              <CardTitle className="text-sm font-medium">AI Reasoning</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 leading-relaxed">
              {currentKeywords.generation_notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
