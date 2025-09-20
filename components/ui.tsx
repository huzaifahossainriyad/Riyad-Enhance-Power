import React from 'react';

// Spinner Component
export const Spinner: React.FC = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// ImagePreview Component
interface ImagePreviewProps {
  title: string;
  imageUrl: string | null;
  isLoading?: boolean;
  filter?: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ title, imageUrl, isLoading = false, filter = 'filter-none' }) => (
  <div className="w-full">
    <h2 className="text-xl font-semibold mb-4 text-center text-gray-300">{title}</h2>
    <div className="relative w-full bg-gray-800 rounded-lg aspect-square flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-600">
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-10">
          <Spinner />
          <p className="mt-2 text-lg">Enhancing photo...</p>
        </div>
      )}
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={title} 
          className={`object-contain h-full w-full transition-all duration-300 ${filter}`} 
        />
      ) : (
        <div className="text-gray-500 text-center px-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="mt-2">{title === 'Original Image' ? 'Upload an image to start' : 'Enhanced image will appear here'}</p>
        </div>
      )}
    </div>
  </div>
);
