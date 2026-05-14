import React, { useState, useRef } from 'react';
import axios from 'axios';
import { UploadCloud, FileVideo, Sparkles, CheckCircle2, Copy, AlertCircle } from 'lucide-react';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [script, setScript] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('video/')) {
      setError('Vui lòng chọn một tệp video hợp lệ.');
      return;
    }
    // Limit to 100MB roughly for browser safety
    if (selectedFile.size > 100 * 1024 * 1024) {
      setError('Kích thước video quá lớn (Giới hạn: 100MB).');
      return;
    }
    setError('');
    setFile(selectedFile);
    setScript('');
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleGenerate = async () => {
    if (!file) return;

    setIsLoading(true);
    setError('');
    setScript('');

    const formData = new FormData();
    formData.append('video', file);

    try {
      // Assuming Backend runs on port 3000
      const response = await axios.post('http://localhost:3000/api/generate-script', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes timeout since Gemini takes time to process video
      });

      setScript(response.data.script);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Đã có lỗi xảy ra trong quá trình tạo kịch bản.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container">
      <header>
        <h1>AI Video Captioning</h1>
        <p>Tự động tạo kịch bản lồng tiếng từ video của bạn với Gemini 1.5 Pro</p>
      </header>

      <main>
        <div className="upload-card">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="video/*" 
            style={{ display: 'none' }} 
          />
          
          <div 
            className={`dropzone ${isDragging ? 'active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileInput}
          >
            <UploadCloud className="drop-icon" />
            <h3>Kéo thả video vào đây hoặc Click để chọn file</h3>
            <p style={{ color: 'var(--text-muted)' }}>Hỗ trợ MP4, MOV, AVI (Tối đa 100MB, ~5 phút)</p>
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
              {error}
            </div>
          )}

          {file && (
            <div className="file-info">
              <FileVideo className="text-primary" />
              <div className="file-name">
                <strong>{file.name}</strong> ({(file.size / (1024 * 1024)).toFixed(2)} MB)
              </div>
            </div>
          )}

          <button 
            className="btn-generate" 
            onClick={handleGenerate} 
            disabled={!file || isLoading}
          >
            <Sparkles size={18} />
            {isLoading ? 'Đang phân tích video...' : 'Tạo kịch bản lồng tiếng'}
          </button>
        </div>

        {isLoading && (
          <div className="loader-container">
            <div className="spinner"></div>
            <p className="loading-text">
              AI đang "xem" video của bạn và viết kịch bản... <br/>
              <span style={{ fontSize: '0.9em', color: 'var(--text-muted)', display: 'block', marginTop: '8px' }}>Quá trình này có thể mất 1-3 phút tùy thuộc vào độ dài video.</span>
            </p>
          </div>
        )}

        {script && !isLoading && (
          <div className="result-card">
            <div className="result-header">
              <h2><Sparkles size={20} color="var(--primary)" /> Kịch bản lồng tiếng</h2>
              <button 
                className={`btn-copy ${copied ? 'copied' : ''}`} 
                onClick={copyToClipboard}
              >
                {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                {copied ? 'Đã copy' : 'Copy'}
              </button>
            </div>
            <div className="script-content">
              {script}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
