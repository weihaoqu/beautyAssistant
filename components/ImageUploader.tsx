import React, { useRef, useState, useEffect } from 'react';
import { Upload, Camera, Image as ImageIcon, X, Aperture } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (base64: string) => void;
  isLoading: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      // Small delay to ensure video element is rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please allow camera permissions.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        // Mirror the image to match the user-facing camera view
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        stopCamera();
        setPreview(dataUrl);
        onImageSelected(dataUrl);
      }
    }
  };

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        onImageSelected(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const clearImage = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleChange}
      />
      
      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {isCameraOpen ? (
        <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-black border-4 border-slate-800 aspect-[4/3] flex items-center justify-center">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />
          
          <button
            onClick={stopCamera}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-colors z-10"
          >
            <X size={24} />
          </button>

          <div className="absolute bottom-6 left-0 right-0 flex justify-center z-10">
            <button
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full border-4 border-white bg-rose-500 hover:bg-rose-600 transition-all shadow-lg flex items-center justify-center"
              aria-label="Capture Photo"
            >
              <div className="w-12 h-12 rounded-full border-2 border-white/20"></div>
            </button>
          </div>
        </div>
      ) : !preview ? (
        <div
          className={`relative border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-300 ease-in-out cursor-pointer group
            ${dragActive ? 'border-rose-400 bg-rose-50' : 'border-slate-300 hover:border-rose-300 hover:bg-slate-50'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
            <Camera size={40} />
          </div>
          
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            Upload your photo
          </h3>
          <p className="text-slate-500 mb-6 max-w-xs mx-auto">
            Take a selfie or drag and drop an image here. For best results, ensure good lighting.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
             <button 
              onClick={(e) => { e.stopPropagation(); startCamera(); }}
              className="px-6 py-2.5 rounded-full bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors shadow-md shadow-rose-200 flex items-center justify-center gap-2"
            >
               <Aperture size={18} />
               Take Selfie
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              className="px-6 py-2.5 rounded-full bg-white text-slate-700 border border-slate-200 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center gap-2"
            >
               <Upload size={18} />
               Select File
            </button>
          </div>
        </div>
      ) : (
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white max-w-sm mx-auto">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-auto object-cover" 
          />
          {isLoading ? (
             <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
                <p className="font-medium animate-pulse">Analyzing skin & hair...</p>
             </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); clearImage(); }}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
