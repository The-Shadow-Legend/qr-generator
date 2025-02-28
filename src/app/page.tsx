// pages/index.tsx
'use client'
import { useState, ChangeEvent, useRef, useCallback } from 'react';
import QRCode from 'qrcode';

export default function Home() {
  // State Management
  const [inputData, setInputData] = useState<string>('');
  const [qrCode, setQRCode] = useState<string>('');
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Logo Upload Handler
  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file
      if (file.size > 5 * 1024 * 1024) {
        setError('Logo must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas for logo processing
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const maxSize = 100; // Max logo size
          const borderWidth = 10; // White border width

          // Set canvas size
          canvas.width = maxSize;
          canvas.height = maxSize;

          // Calculate image scaling
          let width = img.width;
          let height = img.height;
          const scale = Math.min(
            (maxSize - 2 * borderWidth) / width, 
            (maxSize - 2 * borderWidth) / height
          );

          // Scaled image dimensions
          const scaledWidth = width * scale;
          const scaledHeight = height * scale;

          // Background with rounded corners
          ctx!.fillStyle = 'white';
          ctx!.beginPath();
          ctx!.roundRect(0, 0, maxSize, maxSize, [20]); // Rounded rectangle
          ctx!.fill();

          // Create circular clipping region for image
          ctx?.beginPath();
          ctx?.arc(
            maxSize / 2, 
            maxSize / 2, 
            (maxSize - 2 * borderWidth) / 2, 
            0, 
            Math.PI * 2
          );
          ctx?.closePath();
          ctx?.clip();

          // Draw image centered
          const x = (maxSize - scaledWidth) / 2;
          const y = (maxSize - scaledHeight) / 2;
          ctx?.drawImage(
            img, 
            x, 
            y, 
            scaledWidth, 
            scaledHeight
          );

          // Set preview
          const processedLogoDataUrl = canvas.toDataURL('image/png');
          setLogoPreview(processedLogoDataUrl);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // Embed Logo in QR Code
  const embedLogoInQRCode = useCallback(async () => {
    // Validate inputs
    if (!inputData.trim()) {
      setError('Please enter data');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Generate QR Code
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Clear previous content
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);

      // Generate QR Code
      await QRCode.toCanvas(canvas, inputData, {
        errorCorrectionLevel: 'H',
        width: 400,
        margin: 1,
      });

      // If logo is available, embed it
      if (logoPreview) {
        const logoImg = new Image();
        logoImg.onload = () => {
          // Calculate logo position (center of QR code)
          const logoSize = 100; // Fixed logo size
          const x = (canvas.width - logoSize) / 2;
          const y = (canvas.height - logoSize) / 2;

          // Draw logo
          ctx!.drawImage(logoImg, x, y, logoSize, logoSize);

          // Update QR Code with embedded logo
          setQRCode(canvas.toDataURL('image/png'));
        };
        logoImg.src = logoPreview;
      } else {
        // No logo, just set QR code
        setQRCode(canvas.toDataURL('image/png'));
      }
    } catch (err) {
      console.error('QR Code Generation Error:', err);
      setError('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  }, [inputData, logoPreview]);

  // Remove Logo
  const removeLogo = () => {
    setLogoPreview('');
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  // Download QR Code
  const downloadQRCode = () => {
    if (!qrCode) {
      setError('No QR code to download');
      return;
    }

    const a = document.createElement('a');
    a.href = qrCode;
    a.download = `qrcode-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <div className="w-full max-w-md bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">
          QR Code Generator with Logo
        </h1>

        {/* Input Data */}
        <div className="mb-4">
          <textarea
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            placeholder="Enter data for QR code"
            className="w-full p-2 border rounded"
            rows={4}
          />
        </div>

        {/* Logo Upload */}
        <div className="mb-4">
          <label className="block mb-2">Upload Logo (Optional)</label>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="w-full p-2 border rounded"
          />

          {/* Logo Preview */}
          {logoPreview && (
            <div className="mt-2 flex items-center">
              <div className="w-24 h-24 bg-white rounded-lg shadow-lg overflow-hidden flex items-center justify-center p-1">
                <div className="w-full h-full rounded-full overflow-hidden">
                  <img 
                    src={logoPreview} 
                    alt="Logo Preview" 
                    className="w-full h-full object-cover" 
                  />
                </div>
              </div>
              <button
                onClick={removeLogo}
                className="ml-4 bg-red-500 text-white px-3 py-1 rounded"
              >
                Remove Logo
              </button>
            </div>
          )}
        </div>

        {/* Generate Button */}
        <div className="flex justify-center mb-4">
          <button
            onClick={embedLogoInQRCode}
            disabled={loading}
            className={`px-4 py-2 rounded ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {loading ? 'Generating...' : 'Generate QR Code'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Hidden Canvas for QR Code Generation */}
        <canvas 
          ref={canvasRef} 
          style={{ display: 'none' }} 
          width={400} 
          height={400} 
        />

        {/* QR Code Display */}
        {qrCode && (
          <div className="text-center">
            <img 
              src={qrCode} 
              alt="Generated QR Code" 
              className="mx-auto mb-4 max-w-full rounded"
            />
            <div className="flex justify-center space-x-4">
              <button
                onClick={downloadQRCode}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Download QR Code
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// export default Home;