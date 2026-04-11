'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { CV } from '@/types/cv';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UploadDropzoneProps {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  uploadProgress?: number;
}

function UploadDropzone({ onUpload, isUploading, uploadProgress = 0 }: UploadDropzoneProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      setError('Please upload a PDF or DOCX file');
      return;
    }
    setError(null);
    await onUpload(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    disabled: isUploading,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 overflow-hidden',
        isDragActive 
          ? 'border-indigo-500 bg-indigo-500/5 scale-[1.02]' 
          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50',
        isUploading && 'pointer-events-none opacity-70'
      )}
    >
      <input {...getInputProps()} />
      
      <div className="relative z-10">
        <div className={cn(
          'w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 transition-all duration-300',
          isDragActive ? 'bg-indigo-500 scale-110' : 'bg-slate-100'
        )}>
          {isUploading ? (
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className={cn('w-8 h-8 transition-colors', isDragActive ? 'text-white' : 'text-slate-400')} />
          )}
        </div>
        
        <h3 className="text-lg font-semibold mb-2">
          {isUploading 
            ? 'Uploading your CV...' 
            : isDragActive 
              ? 'Drop your CV here' 
              : 'Upload your CV'}
        </h3>
        
        <p className="text-sm text-slate-500 mb-4">
          {isUploading 
            ? 'Processing your document' 
            : 'Drag & drop or click to select'}
        </p>
        
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <Badge variant="secondary" className="bg-slate-100">PDF</Badge>
          <Badge variant="secondary" className="bg-slate-100">DOCX</Badge>
          <span>Max 10MB</span>
        </div>
      </div>
      
      {isUploading && (
        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-white to-transparent">
          <Progress value={uploadProgress} className="h-1" />
        </div>
      )}
      
      {error && (
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}

interface CVCardProps {
  cv: CV;
  isSelected: boolean;
  onClick: () => void;
}

function CVCard({ cv, isSelected, onClick }: CVCardProps) {
  const date = new Date(cv.created_at);
  const wordCount = cv.raw_text.split(/\s+/).length;
  
  return (
    <Card 
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-indigo-200',
        isSelected && 'ring-2 ring-indigo-500 border-indigo-200 bg-indigo-50/50'
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              isSelected ? 'bg-indigo-500' : 'bg-slate-100'
            )}>
              <FileText className={cn('w-6 h-6', isSelected ? 'text-white' : 'text-slate-400')} />
            </div>
            <div>
              <CardTitle className="text-base">{cv.file_name}</CardTitle>
              <CardDescription className="text-xs">
                {wordCount.toLocaleString()} words
              </CardDescription>
            </div>
          </div>
          {isSelected && (
            <CheckCircle2 className="w-5 h-5 text-indigo-500" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <Separator orientation="vertical" className="h-3" />
          <Badge variant="secondary" className="text-xs">
            {cv.analysis_result ? 'Analyzed' : 'Pending'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CVPage() {
  const [cvs, setCvs] = useState<CV[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCv, setSelectedCv] = useState<CV | null>(null);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', 'demo-user');

      const response = await fetch('/api/cv/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const cv = await response.json();
      setCvs([cv, ...cvs]);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            CV Manager
          </h1>
          <p className="text-sm text-slate-500">Upload and manage your resumes for job matching</p>
        </div>
        <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200">
          {cvs.length} CV{cvs.length !== 1 ? 's' : ''}
        </Badge>
      </div>
      
      <UploadDropzone onUpload={handleUpload} isUploading={isUploading} />
      
      <Tabs defaultValue="all" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all">All CVs</TabsTrigger>
            <TabsTrigger value="analyzed">Analyzed</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="all" className="mt-0">
          {cvs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="font-medium text-slate-600 mb-1">No CVs uploaded yet</h3>
                <p className="text-sm text-slate-400">Upload your first CV to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cvs.map((cv) => (
                <CVCard
                  key={cv.id}
                  cv={cv}
                  isSelected={selectedCv?.id === cv.id}
                  onClick={() => setSelectedCv(cv)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedCv} onOpenChange={() => setSelectedCv(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedCv?.file_name}</DialogTitle>
            <DialogDescription>
              CV uploaded on {selectedCv && new Date(selectedCv.created_at).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="mt-4 h-[60vh]">
            <pre className="whitespace-pre-wrap text-sm text-slate-600 font-mono bg-slate-50 p-4 rounded-xl border">
              {selectedCv?.raw_text}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
