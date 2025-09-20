import React, { useState, useCallback, ChangeEvent } from 'react';
import { enhanceImageWithGemini } from './services/geminiService';
import { Spinner, ImagePreview } from './components/ui';
import type { UploadedImage } from './types';

const FILTERS = [
  { name: 'No Filter', css: 'filter-none' },
  { name: 'Grayscale', css: 'grayscale' },
  { name: 'Sepia', css: 'sepia' },
  { name: 'Invert Colors', css: 'invert' },
];

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<UploadedImage | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>(FILTERS[0].css);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setOriginalImage({ file, dataUrl });
      setEnhancedImage(null); // Reset enhanced image on new upload
      setError(null); // Clear previous errors
      setSelectedFilter(FILTERS[0].css); // Reset filter on new image
    };
    reader.readAsDataURL(file);
  };

  const handleEnhance = useCallback(async () => {
    if (!originalImage) return;

    setIsLoading(true);
    setError(null);
    setEnhancedImage(null);
    setSelectedFilter(FILTERS[0].css); // Reset filter on enhance

    try {
      const result = await enhanceImageWithGemini(originalImage.dataUrl);
      setEnhancedImage(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [originalImage]);

  const handleDownload = () => {
    if (!enhancedImage) return;
    const link = document.createElement('a');
    link.href = enhancedImage;
    const originalName = originalImage?.file.name.split('.').slice(0, -1).join('.');
    link.download = `${originalName || 'enhanced'}-photo.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Akash Computer Shop by Riyad Hossain Huzaifa Photo Enhance
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Upload your photo and let AI work its magic. Powered by Riyad Power
          </p>
        </header>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <main className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <ImagePreview title="Original Image" imageUrl={originalImage?.dataUrl || null} />
          <div className="flex flex-col gap-4">
            <ImagePreview
              title="Enhanced Image"
              imageUrl={enhancedImage}
              isLoading={isLoading}
              filter={selectedFilter}
            />
            {enhancedImage && !isLoading && (
              <div className="flex flex-col items-center gap-6 p-4 bg-gray-800 rounded-lg">
                <div className="w-full max-w-xs">
                  <label htmlFor="filter-select" className="block text-sm font-medium text-gray-300 mb-2 text-center">
                    Apply a Filter
                  </label>
                  <select
                    id="filter-select"
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  >
                    {FILTERS.map((filter) => (
                      <option key={filter.css} value={filter.css}>
                        {filter.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleDownload}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg flex items-center"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Enhanced Image
                </button>
              </div>
            )}
          </div>
        </main>

        <footer className="flex flex-col items-center space-y-4">
          <div className="flex flex-wrap justify-center gap-4">
            <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg">
              <span>Upload Photo</span>
              <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
            </label>

            <button
              onClick={handleEnhance}
              disabled={!originalImage || isLoading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg flex items-center justify-center min-w-[170px]"
            >
              {isLoading && <Spinner />}
              {isLoading ? 'Enhancing...' : 'Enhance Photo'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;