"use client";

import { useState, useRef } from "react";
import { 
  HiPhoto, 
  HiXMark, 
  HiArrowPath,
  HiInformationCircle,
  HiExclamationTriangle
} from "react-icons/hi2";
import { 
  compressImage, 
  validateImage, 
  blobToBase64, 
  getImageDimensions 
} from "../utils/imageHandler";

export default function ImageAttach({ onImageSelect, disabled }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [imageInfo, setImageInfo] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError(null);
    setIsProcessing(true);

    try {
      const validation = validateImage(file);
      if (!validation.valid) {
        setError(validation.error);
        setIsProcessing(false);
        return;
      }

      const originalDimensions = await getImageDimensions(file);
      const originalSize = file.size;

      console.log('📸 Processing image:', {
        name: file.name,
        size: originalSize,
        dimensions: originalDimensions
      });

      const compressedBlob = await compressImage(file, 0.8, 1200, 1200);
      const compressedSize = compressedBlob.size;

      const base64 = await blobToBase64(compressedBlob);
      
      const previewUrl = URL.createObjectURL(compressedBlob);
      
      const imageData = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        data: base64, 
        blob: compressedBlob, 
        size: compressedSize,
        originalSize: originalSize,
        dimensions: originalDimensions,
        mimeType: compressedBlob.type,
        timestamp: new Date().toISOString()
      };

      setPreview(previewUrl);
      setImageInfo({
        name: file.name,
        originalSize: originalSize,
        compressedSize: compressedSize,
        compressionRatio: ((originalSize - compressedSize) / originalSize * 100).toFixed(1),
        dimensions: originalDimensions
      });

      console.log('📸 Image processed:', {
        originalSize: Math.round(originalSize / 1024) + 'KB',
        compressedSize: Math.round(compressedSize / 1024) + 'KB',
        compressionRatio: imageInfo?.compressionRatio + '%'
      });

      onImageSelect(imageData);

    } catch (error) {
      console.error('Error processing image:', error);
      setError('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearImage = () => {
    setPreview(null);
    setImageInfo(null);
    setError(null);
    onImageSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="relative">
      {preview && (
        <div className="mb-3 bg-white/5 backdrop-blur-md border border-white/10 shadow-xl rounded-lg p-3">
          <div className="flex items-start gap-3">
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-white/20"
              />
              <button
                onClick={clearImage}
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
              >
                <HiXMark className="w-3 h-3" />
              </button>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {imageInfo?.name}
              </div>
              
              <div className="text-xs text-gray-400 space-y-1 mt-1">
                <div className="flex items-center gap-4">
                  <span>
                    {imageInfo?.dimensions.width} × {imageInfo?.dimensions.height}
                  </span>
                  <span>
                    {formatFileSize(imageInfo?.compressedSize)}
                  </span>
                </div>
                
                {imageInfo?.compressionRatio > 0 && (
                  <div className="flex items-center gap-1 text-green-400">
                    <HiInformationCircle className="w-3 h-3" />
                    <span>
                      Compressed by {imageInfo?.compressionRatio}%
                    </span>
                  </div>
                )}
                
                <div className="text-yellow-400 text-xs">
                  📁 Will be stored temporarily on server
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-3 p-2 bg-red-500/20 border border-red-500 text-red-200 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <HiExclamationTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={disabled || isProcessing}
          className="hidden"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isProcessing}
          className="bg-white/5 backdrop-blur-xl border border-white/20 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 rounded-lg px-3 py-2 text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
        >
          {isProcessing ? (
            <>
              <HiArrowPath className="w-4 h-4 animate-spin" />
              <span className="hidden sm:inline">Processing...</span>
            </>
          ) : (
            <>
              <HiPhoto className="w-4 h-4" />
              <span className="hidden sm:inline">
                {preview ? 'Change Image' : 'Add Image'}
              </span>
            </>
          )}
        </button>

        {preview && !isProcessing && (
          <div className="text-xs text-gray-400 hidden sm:block">
            Ready to send
          </div>
        )}
      </div>

      {!preview && !error && (
        <div className="text-xs text-gray-500 mt-1">
          Max 10MB • JPEG, PNG, GIF, WebP • Auto-deleted after TTL
        </div>
      )}
    </div>
  );
}