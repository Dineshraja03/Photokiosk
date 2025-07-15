import React, { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  X,
  Crop,
  Sun,
  Circle,
  Palette,
  Square,
  Save,
  Plus,
  Minus,
  Check,
  RotateCw,
  RotateCcw,
  Settings,
  Type,
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  Filter
} from "lucide-react";
// Import React Icons for filters and frames
import { 
  FaRegCircle, 
  FaSquare, 
  FaRegSquare, 
  FaBorderAll,
  FaPalette,
  FaEye,
  FaFire,
  FaSnowflake,
  FaSun,
  FaMoon,
  FaGem,
  FaImage,
  FaCamera,
  FaDesktop,
  FaMobile
} from 'react-icons/fa';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Dynamic import for fabric
let fabric: any;

interface Session {
  id: string;
  name: string;
  date: string;
  type: string;
  images: string[];
  customerDetails: {
    name: string;
    location: string;
    date: string;
  };
  status: "pending" | "ready" | "completed";
  printCount?: number;
  editedImages?: number[];
  originalImages?: string[];
}

interface PhotoEditorProps {
  session: Session;
  onClose: () => void;
  onSave: (sessionId: string, imageIndex: number, editedImageUrl: string) => void;
  onDeleteImage?: (sessionId: string, imageIndex: number) => void;
  initialSelectedIndex?: number;
}

export function PhotoEditor({ 
  session, 
  onClose, 
  onSave, 
  onDeleteImage, 
  initialSelectedIndex = 0 
}: PhotoEditorProps) {
  // Canvas and fabric refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  const originalImageRef = useRef<any>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);

  // Core state variables - Make sure these are declared at the top
  const [fabricLoaded, setFabricLoaded] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(initialSelectedIndex); // This line must be present
  const [activeTool, setActiveTool] = useState<string>("");
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [currentImages, setCurrentImages] = useState<string[]>(session.images);
  const [editedImages, setEditedImages] = useState<Set<number>>(
    new Set(session.editedImages || [])
  );

  // Adjustment state
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);

  // Tool state
  const [isCropping, setIsCropping] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState<string>("none");
  const [selectedBorder, setSelectedBorder] = useState<string>("none");
  const [selectedFilter, setSelectedFilter] = useState<string>("none");
  const [borderWidth, setBorderWidth] = useState(10);
  const [borderColor, setBorderColor] = useState("#000000");

  // Dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<number | null>(null);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Watermark states
  const [watermarkText, setWatermarkText] = useState("");
  const [watermarkColor, setWatermarkColor] = useState("#000000");
  const [watermarkSize, setWatermarkSize] = useState(20);
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.5);
  const [watermarkImageOpacity, setWatermarkImageOpacity] = useState(0.5);

  // Filter options with React Icons
  const filterOptions = [
    { value: "none", label: "None", icon: FaRegCircle, color: "#ffffff" },
    { value: "blackwhite", label: "Black & White", icon: FaRegSquare, color: "#808080" },
    { value: "sepia", label: "Sepia", icon: FaEye, color: "#8B4513" },
    { value: "cyberpunk", label: "Cyberpunk", icon: FaGem, color: "#8A2BE2" },
    { value: "vivid", label: "Vivid", icon: FaPalette, color: "#FF6B6B" },
    { value: "warm", label: "Warm", icon: FaSun, color: "#FFA500" },
    { value: "cool", label: "Cool", icon: FaSnowflake, color: "#4169E1" },
    { value: "hdr", label: "HDR", icon: FaFire, color: "#FFD700" }
  ];

  // Frame options with React Icons
  const frameOptions = [
    { value: "none", label: "None", icon: FaRegSquare },
    { value: "classic", label: "Classic", icon: FaSquare },
    { value: "modern", label: "Modern", icon: FaDesktop },
    { value: "vintage", label: "Vintage", icon: FaCamera },
    { value: "polaroid", label: "Polaroid", icon: FaImage },
    { value: "ornate", label: "Ornate", icon: FaGem }
  ];

  // Border options with React Icons
  const borderOptions = [
    { value: "none", label: "None", icon: FaRegCircle },
    { value: "solid", label: "Solid", icon: FaBorderAll },
    { value: "dashed", label: "Dashed", icon: FaSquare },
    { value: "dotted", label: "Dotted", icon: Circle },
    { value: "double", label: "Double", icon: FaDesktop },
    { value: "rounded", label: "Rounded", icon: FaRegCircle }
  ];

  // Tool categories
  const toolCategories = [
    { id: "crop", label: "Crop", icon: Crop },
    { id: "adjustment", label: "Adjustment", icon: Settings },
    { id: "filter", label: "Filter", icon: Filter },
    { id: "frame", label: "Frame", icon: Square },
    { id: "border", label: "Border", icon: Circle },
    { id: "watermark", label: "Watermark", icon: Type }
  ];

  // Load fabric.js dynamically
  useEffect(() => {
    const loadFabric = async () => {
      try {
        const fabricModule = await import('fabric');
        fabric = fabricModule.fabric || fabricModule.default || fabricModule;
        setFabricLoaded(true);
      } catch (error) {
        console.error('Failed to load fabric.js:', error);
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.0/fabric.min.js';
        script.onload = () => {
          fabric = (window as any).fabric;
          setFabricLoaded(true);
        };
        document.head.appendChild(script);
      }
    };

    loadFabric();
  }, []);

  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current && fabricLoaded && fabric) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: "#ffffff",
      });

      fabricCanvasRef.current = canvas;

      if (currentImages.length > 0) {
        loadImageToCanvas(currentImages[selectedImageIndex]);
      }

      return () => {
        canvas.dispose();
        if (autoSaveTimeout) {
          clearTimeout(autoSaveTimeout);
        }
      };
    }
  }, [fabricLoaded]);

  // Update currentImages state when session.images changes
  useEffect(() => {
    setCurrentImages(session.images);
    setEditedImages(new Set(session.editedImages || []));
  }, [session.images, session.editedImages]);

  // Load image when selectedImageIndex changes
  useEffect(() => {
    if (fabricCanvasRef.current && currentImages[selectedImageIndex] && fabricLoaded) {
      loadImageToCanvas(currentImages[selectedImageIndex]);
    }
  }, [selectedImageIndex, fabricLoaded, currentImages]);

  // Convert image to base64 to avoid CORS issues
  const convertImageToBase64 = (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (imageUrl.startsWith('data:')) {
        resolve(imageUrl);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          try {
            const base64 = canvas.toDataURL('image/png');
            resolve(base64);
          } catch (error) {
            console.warn('CORS issue detected, using original URL:', error);
            resolve(imageUrl);
          }
        } else {
          reject(new Error('Could not get canvas context'));
        }
      };
      
      img.onerror = () => {
        console.warn('Failed to load image for conversion, using original URL');
        resolve(imageUrl);
      };
      
      img.src = imageUrl;
    });
  };

  const loadImageToCanvas = async (imageUrl: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !fabric) return;

    setIsImageLoaded(false);
    
    try {
      const base64Image = await convertImageToBase64(imageUrl);
      
      fabric.Image.fromURL(base64Image, (img: any) => {
        if (!img) {
          console.error('Failed to load image');
          return;
        }

        canvas.clear();
        
        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();
        const scale = Math.min(canvasWidth / img.width!, canvasHeight / img.height!) * 0.8;
        
        img.scale(scale);
        img.set({
          left: canvasWidth / 2,
          top: canvasHeight / 2,
          originX: 'center',
          originY: 'center'
        });
        
        img.setCoords();
        img.selectable = false;
        img.evented = false;
        img.id = 'mainImage';
        
        originalImageRef.current = img;
        
        canvas.add(img);
        canvas.sendToBack(img);
        canvas.renderAll();
        
        setIsImageLoaded(true);
        
        setBrightness(0);
        setContrast(0);
        setSaturation(0);
        setSelectedFrame('none');
        setSelectedBorder('none');
        setSelectedFilter('none');
        setIsCropping(false);
      }, { crossOrigin: 'anonymous' });
      
    } catch (error) {
      console.error('Error loading image:', error);
      setIsImageLoaded(false);
    }
  };

  // Updated save functions
  const saveCurrentImage = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !isImageLoaded) return;

    try {
      const dataURL = canvas.toDataURL({
        format: "png",
        quality: 1,
      });

      // Update local currentImages state immediately
      setCurrentImages(prev => {
        const newImages = [...prev];
        newImages[selectedImageIndex] = dataURL;
        return newImages;
      });

      // Call the parent's save handler
      onSave(session.id, selectedImageIndex, dataURL);
      setShowSaveDialog(true);
      
      // Mark this image as edited
      setEditedImages(prev => new Set(prev).add(selectedImageIndex));
    } catch (error) {
      console.error('Save failed:', error);
      alert('Save failed due to image security restrictions.');
    }
  };

  const saveAllImages = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !isImageLoaded) return;

    try {
      const dataURL = canvas.toDataURL({
        format: "png",
        quality: 1,
      });

      // Update local currentImages state immediately
      setCurrentImages(prev => {
        const newImages = [...prev];
        newImages[selectedImageIndex] = dataURL;
        return newImages;
      });

      // Call the parent's save handler
      onSave(session.id, selectedImageIndex, dataURL);
      
      // Mark this image as edited
      setEditedImages(prev => new Set(prev).add(selectedImageIndex));
      
      alert('Image saved successfully!');
    } catch (error) {
      console.error('Save all failed:', error);
      alert('Save failed due to image security restrictions.');
    }
  };

  const toggleTool = (toolId: string) => {
    if (activeTool === toolId) {
      setActiveTool("");
    } else {
      setActiveTool(toolId);
    }
  };

  // Filter functions
  const applyFilter = (filterType: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !fabric || !isImageLoaded) return;

    const mainImage = canvas.getObjects().find((obj: any) => obj.id === 'mainImage');
    if (!mainImage) return;

    try {
      const existingFilters = mainImage.filters || [];
      const adjustmentFilters = existingFilters.filter((filter: any) => {
        return (
          (fabric.Image?.filters?.Brightness && filter instanceof fabric.Image.filters.Brightness) ||
          (fabric.Image?.filters?.Contrast && filter instanceof fabric.Image.filters.Contrast) ||
          (fabric.Image?.filters?.Saturation && filter instanceof fabric.Image.filters.Saturation)
        );
      });

      if (filterType === 'none') {
        mainImage.filters = adjustmentFilters;
        mainImage.applyFilters();
        canvas.renderAll();
        setSelectedFilter('none');
        return;
      }

      let newFilters = [...adjustmentFilters];

      switch (filterType) {
        case 'blackwhite':
          if (fabric.Image?.filters?.Grayscale) {
            newFilters.push(new fabric.Image.filters.Grayscale());
          }
          break;
          
        case 'sepia':
          if (fabric.Image?.filters?.Sepia) {
            newFilters.push(new fabric.Image.filters.Sepia());
          }
          break;
          
        case 'cyberpunk':
          if (fabric.Image?.filters?.Contrast) {
            newFilters = newFilters.filter(f => !(fabric.Image?.filters?.Contrast && f instanceof fabric.Image.filters.Contrast));
            newFilters.push(new fabric.Image.filters.Contrast({ contrast: 0.3 }));
          }
          if (fabric.Image?.filters?.ColorMatrix) {
            newFilters.push(new fabric.Image.filters.ColorMatrix({
              matrix: [
                1.2, 0, 0.8, 0, 0,
                0, 0.8, 1.2, 0, 0,
                0.8, 0, 1.2, 0, 0,
                0, 0, 0, 1, 0
              ]
            }));
          }
          break;
          
        case 'vivid':
          if (fabric.Image?.filters?.Saturation) {
            newFilters = newFilters.filter(f => !(fabric.Image?.filters?.Saturation && f instanceof fabric.Image.filters.Saturation));
            newFilters.push(new fabric.Image.filters.Saturation({ saturation: 0.4 }));
          }
          if (fabric.Image?.filters?.Contrast) {
            newFilters = newFilters.filter(f => !(fabric.Image?.filters?.Contrast && f instanceof fabric.Image.filters.Contrast));
            newFilters.push(new fabric.Image.filters.Contrast({ contrast: 0.2 }));
          }
          break;
          
        case 'warm':
          if (fabric.Image?.filters?.ColorMatrix) {
            newFilters.push(new fabric.Image.filters.ColorMatrix({
              matrix: [
                1.2, 0.1, 0, 0, 0,
                0.1, 1.1, 0, 0, 0,
                0, 0, 0.8, 0, 0,
                0, 0, 0, 1, 0
              ]
            }));
          }
          break;
          
        case 'cool':
          if (fabric.Image?.filters?.ColorMatrix) {
            newFilters.push(new fabric.Image.filters.ColorMatrix({
              matrix: [
                0.8, 0, 0.1, 0, 0,
                0, 0.9, 0.1, 0, 0,
                0.1, 0.1, 1.2, 0, 0,
                0, 0, 0, 1, 0
              ]
            }));
          }
          break;
          
        case 'hdr':
          if (fabric.Image?.filters?.Gamma) {
            newFilters.push(new fabric.Image.filters.Gamma({ 
              gamma: [1, 0.8, 0.8] 
            }));
          }
          if (fabric.Image?.filters?.Contrast) {
            newFilters = newFilters.filter(f => !(fabric.Image?.filters?.Contrast && f instanceof fabric.Image.filters.Contrast));
            newFilters.push(new fabric.Image.filters.Contrast({ contrast: 0.25 }));
          }
          if (fabric.Image?.filters?.Brightness) {
            newFilters = newFilters.filter(f => !(fabric.Image?.filters?.Brightness && f instanceof fabric.Image.filters.Brightness));
            newFilters.push(new fabric.Image.filters.Brightness({ brightness: 0.1 }));
          }
          break;
      }

      mainImage.filters = newFilters;
      mainImage.applyFilters();
      canvas.renderAll();
      setSelectedFilter(filterType);
      
      if (filterType !== 'none') {
        setEditedImages(prev => new Set(prev).add(selectedImageIndex));
      }
    } catch (error) {
      console.error('Error applying filter:', error);
      if (filterType === 'blackwhite') {
        mainImage.filters = [new fabric.Image.filters.Grayscale()];
        mainImage.applyFilters();
        canvas.renderAll();
        setSelectedFilter(filterType);
      }
    }
  };

  // Crop functions
  const enableCropping = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !fabric || !isImageLoaded) return;

    setIsCropping(true);
    const mainImage = canvas.getObjects().find((obj: any) => obj.id === 'mainImage');
    
    if (mainImage) {
      const imageBounds = mainImage.getBoundingRect();
      
      const cropRect = new fabric.Rect({
        left: imageBounds.left + imageBounds.width / 4,
        top: imageBounds.top + imageBounds.height / 4,
        width: imageBounds.width / 2,
        height: imageBounds.height / 2,
        fill: 'transparent',
        stroke: '#ff0000',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        selectable: true,
        id: 'cropRect'
      });

      canvas.add(cropRect);
      canvas.setActiveObject(cropRect);
      canvas.renderAll();
    }
  };

  const applyCrop = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !isImageLoaded) return;

    const cropRect = canvas.getObjects().find((obj: any) => obj.id === 'cropRect');
    const mainImage = canvas.getObjects().find((obj: any) => obj.id === 'mainImage');

    if (cropRect && mainImage) {
      const cropBounds = cropRect.getBoundingRect();
      
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        tempCanvas.width = cropBounds.width;
        tempCanvas.height = cropBounds.height;
        
        cropRect.visible = false;
        canvas.renderAll();
        
        const cleanCanvas = canvas.toCanvasElement();
        
        tempCtx.drawImage(
          cleanCanvas,
          cropBounds.left,
          cropBounds.top,
          cropBounds.width,
          cropBounds.height,
          0,
          0,
          cropBounds.width,
          cropBounds.height
        );
        
        const croppedDataURL = tempCanvas.toDataURL('image/png');
        
        fabric.Image.fromURL(croppedDataURL, (newImg: any) => {
          canvas.clear();
          
          const canvasWidth = canvas.getWidth();
          const canvasHeight = canvas.getHeight();
          const newScale = Math.min(canvasWidth / newImg.width!, canvasHeight / newImg.height!) * 0.8;
          
          newImg.scale(newScale);
          newImg.set({
            left: canvasWidth / 2,
            top: canvasHeight / 2,
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
            id: 'mainImage'
          });
          
          canvas.add(newImg);
          canvas.renderAll();
          
          originalImageRef.current = newImg;
          setIsCropping(false);
          
          setEditedImages(prev => new Set(prev).add(selectedImageIndex));
        });
      }
    }
  };

  const cancelCrop = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const cropRect = canvas.getObjects().find((obj: any) => obj.id === 'cropRect');
    if (cropRect) {
      canvas.remove(cropRect);
      canvas.renderAll();
    }
    setIsCropping(false);
  };

  const rotateImage = (direction: 'left' | 'right') => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !isImageLoaded) return;

    const mainImage = canvas.getObjects().find((obj: any) => obj.id === 'mainImage');
    if (mainImage) {
      const currentAngle = mainImage.angle || 0;
      const newAngle = direction === 'right' ? currentAngle + 90 : currentAngle - 90;
      
      mainImage.set('angle', newAngle);
      canvas.renderAll();
      
      setEditedImages(prev => new Set(prev).add(selectedImageIndex));
    }
  };

  // Adjustment functions with increment/decrement
  const adjustBrightness = (increment: boolean) => {
    const newValue = increment ? Math.min(brightness + 5, 100) : Math.max(brightness - 5, -100);
    setBrightness(newValue);
    applyImageFilter('brightness', newValue / 100);
    if (newValue !== 0) {
      setEditedImages(prev => new Set(prev).add(selectedImageIndex));
    }
  };

  const adjustContrast = (increment: boolean) => {
    const newValue = increment ? Math.min(contrast + 5, 100) : Math.max(contrast - 5, -100);
    setContrast(newValue);
    applyImageFilter('contrast', newValue / 100);
    if (newValue !== 0) {
      setEditedImages(prev => new Set(prev).add(selectedImageIndex));
    }
  };

  const adjustSaturation = (increment: boolean) => {
    const newValue = increment ? Math.min(saturation + 5, 100) : Math.max(saturation - 5, -100);
    setSaturation(newValue);
    applyImageFilter('saturation', newValue / 100);
    if (newValue !== 0) {
      setEditedImages(prev => new Set(prev).add(selectedImageIndex));
    }
  };

  const applyBrightness = (value: number) => {
    setBrightness(value);
    applyImageFilter('brightness', value / 100);
    if (value !== 0) {
      setEditedImages(prev => new Set(prev).add(selectedImageIndex));
    }
  };

  const applyContrast = (value: number) => {
    setContrast(value);
    applyImageFilter('contrast', value / 100);
    if (value !== 0) {
      setEditedImages(prev => new Set(prev).add(selectedImageIndex));
    }
  };

  const applySaturation = (value: number) => {
    setSaturation(value);
    applyImageFilter('saturation', value / 100);
    if (value !== 0) {
      setEditedImages(prev => new Set(prev).add(selectedImageIndex));
    }
  };

  const applyImageFilter = (filterType: string, value: number) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !fabric || !isImageLoaded) return;

    const mainImage = canvas.getObjects().find((obj: any) => obj.id === 'mainImage');
    if (!mainImage) return;

    const existingFilters = mainImage.filters || [];
    const otherFilters = existingFilters.filter((filter: any) => {
      return !(
        (filterType === 'brightness' && fabric.Image?.filters?.Brightness && filter instanceof fabric.Image.filters.Brightness) ||
        (filterType === 'contrast' && fabric.Image?.filters?.Contrast && filter instanceof fabric.Image.filters.Contrast) ||
        (filterType === 'saturation' && fabric.Image?.filters?.Saturation && filter instanceof fabric.Image.filters.Saturation)
      );
    });

    let newFilter;
    switch (filterType) {
      case 'brightness':
        if (fabric.Image?.filters?.Brightness && value !== 0) {
          newFilter = new fabric.Image.filters.Brightness({ brightness: value });
        }
        break;
      case 'contrast':
        if (fabric.Image?.filters?.Contrast && value !== 0) {
          newFilter = new fabric.Image.filters.Contrast({ contrast: value });
        }
        break;
      case 'saturation':
        if (fabric.Image?.filters?.Saturation && value !== 0) {
          newFilter = new fabric.Image.filters.Saturation({ saturation: value });
        }
        break;
    }

    mainImage.filters = newFilter ? [...otherFilters, newFilter] : otherFilters;
    mainImage.applyFilters();
    canvas.renderAll();
    
    // If we have a selected filter, reapply it to maintain the artistic effect
    if (selectedFilter && selectedFilter !== 'none') {
      setTimeout(() => applyFilter(selectedFilter), 50);
    }
  };

  // Frame functions (improved centering)
  const applyFrame = (frameType: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !fabric || !isImageLoaded) return;

    // Remove existing frame
    const existingFrame = canvas.getObjects().find((obj: any) => obj.id === 'frame');
    if (existingFrame) {
      canvas.remove(existingFrame);
    }

    if (frameType === 'none') {
      setSelectedFrame('none');
      canvas.renderAll();
      return;
    }

    const mainImage = canvas.getObjects().find((obj: any) => obj.id === 'mainImage');
    if (!mainImage) return;

    // Get the exact bounds of the main image
    const imageBounds = mainImage.getBoundingRect(true);
    const frameWidth = 20;
    
    let frameRect;
    
    switch (frameType) {
      case 'classic':
        frameRect = new fabric.Rect({
          left: imageBounds.left - frameWidth,
          top: imageBounds.top - frameWidth,
          width: imageBounds.width + (frameWidth * 2),
          height: imageBounds.height + (frameWidth * 2),
          fill: '#8B4513',
          stroke: '#654321',
          strokeWidth: 2,
          selectable: false,
          evented: false,
          id: 'frame'
        });
        break;
      case 'modern':
        frameRect = new fabric.Rect({
          left: imageBounds.left - frameWidth,
          top: imageBounds.top - frameWidth,
          width: imageBounds.width + (frameWidth * 2),
          height: imageBounds.height + (frameWidth * 2),
          fill: '#2c3e50',
          stroke: '#34495e',
          strokeWidth: 1,
          selectable: false,
          evented: false,
          id: 'frame'
        });
        break;
      case 'vintage':
        frameRect = new fabric.Rect({
          left: imageBounds.left - frameWidth,
          top: imageBounds.top - frameWidth,
          width: imageBounds.width + (frameWidth * 2),
          height: imageBounds.height + (frameWidth * 2),
          fill: '#d4af37',
          stroke: '#b8860b',
          strokeWidth: 3,
          selectable: false,
          evented: false,
          id: 'frame'
        });
        break;
      case 'polaroid':
        frameRect = new fabric.Rect({
          left: imageBounds.left - frameWidth,
          top: imageBounds.top - frameWidth,
          width: imageBounds.width + (frameWidth * 2),
          height: imageBounds.height + (frameWidth * 3), // Extra space at bottom
          fill: '#ffffff',
          stroke: '#cccccc',
          strokeWidth: 1,
          selectable: false,
          evented: false,
          id: 'frame'
        });
        break;
      case 'ornate':
        frameRect = new fabric.Rect({
          left: imageBounds.left - frameWidth,
          top: imageBounds.top - frameWidth,
          width: imageBounds.width + (frameWidth * 2),
          height: imageBounds.height + (frameWidth * 2),
          fill: '#ffd700',
          stroke: '#ff8c00',
          strokeWidth: 4,
          selectable: false,
          evented: false,
          id: 'frame'
        });
        break;
    }

    if (frameRect) {
      canvas.add(frameRect);
      canvas.sendToBack(frameRect);
      canvas.bringForward(mainImage);
      canvas.renderAll();
      setSelectedFrame(frameType);
      setEditedImages(prev => new Set(prev).add(selectedImageIndex));
    }
  };

  // Border functions (improved centering)
  const applyBorder = (borderType: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !fabric || !isImageLoaded) return;

    const mainImage = canvas.getObjects().find((obj: any) => obj.id === 'mainImage');
    if (!mainImage) return;

    // Remove existing border
    const existingBorder = canvas.getObjects().find((obj: any) => obj.id === 'border');
    if (existingBorder) {
      canvas.remove(existingBorder);
    }

    if (borderType === 'none') {
      setSelectedBorder('none');
      canvas.renderAll();
      return;
    }

    // Get the exact bounds of the main image
    const imageBounds = mainImage.getBoundingRect(true);
    
    let borderRect;
    let strokeDashArray: number[] | undefined;

    switch (borderType) {
      case 'solid':
        strokeDashArray = undefined;
        break;
      case 'dashed':
        strokeDashArray = [10, 5];
        break;
      case 'dotted':
        strokeDashArray = [2, 3];
        break;
      case 'double':
        strokeDashArray = undefined;
        break;
      case 'rounded':
        strokeDashArray = undefined;
        break;
    }

    borderRect = new fabric.Rect({
      left: imageBounds.left,
      top: imageBounds.top,
      width: imageBounds.width,
      height: imageBounds.height,
      fill: 'transparent',
      stroke: borderColor,
      strokeWidth: borderWidth,
      strokeDashArray: strokeDashArray,
      rx: borderType === 'rounded' ? 10 : 0,
      ry: borderType === 'rounded' ? 10 : 0,
      selectable: false,
      evented: false,
      id: 'border'
    });

    if (borderType === 'double') {
      // Create inner border for double effect
      const innerBorder = new fabric.Rect({
        left: imageBounds.left + borderWidth,
        top: imageBounds.top + borderWidth,
        width: imageBounds.width - (borderWidth * 2),
        height: imageBounds.height - (borderWidth * 2),
        fill: 'transparent',
        stroke: borderColor,
        strokeWidth: Math.max(1, borderWidth / 3),
        selectable: false,
        evented: false,
        id: 'innerBorder'
      });
      canvas.add(innerBorder);
    }

    canvas.add(borderRect);
    canvas.renderAll();
    setSelectedBorder(borderType);
    setEditedImages(prev => new Set(prev).add(selectedImageIndex));
  };

  // Watermark functions
  const addTextWatermark = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !fabric || watermarkText.trim() === "" || !isImageLoaded) return;

    // Remove existing text watermark if any
    const existingTextWatermark = canvas.getObjects().find((obj: any) => obj.id === 'textWatermark');
    if (existingTextWatermark) {
      canvas.remove(existingTextWatermark);
    }

    const textWatermark = new fabric.Text(watermarkText, {
      left: canvas.getWidth() / 2,
      top: canvas.getHeight() / 2,
      fontFamily: 'Arial',
      fontSize: watermarkSize,
      fill: watermarkColor,
      opacity: watermarkOpacity,
      selectable: true,
      evented: true,
      id: 'textWatermark'
    });

    canvas.add(textWatermark);
    canvas.setActiveObject(textWatermark);
    canvas.renderAll();
    
    setEditedImages(prev => new Set(prev).add(selectedImageIndex));
  };

  const addImageWatermark = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabric || !isImageLoaded) return;

    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgSrc = event.target?.result as string;
      
      fabric.Image.fromURL(imgSrc, (img: any) => {
        // Set fixed initial size (small)
        const fixedSize = 100;
        const scale = fixedSize / Math.max(img.width!, img.height!);
        
        img.scale(scale);
        img.set({
          left: canvas.getWidth() / 2,
          top: canvas.getHeight() / 2,
          opacity: watermarkImageOpacity,
          selectable: true,
          evented: true,
          id: 'imageWatermark'
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        
        setEditedImages(prev => new Set(prev).add(selectedImageIndex));
      });
    };
    reader.readAsDataURL(file);
    
    // Reset input
    e.target.value = '';
  };

  // Reset function
  const resetImage = () => {
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setSelectedFrame('none');
    setSelectedBorder('none');
    setSelectedFilter('none');
    setIsCropping(false);
    
    if (currentImages[selectedImageIndex]) {
      loadImageToCanvas(currentImages[selectedImageIndex]);
    }
    
    setEditedImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(selectedImageIndex);
      return newSet;
    });
  };

  const confirmDeleteImage = () => {
    if (imageToDelete !== null && onDeleteImage) {
      onDeleteImage(session.id, imageToDelete);
      setShowDeleteDialog(false);
      setImageToDelete(null);
    }
  };

  const handleDeleteImageClick = (index: number) => {
    setImageToDelete(index);
    setShowDeleteDialog(true);
  };

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    const timeout = setTimeout(() => {
      // Optional: Implement auto-save logic here
    }, 5000); // 5 seconds

    setAutoSaveTimeout(timeout);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [brightness, contrast, saturation, selectedFilter, selectedFrame, selectedBorder]);

  if (!fabricLoaded) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading Photo Editor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-[95vw] h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-bold">Photo Editor - {session.customerDetails.name}</h2>
          <div className="flex items-center gap-2">
            <Button 
              onClick={saveAllImages}
              className="bg-green-600 hover:bg-green-700"
              disabled={!isImageLoaded}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Now
            </Button>
            <Button onClick={onClose} variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Toolbar */}
          <div className="w-80 border-r border-border p-4 overflow-y-auto bg-gray-50 dark:bg-slate-700">
            <div className="space-y-4">
              {/* Tool Categories */}
              {toolCategories.map((category) => (
                <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <Button
                    variant="ghost"
                    className={`w-full justify-between p-4 h-auto ${
                      activeTool === category.id ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => toggleTool(category.id)}
                  >
                    <div className="flex items-center gap-3">
                      <category.icon className="h-5 w-5" />
                      <span className="font-medium">{category.label}</span>
                    </div>
                    {activeTool === category.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                  
                  {/* Tool Content */}
                  {activeTool === category.id && (
                    <div className="p-4 bg-white dark:bg-slate-800 border-t">
                      {/* Crop Tools */}
                      {category.id === 'crop' && (
                        <div className="space-y-3">
                          {!isCropping ? (
                            <Button 
                              onClick={enableCropping} 
                              className="w-full" 
                              variant="outline"
                              disabled={!isImageLoaded}
                            >
                              <Crop className="h-4 w-4 mr-2" />
                              Crop Image
                            </Button>
                          ) : (
                            <div className="space-y-2">
                              <Button onClick={applyCrop} className="w-full bg-green-600 hover:bg-green-700">
                                Apply Crop
                              </Button>
                              <Button onClick={cancelCrop} className="w-full" variant="outline">
                                Cancel
                              </Button>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => rotateImage('left')} 
                              variant="outline" 
                              className="flex-1"
                              disabled={!isImageLoaded}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Left
                            </Button>
                            <Button 
                              onClick={() => rotateImage('right')} 
                              variant="outline" 
                              className="flex-1"
                              disabled={!isImageLoaded}
                            >
                              <RotateCw className="h-4 w-4 mr-2" />
                              Right
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Adjustment Tools */}
                      {category.id === 'adjustment' && (
                        <div className="space-y-4">
                          {/* Brightness */}
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              <Sun className="h-4 w-4 inline mr-2" />
                              Brightness: {brightness}%
                            </label>
                            <Input
                              type="range"
                              min="-100"
                              max="100"
                              value={brightness}
                              onChange={(e) => applyBrightness(Number(e.target.value))}
                              className="w-full"
                              disabled={!isImageLoaded}
                            />
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => adjustBrightness(false)}
                                disabled={!isImageLoaded || brightness <= -100}
                                className="flex-1"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => adjustBrightness(true)}
                                disabled={!isImageLoaded || brightness >= 100}
                                className="flex-1"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Contrast */}
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              <Circle className="h-4 w-4 inline mr-2" />
                              Contrast: {contrast}%
                            </label>
                            <Input
                              type="range"
                              min="-100"
                              max="100"
                              value={contrast}
                              onChange={(e) => applyContrast(Number(e.target.value))}
                              className="w-full"
                              disabled={!isImageLoaded}
                            />
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => adjustContrast(false)}
                                disabled={!isImageLoaded || contrast <= -100}
                                className="flex-1"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => adjustContrast(true)}
                                disabled={!isImageLoaded || contrast >= 100}
                                className="flex-1"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Saturation */}
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              <Palette className="h-4 w-4 inline mr-2" />
                              Saturation: {saturation}%
                            </label>
                            <Input
                              type="range"
                              min="-100"
                              max="100"
                              value={saturation}
                              onChange={(e) => applySaturation(Number(e.target.value))}
                              className="w-full"
                              disabled={!isImageLoaded}
                            />
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => adjustSaturation(false)}
                                disabled={!isImageLoaded || saturation <= -100}
                                className="flex-1"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => adjustSaturation(true)}
                                disabled={!isImageLoaded || saturation >= 100}
                                className="flex-1"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Filter Tools */}
                      {category.id === 'filter' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            {filterOptions.map((filter) => {
                              const IconComponent = filter.icon;
                              return (
                                <Button
                                  key={filter.value}
                                  variant={selectedFilter === filter.value ? "default" : "outline"}
                                  className="h-16 flex flex-col items-center justify-center p-2 text-xs"
                                  onClick={() => applyFilter(filter.value)}
                                  disabled={!isImageLoaded}
                                  style={{
                                    borderColor: selectedFilter === filter.value ? filter.color : undefined
                                  }}
                                >
                                  <IconComponent className="text-lg mb-1" style={{ color: filter.color }} />
                                  <span className="text-[10px] leading-tight text-center">{filter.label}</span>
                                </Button>
                              );
                            })}
                          </div>
                          
                          {selectedFilter !== 'none' && (
                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <p className="text-xs text-blue-700 dark:text-blue-300">
                                <Filter className="h-3 w-3 inline mr-1" />
                                Filter "{filterOptions.find(f => f.value === selectedFilter)?.label}" applied
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Frame Tools */}
                      {category.id === 'frame' && (
                        <div className="grid grid-cols-3 gap-2">
                          {frameOptions.map((frame) => {
                            const IconComponent = frame.icon;
                            return (
                              <Button
                                key={frame.value}
                                variant={selectedFrame === frame.value ? "default" : "outline"}
                                className="h-16 flex flex-col items-center justify-center p-2"
                                onClick={() => applyFrame(frame.value)}
                                disabled={!isImageLoaded}
                              >
                                <IconComponent className="text-2xl mb-1" />
                                <span className="text-xs">{frame.label}</span>
                              </Button>
                            );
                          })}
                        </div>
                      )}

                      {/* Border Tools */}
                      {category.id === 'border' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-2">
                            {borderOptions.map((border) => {
                              const IconComponent = border.icon;
                              return (
                                <Button
                                  key={border.value}
                                  variant={selectedBorder === border.value ? "default" : "outline"}
                                  className="h-16 flex flex-col items-center justify-center p-2"
                                  onClick={() => applyBorder(border.value)}
                                  disabled={!isImageLoaded}
                                >
                                  <IconComponent className="text-2xl mb-1" />
                                  <span className="text-xs">{border.label}</span>
                                </Button>
                              );
                            })}
                          </div>
                          
                          {selectedBorder !== 'none' && (
                            <div className="space-y-3 pt-3 border-t">
                              <div>
                                <label className="text-sm font-medium">Border Width: {borderWidth}px</label>
                                <Input
                                  type="range"
                                  min="1"
                                  max="50"
                                  value={borderWidth}
                                  onChange={(e) => {
                                    setBorderWidth(Number(e.target.value));
                                    if (selectedBorder !== 'none') {
                                      applyBorder(selectedBorder);
                                    }
                                  }}
                                  className="w-full"
                                  disabled={!isImageLoaded}
                                />
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium">Border Color</label>
                                <Input
                                  type="color"
                                  value={borderColor}
                                  onChange={(e) => {
                                    setBorderColor(e.target.value);
                                    if (selectedBorder !== 'none') {
                                      applyBorder(selectedBorder);
                                    }
                                  }}
                                  className="w-full h-10"
                                  disabled={!isImageLoaded}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Watermark Tools */}
                      {category.id === 'watermark' && (
                        <div className="space-y-4">
                          {/* Text Watermark */}
                          <div className="space-y-3">
                            <h4 className="font-medium flex items-center">
                              <Type className="h-4 w-4 mr-2" />
                              Text Watermark
                            </h4>
                            <Input
                              placeholder="Enter watermark text"
                              value={watermarkText}
                              onChange={(e) => setWatermarkText(e.target.value)}
                              disabled={!isImageLoaded}
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs">Size: {watermarkSize}px</label>
                                <Input
                                  type="range"
                                  min="12"
                                  max="72"
                                  value={watermarkSize}
                                  onChange={(e) => setWatermarkSize(Number(e.target.value))}
                                  disabled={!isImageLoaded}
                                />
                              </div>
                              <div>
                                <label className="text-xs">Opacity: {Math.round(watermarkOpacity * 100)}%</label>
                                <Input
                                  type="range"
                                  min="0.1"
                                  max="1"
                                  step="0.1"
                                  value={watermarkOpacity}
                                  onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                                  disabled={!isImageLoaded}
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs">Color</label>
                              <Input
                                type="color"
                                value={watermarkColor}
                                onChange={(e) => setWatermarkColor(e.target.value)}
                                className="w-full h-8"
                                disabled={!isImageLoaded}
                              />
                            </div>
                            <Button
                              onClick={addTextWatermark}
                              className="w-full"
                              disabled={!isImageLoaded || !watermarkText.trim()}
                            >
                              Add Text Watermark
                            </Button>
                          </div>

                          {/* Image Watermark */}
                          <div className="space-y-3 pt-3 border-t">
                            <h4 className="font-medium flex items-center">
                              <ImageIcon className="h-4 w-4 mr-2" />
                              Image Watermark
                            </h4>
                            <div>
                              <label className="text-xs">Opacity: {Math.round(watermarkImageOpacity * 100)}%</label>
                              <Input
                                type="range"
                                min="0.1"
                                max="1"
                                step="0.1"
                                value={watermarkImageOpacity}
                                onChange={(e) => setWatermarkImageOpacity(Number(e.target.value))}
                                disabled={!isImageLoaded}
                                className="w-full mt-1"
                              />
                            </div>
                            <Button
                              onClick={() => watermarkInputRef.current?.click()}
                              variant="outline"
                              className="w-full"
                              disabled={!isImageLoaded}
                            >
                              Choose Image
                            </Button>
                            <input
                              ref={watermarkInputRef}
                              type="file"
                              accept="image/*"
                              onChange={addImageWatermark}
                              className="hidden"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-100 dark:bg-slate-600 p-4">
            <div className="bg-white rounded-lg shadow-lg relative">
              <canvas ref={canvasRef} className="border border-gray-300 rounded-lg" />
              {!isImageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Loading image...</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Save Changes and Reset Buttons below canvas */}
            <div className="mt-4 flex gap-3">
              <Button 
                onClick={saveCurrentImage}
                className="bg-green-600 hover:bg-green-700 px-8 py-2"
                disabled={!isImageLoaded}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button 
                onClick={resetImage} 
                variant="outline"
                className="border-blue-500 text-blue-600 hover:bg-blue-50 px-8 py-2"
                disabled={!isImageLoaded}
              >
                Reset Image
              </Button>
            </div>
          </div>

          {/* Right Image Grid */}
          <div className="w-80 border-l border-border p-4 bg-gray-50 dark:bg-slate-700 overflow-y-auto">
            <h3 className="font-semibold mb-4">Photos ({currentImages.length})</h3>
            <div className="grid grid-cols-2 gap-3">
              {currentImages.map((image, index) => (
                <div
                  key={index}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-[1.02] ${
                    selectedImageIndex === index
                      ? "border-blue-500 shadow-lg ring-2 ring-blue-200"
                      : "border-gray-300 hover:border-blue-400 hover:shadow-md"
                  }`}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <div className="w-full h-32 aspect-[4/3] bg-gray-100 flex items-center justify-center rounded-lg overflow-hidden">
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  
                  {/* Edited Badge */}
                  {editedImages.has(index) && (
                    <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Edited
                    </div>
                  )}
                  
                  {selectedImageIndex === index && (
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                      <span className="text-white font-semibold">Editing</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save Success Dialog */}
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Image Saved Successfully!</AlertDialogTitle>
            <AlertDialogDescription>
              The current image has been saved. You can continue editing other images or close the editor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSaveDialog(false)}>
              Continue Editing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image Permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The image will be permanently deleted from the session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteImage}>
              Delete Permanently
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}