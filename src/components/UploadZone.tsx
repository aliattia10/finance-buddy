import { useCallback, useState, useRef } from 'react';
import { Upload, FileText, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

const UploadZone = ({ onFilesSelected, isProcessing }: UploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/pdf' || file.type.startsWith('image/')
    );

    // Filter out files that are too large (max 10MB)
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert(`File "${file.name}" is too large. Maximum file size is 10MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    } else if (files.length > 0) {
      alert('All selected files are too large or not supported. Please select PDF or image files under 10MB.');
    }
  }, [onFilesSelected]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed', e.target.files);
    const selectedFiles = e.target.files;
    
    if (!selectedFiles || selectedFiles.length === 0) {
      console.log('No files selected');
      return;
    }

    const files = Array.from(selectedFiles).filter(file => {
      console.log('Checking file:', file.name, 'Type:', file.type, 'Size:', file.size);
      
      // Check file type - be more lenient with PDF detection
      const isValidType = file.type === 'application/pdf' || 
                         file.type === 'application/x-pdf' ||
                         file.name.toLowerCase().endsWith('.pdf') ||
                         file.type.startsWith('image/');
      
      if (!isValidType) {
        console.log('Invalid file type:', file.type);
        alert(`File "${file.name}" is not a supported format. Please select PDF or image files.`);
        return false;
      }
      
      // Check file size
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        console.log('File too large:', file.size);
        alert(`File "${file.name}" is too large. Maximum file size is 10MB.`);
        return false;
      }
      return true;
    });

    console.log('Valid files:', files.length);
    if (files.length > 0) {
      console.log('Calling onFilesSelected with', files.length, 'files');
      onFilesSelected(files);
    } else {
      console.log('No valid files to process');
    }
    e.target.value = '';
  }, [onFilesSelected]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "upload-zone p-12 text-center cursor-pointer relative overflow-hidden",
        isDragging && "active",
        isProcessing && "pointer-events-none opacity-60"
      )}
    >
      <input
        ref={fileInputRef}
        id="file-upload-input"
        type="file"
        accept=".pdf,.PDF,image/*"
        multiple
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
        disabled={isProcessing}
        style={{ fontSize: 0 }}
      />
      
      <div 
        className="relative z-10 flex flex-col items-center gap-4 pointer-events-none"
      >
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
          <Upload className="w-8 h-8 text-accent" />
        </div>
        
        <div>
          <h3 className="font-serif text-xl text-foreground mb-2">
            Upload Financial Documents
          </h3>
          <p className="text-muted-foreground text-sm max-w-md">
            Drag and drop your bank statements, invoices, and receipts here (PDF or photos), or click to browse
          </p>
        </div>
        
        <div className="flex items-center gap-6 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>PDF Documents</span>
          </div>
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            <span>Images (JPG, PNG)</span>
          </div>
        </div>
      </div>
      
      {isDragging && (
        <div className="absolute inset-0 bg-accent/5 border-2 border-accent rounded-xl flex items-center justify-center pointer-events-none z-30">
          <span className="text-accent font-medium">Drop files here</span>
        </div>
      )}
    </div>
  );
};

export default UploadZone;
