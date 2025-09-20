import React, { useState, useCallback, ChangeEvent, useRef } from 'react';
import { enhanceImageWithGemini, frameImageWithGemini } from './services/geminiService';
import { Spinner, ImagePreview } from './components/ui';
import type { UploadedImage } from './types';

const FILTERS = [
  { name: 'কোন ফিল্টার নেই', css: 'none' },
  { name: 'গ্রেস্কেল', css: 'grayscale(1)' },
  { name: 'সেপিয়া', css: 'sepia(1)' },
  { name: 'রং উল্টানো', css: 'invert(1)' },
  { name: 'উজ্জ্বলতা বাড়ান', css: 'brightness(1.25)' },
  { name: 'রঙ ঘোরান', css: 'hue-rotate(90deg)' },
  { name: 'স্যাচুরেট', css: 'saturate(1.5)' },
  { name: 'কনট্রাস্ট', css: 'contrast(1.25)' },
  { name: 'ভিন্টেজ', css: 'sepia(0.6) contrast(0.9) brightness(1.1) saturate(1.2)' },
  { name: 'সাদাকালো ফিল্ম', css: 'grayscale(1) contrast(1.2) brightness(0.9)' },
];

const InfoModal = ({ onClose }: { onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-[#FFF8E1] text-gray-800 rounded-lg shadow-2xl w-full max-w-lg p-6 relative" onClick={e => e.stopPropagation()}>
            <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
            <h2 className="text-2xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">রিয়াদ এনহ্যান্স পাওয়ার</h2>
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold border-b pb-1 mb-2">সংস্করণের নাম</h3>
                    <p>রিয়াদ এনহ্যান্স পাওয়ার ৩.০</p>
                </div>
                <div>
                    <h3 className="text-lg font-semibold border-b pb-1 mb-2">নতুন কি আছে</h3>
                    <ul className="list-disc list-inside space-y-1">
                        <li><b>ম্যাজিক ফ্রেম:</b> AI ব্যবহার করে ছবির জন্য সেরা ফ্রেম স্বয়ংক্রিয়ভাবে ক্রপ করে।</li>
                        <li><b>নতুন ফিল্টার:</b> 'ভিন্টেজ' এবং 'সাদাকালো ফিল্ম' নামে দুটি শৈল্পিক ফিল্টার যোগ করা হয়েছে।</li>
                        <li>পূর্বের তুলনা স্লাইডার এবং সকল ফিচার উন্নত করা হয়েছে।</li>
                    </ul>
                </div>
                <div>
                    <h3 className="text-lg font-semibold border-b pb-1 mb-2">কিভাবে ব্যবহার করবেন</h3>
                    <ol className="list-decimal list-inside space-y-1">
                        <li>"ছবি আপলোড করুন" বোতামে ক্লিক করে আপনার ছবি নির্বাচন করুন।</li>
                        <li>প্রথমে "ছবি উন্নত করুন" বোতামে ক্লিক করুন।</li>
                        <li>ছবি উন্নত হওয়ার পর, "ম্যাজিক ফ্রেম" বোতামে ক্লিক করে স্বয়ংক্রিয়ভাবে ক্রপ করুন।</li>
                        <li>ফিল্টার ড্রপডাউন থেকে আপনার পছন্দের ইফেক্ট বেছে নিন।</li>
                        <li>"ডাউনলোড করুন" বোতামে ক্লিক করে চূড়ান্ত ছবিটি সংরক্ষণ করুন।</li>
                    </ol>
                </div>
            </div>
        </div>
    </div>
);

const ImageComparator = ({ original, enhanced, filter = 'none' }: { original: string, enhanced: string, filter?: string }) => {
    const [sliderPos, setSliderPos] = useState(50);
    const imageContainerRef = useRef<HTMLDivElement>(null);

    const handleMove = (clientX: number) => {
        if (!imageContainerRef.current) return;
        const rect = imageContainerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percent = (x / rect.width) * 100;
        setSliderPos(percent);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => handleMove(e.clientX);
    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => handleMove(e.touches[0].clientX);

    return (
        <div className="w-full max-w-2xl">
            <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">তুলনা করতে স্লাইড করুন</h2>
            <div
                ref={imageContainerRef}
                className="relative w-full aspect-square rounded-lg overflow-hidden select-none group border-2 border-dashed border-gray-400 cursor-ew-resize"
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
            >
                <img
                    src={original}
                    alt="Original"
                    className="absolute inset-0 object-contain h-full w-full pointer-events-none"
                />
                <div
                    className="absolute inset-0 overflow-hidden pointer-events-none"
                    style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                >
                    <img
                        src={enhanced}
                        alt="Enhanced"
                        className="object-contain h-full w-full pointer-events-none"
                        style={{ filter: filter }}
                    />
                </div>
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ left: `calc(${sliderPos}% - 2px)` }}
                >
                    <div className="w-1 h-full bg-white absolute shadow-md"></div>
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-10 w-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};


const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<UploadedImage | null>(null);
  const [displayImage, setDisplayImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFraming, setIsFraming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>(FILTERS[0].css);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const resetState = () => {
    setDisplayImage(null);
    setError(null);
    setSelectedFilter(FILTERS[0].css);
    setIsFraming(false);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('অনুগ্রহ করে একটি বৈধ ছবির ফাইল (JPEG, PNG, WebP) আপলোড করুন।');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setOriginalImage({ file, dataUrl });
      resetState();
    };
    reader.readAsDataURL(file);
  };

  const handleEnhance = useCallback(async () => {
    if (!originalImage) return;
    setIsLoading(true);
    resetState();
    try {
      const result = await enhanceImageWithGemini(originalImage.dataUrl);
      setDisplayImage(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।');
    } finally {
      setIsLoading(false);
    }
  }, [originalImage]);

  const handleFrame = useCallback(async () => {
    if (!displayImage) return;
    setIsFraming(true);
    setError(null);
    try {
        const result = await frameImageWithGemini(displayImage);
        setDisplayImage(result);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।');
    } finally {
        setIsFraming(false);
    }
  }, [displayImage]);
  
  const handleDownload = () => {
    if (!displayImage || !originalImage) return;

    if (selectedFilter === 'none') {
        const link = document.createElement('a');
        link.href = displayImage;
        const originalName = originalImage.file.name.split('.').slice(0, -1).join('.');
        link.download = `${originalName || 'enhanced'}-photo.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
    }
    
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = displayImage;

    image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            setError('ছবি ডাউনলোড করার জন্য ক্যানভাস তৈরি করা যায়নি।');
            return;
        }

        ctx.filter = selectedFilter;
        ctx.drawImage(image, 0, 0);

        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;

        const originalName = originalImage.file.name.split('.').slice(0, -1).join('.');
        link.download = `${originalName || 'enhanced'}-filtered.png`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    image.onerror = () => {
        setError('ফিল্টার করা ছবি লোড করতে সমস্যা হয়েছে। ডাউনলোড করা যাচ্ছে না।');
    };
  };

  return (
    <>
      {isModalOpen && <InfoModal onClose={() => setIsModalOpen(false)} />}
      <div className="min-h-screen bg-[#FFF8E1] text-gray-800 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
        <div className="w-full max-w-6xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
              আকাশ কম্পিউটার শপ বাই রিয়াদ হোসাইন হুযাইফা ফটো এনহ্যান্স
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              আপনার ছবি আপলোড করুন এবং কৃত্রিম বুদ্ধিমত্তার জাদু দেখুন। পাওয়ার্ড বাই রিয়াদ পাওয়ার
            </p>
          </header>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
              <strong className="font-bold">ত্রুটি: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <main className="mb-8 flex justify-center">
            {displayImage && originalImage && !isLoading ? (
                <div className="flex flex-col items-center gap-6 w-full">
                    <ImageComparator
                        original={originalImage.dataUrl}
                        enhanced={displayImage}
                        filter={selectedFilter}
                    />
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-[#F5EFE6] rounded-lg w-full max-w-2xl justify-center">
                      <div className="w-full sm:w-auto flex-grow">
                          <label htmlFor="filter-select" className="block text-sm font-medium text-gray-700 mb-2">
                              ফিল্টার প্রয়োগ করুন
                          </label>
                          <select
                              id="filter-select"
                              value={selectedFilter}
                              onChange={(e) => setSelectedFilter(e.target.value)}
                              className="bg-white border border-gray-400 text-gray-800 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-2.5"
                          >
                              {FILTERS.map((filter) => (
                                  <option key={filter.name} value={filter.css}>
                                      {filter.name}
                                  </option>
                              ))}
                          </select>
                      </div>
                      <div className="w-full sm:w-auto flex flex-col gap-2">
                        <button 
                          onClick={handleFrame} 
                          disabled={isFraming}
                          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold py-2.5 px-6 rounded-lg transition-colors shadow-lg flex items-center justify-center"
                        >
                            {isFraming && <Spinner small={true}/>}
                            {isFraming ? 'ফ্রেম হচ্ছে...' : 'ম্যাজিক ফ্রেম'}
                        </button>
                        <button
                            onClick={handleDownload}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors shadow-lg flex items-center justify-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            ডাউনলোড করুন
                        </button>
                      </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                    <ImagePreview title="মূল ছবি" imageUrl={originalImage?.dataUrl || null} />
                    <ImagePreview title="উন্নত ছবি" imageUrl={null} isLoading={isLoading} />
                </div>
            )}
          </main>

          <footer className="flex flex-col items-center space-y-4">
            <div className="flex flex-wrap justify-center gap-4">
              <label className="cursor-pointer bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg">
                <span>ছবি আপলোড করুন</span>
                <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
              </label>

              <button
                onClick={handleEnhance}
                disabled={!originalImage || isLoading}
                className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg flex items-center justify-center min-w-[170px]"
              >
                {isLoading && <Spinner />}
                {isLoading ? 'উন্নত হচ্ছে...' : 'ছবি উন্নত করুন'}
              </button>
              
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg"
              >
                নতুন কি আছে
              </button>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
};

export default App;
