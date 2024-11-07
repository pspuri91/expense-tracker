"use client"

import { useState, useRef, useEffect } from 'react'
import { Camera, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createWorker } from 'tesseract.js'
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import stringSimilarity from 'string-similarity';

interface ReceiptData {
  date?: string;
  name?: string;
  price?: number;
  store?: string;
  category?: string;
}

interface ReceiptScannerProps {
  onScanComplete: (data: ReceiptData) => void;
  type: 'grocery' | 'expense';
}

export function ReceiptScanner({ onScanComplete, type }: ReceiptScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [commonStores, setCommonStores] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    const fetchStoreNames = async () => {
      try {
        const response = await fetch('/api/stores');
        if (!response.ok) {
          throw new Error('Failed to fetch store names');
        }
        const data = await response.json();
        setCommonStores(data);
      } catch (error) {
        console.error('Error fetching store names:', error);
        toast({
          title: "Error",
          description: "Failed to load store suggestions. You can still enter store names manually.",
          variant: "destructive",
        });
      }
    };

    fetchStoreNames();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: `Unable to access camera. Please check permissions or try uploading an image instead.`,
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const processImage = async (imageData: string) => {
    setIsScanning(true);
    try {
      const worker = await createWorker();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      const { data: { text } } = await worker.recognize(imageData);
      await worker.terminate();

      console.log('OCR Text:', text);

      const receiptData = parseReceiptText(text);
      console.log('Parsed Receipt Data:', receiptData);
      onScanComplete(receiptData);
    } catch (error) {
      console.error('Error processing receipt:', error);
      toast({
        title: "Scanning Error",
        description: "Failed to process receipt. Please try again or enter details manually.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
      stopCamera();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;
      await processImage(imageData);
    };
    reader.readAsDataURL(file);
  };

  const parseReceiptText = (text: string): ReceiptData => {
    const lines = text.split('\n');
    const data: ReceiptData = {};
  
    const datePattern = /(?:date\s*[:\-]?\s*)?(\d{1,2}\/\d{1,2}\/\d{2,4})/i;
    let pricePattern = /\$?\d+\.\d{2}/;
    let previousLine = ''; // Store the previous line for reference
  
    const formatDateString = (dateString: string): string => {
      const [day, month, year] = dateString.split('/').map(Number);
  
      if (day > 12) {
        return `${year < 100 ? 2000 + year : year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      } else {
        return `${year < 100 ? 2000 + year : year}-${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}`;
      }
    };
  
    const cleanItemName = (name: string): string => {
      return name
        .replace(/[0-9. ]+/, '') // Remove leading numbers
        .replace(/\s{2,}/g, ' ') // Replace multiple spaces
        .replace(/[*#]+/g, '') // Remove special characters
        .replace(/^\W+|\W+$/g, '') // Remove leading/trailing non-word characters
        .replace(/\b(?:QTY|QUANTITY|ITEM|NO)\b\s*:?\s*/gi, '') // Remove common prefixes
        .trim();
    };
  
    for (const line of lines) {
      const dateMatch = line.match(datePattern);
      if (dateMatch && !data.date) {
        data.date = formatDateString(dateMatch[1]);
      }

      if (!data.store) {
        const matches = stringSimilarity.findBestMatch(line.toUpperCase(), commonStores.map(store => store.toUpperCase()));
        const bestMatch = matches.bestMatch;
        if (bestMatch.rating >= 0.5) { // Adjust the threshold as needed
          data.store = commonStores[matches.bestMatchIndex];
        }
      }

      if(data.store) {
        switch(data.store) {
          case "NoFrills": {
            pricePattern = /\d{1,2}\.\d{2}$/;
            break;
          }
          default: {}
        }
      }
  
      const priceMatch = line.match(pricePattern);
      if (priceMatch && !data.price) {
        data.price = parseFloat(priceMatch[0].replace('$', ''));
        
        // Try to find name in the same line
        const priceIndex = line.indexOf(priceMatch[0]);
        if (priceIndex > 0) {
          const itemName = cleanItemName(line.substring(0, priceIndex));
          if (itemName && /[a-zA-Z]/.test(itemName)) {
            data.name = itemName;
          }
        } 
        
        if (!data.name && previousLine) {
          const prevLineName = cleanItemName(previousLine);
          console.log("Previous line name:", prevLineName, /[a-zA-Z]/.test(prevLineName));
          // Check if previous line contains alphabets and not just numbers/special chars
          if (prevLineName && /[a-zA-Z]/.test(prevLineName)) {
            data.name = prevLineName;
          }
        }
      }

      // Store current line for next iteration
      
      if (line.trim() && /[a-zA-Z]/.test(line)) {
        previousLine = line;
      }
  
      
    }
  
    return data;
  };

  const captureImage = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg');
    console.log('Captured Image Data:', imageData);
    processImage(imageData);
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={startCamera}
          disabled={isScanning}
        >
          <Camera className={`h-4 w-4 ${isScanning ? 'animate-pulse' : ''}`} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
        >
          <Upload className="h-4 w-4" />
        </Button>
        <Input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          ref={fileInputRef}
          className="hidden"
        />
      </div>

      {/* Camera Preview */}
      <div className={`fixed inset-0 bg-black z-50 ${stream ? 'block' : 'hidden'}`}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
          <Button onClick={captureImage} disabled={isScanning}>
            {isScanning ? 'Processing...' : 'Capture'}
          </Button>
          <Button 
            variant="secondary" 
            onClick={stopCamera}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
} 