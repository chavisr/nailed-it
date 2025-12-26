import React, { useState, useRef, useEffect } from 'react';
import { FlipHorizontal, FlipVertical, RotateCw, ArrowRightLeft, Crop, Settings, RotateCcw, ImagePlus } from 'lucide-react';
import { DEFAULT_CANVAS, IMAGE_FILTERS } from './constants';
import { loadGoogleFonts } from './utils/fonts';
import LayersPanel from './components/LayersPanel';
import Toolbar from './components/Toolbar';
import PropertiesPanel from './components/PropertiesPanel';
import CanvasSettingsPanel from './components/CanvasSettingsPanel';

export default function App() {
  const [canvasSettings, setCanvasSettings] = useState(DEFAULT_CANVAS);
  const [layers, setLayers] = useState([]);
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [selectedLayers, setSelectedLayers] = useState([]); // For multi-selection
  const [draggedLayer, setDraggedLayer] = useState(null);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizing, setResizing] = useState(null);
  const [guides, setGuides] = useState({ x: [], y: [] });
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [cropMode, setCropMode] = useState(null);
  const [cropBox, setCropBox] = useState(null);
  const [cropDragging, setCropDragging] = useState(false);
  const [cropResizing, setCropResizing] = useState(null);
  const [manualGuides, _SetManualGuides] = useState({ vertical: [], horizontal: [] });
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  // Load Google Fonts on mount
  useEffect(() => {
    loadGoogleFonts();
    
    // Load saved state from localStorage
    try {
      const savedLayers = localStorage.getItem('thumbnailEditorLayers');
      const savedCanvas = localStorage.getItem('thumbnailEditorCanvas');
      
      if (savedLayers) {
        const parsedLayers = JSON.parse(savedLayers);
        // Restore image objects
        const restoredLayers = parsedLayers.map(layer => {
          if (layer.type === 'image' && layer.imageData) {
            const img = new Image();
            img.src = layer.imageData;
            return { ...layer, image: img };
          }
          return layer;
        });
        setLayers(restoredLayers);
      }
      
      if (savedCanvas) {
        const parsedCanvas = JSON.parse(savedCanvas);
        // Restore background image if exists
        if (parsedCanvas.bgImageData) {
          const img = new Image();
          img.src = parsedCanvas.bgImageData;
          img.onload = () => {
            setCanvasSettings({ ...parsedCanvas, bgImage: img });
          };
        } else {
          setCanvasSettings(parsedCanvas);
        }
      }
    } catch (error) {
      console.error('Failed to load saved state:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    renderCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers, canvasSettings, selectedLayer, selectedLayers, guides, cropMode, cropBox]);

  // Save to localStorage whenever layers or canvas settings change
  useEffect(() => {
    try {
      // Convert layers to serializable format
      const serializableLayers = layers.map(layer => {
        if (layer.type === 'image' && layer.image) {
          // Convert image to data URL for storage
          const canvas = document.createElement('canvas');
          canvas.width = layer.image.width;
          canvas.height = layer.image.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(layer.image, 0, 0);
          const imageData = canvas.toDataURL();
          return { ...layer, image: null, imageData };
        }
        return layer;
      });
      
      localStorage.setItem('thumbnailEditorLayers', JSON.stringify(serializableLayers));
      
      // Save canvas settings
      const serializableCanvas = { ...canvasSettings };
      if (canvasSettings.bgImage) {
        const canvas = document.createElement('canvas');
        canvas.width = canvasSettings.bgImage.width;
        canvas.height = canvasSettings.bgImage.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(canvasSettings.bgImage, 0, 0);
        serializableCanvas.bgImageData = canvas.toDataURL();
        serializableCanvas.bgImage = null;
      }
      
      localStorage.setItem('thumbnailEditorCanvas', JSON.stringify(serializableCanvas));
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }, [layers, canvasSettings]);

  // Auto-detect clipboard content on paste
  useEffect(() => {
    const handlePaste = async (e) => {
      // Check if user is typing in an input or textarea
      const isTyping = e.target.tagName === 'INPUT' || 
                       e.target.tagName === 'TEXTAREA' || 
                       e.target.isContentEditable;
      
      if (isTyping || cropMode || deleteConfirmation) return;
      
      e.preventDefault();
      
      try {
        const clipboardItems = await navigator.clipboard.read();
        
        for (const clipboardItem of clipboardItems) {
          // Check for image
          for (const type of clipboardItem.types) {
            if (type.startsWith('image/')) {
              const blob = await clipboardItem.getType(type);
              const reader = new FileReader();
              
              reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                  const maxSize = 500;
                  const aspectRatio = img.width / img.height;
                  let displayWidth = img.width;
                  let displayHeight = img.height;

                  if (img.width > maxSize || img.height > maxSize) {
                    if (aspectRatio > 1) {
                      displayWidth = maxSize;
                      displayHeight = maxSize / aspectRatio;
                    } else {
                      displayHeight = maxSize;
                      displayWidth = maxSize * aspectRatio;
                    }
                  }

                  const newLayer = {
                    id: Date.now(),
                    type: 'image',
                    x: 100,
                    y: 100,
                    width: displayWidth,
                    height: displayHeight,
                    aspectRatio: aspectRatio,
                    originalWidth: img.width,
                    originalHeight: img.height,
                    image: img,
                    visible: true,
                    opacity: 1,
                    blur: 0,
                    rotateX: 0,
                    rotateY: 0,
                    rotateZ: 0,
                    flipH: false,
                    flipV: false,
                    border: { width: 0, color: '#ffffff' },
                    shadow: { offsetX: 0, offsetY: 0, blur: 0, color: '#000000' },
                    brightness: 100,
                    contrast: 100,
                    saturation: 100,
                    hue: 0,
                    filter: 'none'
                  };
                  setLayers(prev => [...prev, newLayer]);
                  setSelectedLayer(newLayer.id);
                };
                img.src = event.target.result;
              };
              reader.readAsDataURL(blob);
              return;
            }
          }
          
          // Check for text
          if (clipboardItem.types.includes('text/plain')) {
            const blob = await clipboardItem.getType('text/plain');
            const text = await blob.text();
            
            const newLayer = {
              id: Date.now(),
              type: 'text',
              text: text,
              x: 100,
              y: 100,
              width: 200,
              height: 50,
              fontSize: 48,
              fontFamily: "Impact, 'Arial Black', sans-serif",
              color: '#ffffff',
              bold: false,
              italic: false,
              underline: false,
              strokeWidth: 0,
              strokeColor: '#000000',
              textEffect: 'none',
              gradientStart: '#ffffff',
              gradientEnd: '#ff0000',
              gradientAngle: 0,
              visible: true,
              opacity: 1,
              blur: 0,
              rotateX: 0,
              rotateY: 0,
              rotateZ: 0,
              border: { width: 0, color: '#000000' },
              shadow: { offsetX: 0, offsetY: 0, blur: 0, color: '#000000' }
            };
            setLayers(prev => [...prev, newLayer]);
            setSelectedLayer(newLayer.id);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to read clipboard:', err);
      }
    };
    
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [layers, cropMode, deleteConfirmation]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if user is typing in an input or textarea
      const isTyping = e.target.tagName === 'INPUT' || 
                       e.target.tagName === 'TEXTAREA' || 
                       e.target.isContentEditable;
      
      if (e.key === 'Delete' && !cropMode && !isTyping && !deleteConfirmation) {
        if (selectedLayers.length > 0) {
          // Show delete confirmation for multiple layers
          setDeleteConfirmation({ type: 'multiple', ids: selectedLayers });
        } else if (selectedLayer) {
          // Show delete confirmation for single layer
          setDeleteConfirmation({ type: 'single', ids: [selectedLayer] });
        }
      }
      
      // Ctrl+D to duplicate selected layer
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedLayer && !cropMode && !deleteConfirmation && !isTyping && selectedLayers.length === 0) {
        e.preventDefault();
        const layerToDuplicate = layers.find(l => l.id === selectedLayer);
        if (layerToDuplicate) {
          const newLayer = {
            ...layerToDuplicate,
            id: Date.now(),
            x: layerToDuplicate.x + 20,
            y: layerToDuplicate.y + 20
          };
          setLayers([...layers, newLayer]);
          setSelectedLayer(newLayer.id);
        }
      }
      
      // Only move layers with arrow keys if NOT typing in a text field
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && !cropMode && !deleteConfirmation && !isTyping) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 5;
        
        if (selectedLayers.length > 0) {
          // Move all selected layers
          const newLayers = layers.map(l => {
            if (selectedLayers.includes(l.id)) {
              let updates = {};
              if (e.key === 'ArrowUp') updates.y = l.y - step;
              if (e.key === 'ArrowDown') updates.y = l.y + step;
              if (e.key === 'ArrowLeft') updates.x = l.x - step;
              if (e.key === 'ArrowRight') updates.x = l.x + step;
              return { ...l, ...updates };
            }
            return l;
          });
          setLayers(newLayers);
        } else if (selectedLayer) {
          const layer = layers.find(l => l.id === selectedLayer);
          if (layer) {
            let updates = {};
            if (e.key === 'ArrowUp') updates.y = layer.y - step;
            if (e.key === 'ArrowDown') updates.y = layer.y + step;
            if (e.key === 'ArrowLeft') updates.x = layer.x - step;
            if (e.key === 'ArrowRight') updates.x = layer.x + step;
            updateLayer(selectedLayer, updates);
          }
        }
      }
      
      // Ctrl+A to select all layers
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !deleteConfirmation && !isTyping) {
        e.preventDefault();
        const allLayerIds = layers.map(l => l.id);
        setSelectedLayers(allLayerIds);
        setSelectedLayer(null); // Clear single selection when multi-selecting
      }
      
      // Escape key to cancel delete confirmation or deselect all
      if (e.key === 'Escape' && !isTyping) {
        if (deleteConfirmation) {
          cancelDelete();
        } else {
          setSelectedLayers([]);
          setSelectedLayer(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLayer, selectedLayers, layers, cropMode, deleteConfirmation]);

  const applyImageAdjustments = (ctx, layer) => {
    if (layer.type !== 'image') return;

    const filters = [];
    
    // Brightness
    if (layer.brightness !== 100) {
      filters.push(`brightness(${layer.brightness}%)`);
    }
    
    // Contrast
    if (layer.contrast !== 100) {
      filters.push(`contrast(${layer.contrast}%)`);
    }
    
    // Saturation
    if (layer.saturation !== 100) {
      filters.push(`saturate(${layer.saturation}%)`);
    }
    
    // Hue rotation
    if (layer.hue !== 0) {
      filters.push(`hue-rotate(${layer.hue}deg)`);
    }
    
    // Apply filter presets
    switch (layer.filter) {
      case 'grayscale':
        filters.push('grayscale(100%)');
        break;
      case 'sepia':
        filters.push('sepia(100%)');
        break;
      case 'invert':
        filters.push('invert(100%)');
        break;
      case 'vintage':
        filters.push('sepia(40%) contrast(110%) brightness(90%)');
        break;
    }
    
    // Blur
    if (layer.blur > 0) {
      filters.push(`blur(${layer.blur}px)`);
    }
    
    if (filters.length > 0) {
      ctx.filter = filters.join(' ');
    }
  };

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.globalAlpha = canvasSettings.bgOpacity;
    
    // Apply background image filters if there's a background image
    if (canvasSettings.bgImage) {
      const bgFilters = [];
      
      if (canvasSettings.bgBrightness !== 100) {
        bgFilters.push(`brightness(${canvasSettings.bgBrightness}%)`);
      }
      if (canvasSettings.bgContrast !== 100) {
        bgFilters.push(`contrast(${canvasSettings.bgContrast}%)`);
      }
      if (canvasSettings.bgSaturation !== 100) {
        bgFilters.push(`saturate(${canvasSettings.bgSaturation}%)`);
      }
      if (canvasSettings.bgHue !== 0) {
        bgFilters.push(`hue-rotate(${canvasSettings.bgHue}deg)`);
      }
      
      switch (canvasSettings.bgFilter) {
        case 'grayscale':
          bgFilters.push('grayscale(100%)');
          break;
        case 'sepia':
          bgFilters.push('sepia(100%)');
          break;
        case 'invert':
          bgFilters.push('invert(100%)');
          break;
        case 'vintage':
          bgFilters.push('sepia(40%) contrast(110%) brightness(90%)');
          break;
      }
      
      if (canvasSettings.bgBlur > 0) {
        bgFilters.push(`blur(${canvasSettings.bgBlur}px)`);
      }
      
      if (bgFilters.length > 0) {
        ctx.filter = bgFilters.join(' ');
      }
    } else if (canvasSettings.bgBlur > 0) {
      ctx.filter = `blur(${canvasSettings.bgBlur}px)`;
    }
    
    if (canvasSettings.bgImage) {
      ctx.drawImage(canvasSettings.bgImage, 0, 0, canvas.width, canvas.height);
    } else if (canvasSettings.bgType === 'gradient') {
      const angle = (canvasSettings.bgGradientAngle || 0) * Math.PI / 180;
      const x1 = canvas.width / 2 - Math.cos(angle) * canvas.width / 2;
      const y1 = canvas.height / 2 - Math.sin(angle) * canvas.height / 2;
      const x2 = canvas.width / 2 + Math.cos(angle) * canvas.width / 2;
      const y2 = canvas.height / 2 + Math.sin(angle) * canvas.height / 2;
      
      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      gradient.addColorStop(0, canvasSettings.bgGradientStart || canvasSettings.bgColor);
      gradient.addColorStop(1, canvasSettings.bgGradientEnd || '#ffffff');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = canvasSettings.bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    ctx.restore();

    // Draw grid if enabled
    if (canvasSettings.showGrid) {
      ctx.save();
      ctx.strokeStyle = canvasSettings.gridColor || '#7D7D7D';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3;
      
      const gridSize = canvasSettings.gridSize || 20;
      for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Draw manual guides
    if (manualGuides.vertical.length > 0 || manualGuides.horizontal.length > 0) {
      ctx.save();
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      
      manualGuides.vertical.forEach(x => {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      });
      
      manualGuides.horizontal.forEach(y => {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      });
      ctx.restore();
    }

    layers.filter(l => l.visible).forEach(layer => {
      ctx.save();
      ctx.globalAlpha = layer.opacity;

      if (layer.type === 'image' && layer.image) {
        // Apply image adjustments and filters
        applyImageAdjustments(ctx, layer);
        
        if (layer.shadow.blur > 0) {
          ctx.shadowColor = layer.shadow.color;
          ctx.shadowBlur = layer.shadow.blur;
          ctx.shadowOffsetX = layer.shadow.offsetX;
          ctx.shadowOffsetY = layer.shadow.offsetY;
        }

        ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
        
        // Apply 3D rotation (Z-axis is normal rotation)
        const rotX = (layer.rotateX || 0) * Math.PI / 180;
        const rotY = (layer.rotateY || 0) * Math.PI / 180;
        const rotZ = (layer.rotateZ || 0) * Math.PI / 180;
        
        // Apply Z rotation (normal rotation)
        ctx.rotate(rotZ);
        
        // Apply 3D effect for X and Y rotation
        const scaleX = Math.cos(rotY);
        const scaleY = Math.cos(rotX);
        const skewX = Math.sin(rotY) * 0.5;
        const skewY = Math.sin(rotX) * 0.5;
        
        ctx.transform(scaleX, skewY, skewX, scaleY, 0, 0);
        
        ctx.scale(layer.flipH ? -1 : 1, layer.flipV ? -1 : 1);
        
        // Draw border first if needed (using image alpha as mask)
        if (layer.border.width > 0) {
          // Create a temporary canvas for border effect
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = layer.width + layer.border.width * 4;
          tempCanvas.height = layer.height + layer.border.width * 4;
          const tempCtx = tempCanvas.getContext('2d');
          
          const offset = layer.border.width * 2;
          
          // Draw the image multiple times offset to create outline
          for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
            const xOff = Math.cos(angle) * layer.border.width;
            const yOff = Math.sin(angle) * layer.border.width;
            tempCtx.drawImage(layer.image, offset + xOff, offset + yOff, layer.width, layer.height);
          }
          
          // Set composite mode to only draw where there's image pixels
          tempCtx.globalCompositeOperation = 'source-in';
          tempCtx.fillStyle = layer.border.color;
          tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
          
          // Draw the border from temp canvas
          ctx.drawImage(tempCanvas, -layer.width / 2 - offset, -layer.height / 2 - offset);
        }
        
        ctx.drawImage(
          layer.image,
          -layer.width / 2, -layer.height / 2, layer.width, layer.height
        );
        
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      } else if (layer.type === 'text') {
        let fontStyle = '';
        if (layer.bold) fontStyle += 'bold ';
        if (layer.italic) fontStyle += 'italic ';
        ctx.font = `${fontStyle}${layer.fontSize}px ${layer.fontFamily}`;
        
        if (layer.blur > 0) {
          ctx.filter = `blur(${layer.blur}px)`;
        }

        if (layer.shadow.blur > 0) {
          ctx.shadowColor = layer.shadow.color;
          ctx.shadowBlur = layer.shadow.blur;
          ctx.shadowOffsetX = layer.shadow.offsetX;
          ctx.shadowOffsetY = layer.shadow.offsetY;
        }

        // Apply text effect (gradient or solid color)
        if (layer.textEffect === 'gradient') {
          const angle = (layer.gradientAngle || 0) * Math.PI / 180;
          const gradientLength = layer.fontSize * 2;
          const x1 = layer.x - Math.cos(angle) * gradientLength / 2;
          const y1 = layer.y - Math.sin(angle) * gradientLength / 2;
          const x2 = layer.x + Math.cos(angle) * gradientLength / 2;
          const y2 = layer.y + Math.sin(angle) * gradientLength / 2;
          
          const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
          gradient.addColorStop(0, layer.gradientStart || layer.color);
          gradient.addColorStop(1, layer.gradientEnd || '#ff0000');
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = layer.color;
        }
        
        const lines = layer.text.split('\n');
        const lineHeightMultiplier = layer.lineHeight || 1.2;
        const lineHeight = layer.fontSize * lineHeightMultiplier;
        
        let maxWidth = 0;
        lines.forEach(line => {
          const metrics = ctx.measureText(line);
          maxWidth = Math.max(maxWidth, metrics.width);
        });
        
        const textHeight = lines.length * lineHeight;
        
        if (layer.width !== maxWidth || layer.height !== textHeight) {
          setTimeout(() => {
            updateLayer(layer.id, { width: maxWidth, height: textHeight });
          }, 0);
        }
        
        // Apply 3D rotation (Z-axis is normal rotation)
        const txtRotX = (layer.rotateX || 0) * Math.PI / 180;
        const txtRotY = (layer.rotateY || 0) * Math.PI / 180;
        const txtRotZ = (layer.rotateZ || 0) * Math.PI / 180;
        
        ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
        
        // Apply Z rotation (normal rotation)
        ctx.rotate(txtRotZ);
        
        // Apply 3D effect for X and Y rotation
        if (txtRotX !== 0 || txtRotY !== 0) {
          const txtScaleX = Math.cos(txtRotY);
          const txtScaleY = Math.cos(txtRotX);
          const txtSkewX = Math.sin(txtRotY) * 0.5;
          const txtSkewY = Math.sin(txtRotX) * 0.5;
          
          ctx.transform(txtScaleX, txtSkewY, txtSkewX, txtScaleY, 0, 0);
        }
        
        ctx.translate(-(layer.x + layer.width / 2), -(layer.y + layer.height / 2));
        
        lines.forEach((line, index) => {
          const yPos = layer.y + layer.fontSize + (index * lineHeight);
          const xPos = layer.x;
          
          // Draw stroke/outline first (if enabled)
          if (layer.strokeWidth > 0) {
            ctx.strokeStyle = layer.strokeColor || '#000000';
            ctx.lineWidth = layer.strokeWidth;
            ctx.lineJoin = 'round';
            ctx.miterLimit = 2;
            ctx.strokeText(line, xPos, yPos);
          }
          
          // Draw fill text
          ctx.fillText(line, xPos, yPos);
          
          // Draw underline if enabled
          if (layer.underline) {
            const textWidth = ctx.measureText(line).width;
            const underlineY = yPos + layer.fontSize * 0.1; // Position underline slightly below text
            const underlineThickness = Math.max(1, layer.fontSize * 0.05); // Scale with font size
            
            ctx.save();
            ctx.strokeStyle = layer.textEffect === 'gradient' ? layer.color : ctx.fillStyle;
            ctx.lineWidth = underlineThickness;
            ctx.beginPath();
            ctx.moveTo(xPos, underlineY);
            ctx.lineTo(xPos + textWidth, underlineY);
            ctx.stroke();
            ctx.restore();
          }
        });
        
        // Reset transformation
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }

      ctx.restore();
    });

    const layer = layers.find(l => l.id === selectedLayer);
    if (layer && selectedLayers.length === 0) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(layer.x - 2, layer.y - 2, layer.width + 4, layer.height + 4);
      
      const handleSize = 16;
      const handles = [
        { x: layer.x - handleSize/2, y: layer.y - handleSize/2 },
        { x: layer.x + layer.width - handleSize/2, y: layer.y - handleSize/2 },
        { x: layer.x - handleSize/2, y: layer.y + layer.height - handleSize/2 },
        { x: layer.x + layer.width - handleSize/2, y: layer.y + layer.height - handleSize/2 }
      ];
      
      ctx.setLineDash([]);
      ctx.fillStyle = '#3b82f6';
      handles.forEach(h => {
        ctx.fillRect(h.x, h.y, handleSize, handleSize);
      });
    }
    
    // Draw selection boxes for multi-selected layers (green boxes, no handles)
    if (selectedLayers.length > 0) {
      selectedLayers.forEach(layerId => {
        const layer = layers.find(l => l.id === layerId);
        if (layer) {
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 3;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(layer.x - 2, layer.y - 2, layer.width + 4, layer.height + 4);
        }
      });
      ctx.setLineDash([]);
    }

    // Draw crop box if in crop mode
    if (cropMode && cropBox && layer && layer.id === cropMode) {
      // Draw semi-transparent overlay outside crop box
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      
      // Top
      ctx.fillRect(layer.x, layer.y, layer.width, cropBox.y - layer.y);
      // Bottom
      ctx.fillRect(layer.x, cropBox.y + cropBox.height, layer.width, (layer.y + layer.height) - (cropBox.y + cropBox.height));
      // Left
      ctx.fillRect(layer.x, cropBox.y, cropBox.x - layer.x, cropBox.height);
      // Right
      ctx.fillRect(cropBox.x + cropBox.width, cropBox.y, (layer.x + layer.width) - (cropBox.x + cropBox.width), cropBox.height);
      
      // Draw crop box border
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.strokeRect(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
      
      // Draw corner handles
      const cropHandleSize = 12;
      const cropHandles = [
        { x: cropBox.x - cropHandleSize/2, y: cropBox.y - cropHandleSize/2 },
        { x: cropBox.x + cropBox.width - cropHandleSize/2, y: cropBox.y - cropHandleSize/2 },
        { x: cropBox.x - cropHandleSize/2, y: cropBox.y + cropBox.height - cropHandleSize/2 },
        { x: cropBox.x + cropBox.width - cropHandleSize/2, y: cropBox.y + cropBox.height - cropHandleSize/2 }
      ];
      
      ctx.fillStyle = '#10b981';
      cropHandles.forEach(h => {
        ctx.fillRect(h.x, h.y, cropHandleSize, cropHandleSize);
      });
    }

    if (guides.x.length > 0 || guides.y.length > 0) {
      const canvasCenterX = canvasSettings.width / 2;
      const canvasCenterY = canvasSettings.height / 2;
      
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      
      guides.x.forEach(x => {
        ctx.strokeStyle = (x === canvasCenterX) ? '#ef4444' : '#eab308';
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      });
      
      guides.y.forEach(y => {
        ctx.strokeStyle = (y === canvasCenterY) ? '#ef4444' : '#eab308';
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      });
      
      ctx.setLineDash([]);
    }
  };

  const addImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        let displayWidth = img.width;
        let displayHeight = img.height;
        
        const maxSize = 400;
        if (displayWidth > maxSize || displayHeight > maxSize) {
          if (displayWidth > displayHeight) {
            displayWidth = maxSize;
            displayHeight = maxSize / aspectRatio;
          } else {
            displayHeight = maxSize;
            displayWidth = maxSize * aspectRatio;
          }
        }

        const newLayer = {
          id: Date.now(),
          type: 'image',
          x: 100,
          y: 100,
          width: displayWidth,
          height: displayHeight,
          aspectRatio: aspectRatio,
          originalWidth: img.width,
          originalHeight: img.height,
          image: img,
          visible: true,
          opacity: 1,
          blur: 0,
          rotateX: 0,
          rotateY: 0,
          rotateZ: 0,
          flipH: false,
          flipV: false,
          border: { width: 0, color: '#ffffff' },
          shadow: { offsetX: 0, offsetY: 0, blur: 0, color: '#000000' },
          // Image adjustments
          brightness: 100,
          contrast: 100,
          saturation: 100,
          hue: 0,
          filter: 'none'
        };
        setLayers([...layers, newLayer]);
        setSelectedLayer(newLayer.id);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const addText = () => {
    const newLayer = {
      id: Date.now(),
      type: 'text',
      text: 'New Text',
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      fontSize: 48,
      fontFamily: "Impact, 'Arial Black', sans-serif",
      color: '#ffffff',
      bold: false,
      italic: false,
      underline: false,
      strokeWidth: 0,
      strokeColor: '#000000',
      textEffect: 'none',
      gradientStart: '#ffffff',
      gradientEnd: '#ff0000',
      gradientAngle: 0,
      visible: true,
      opacity: 1,
      blur: 0,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      border: { width: 0, color: '#000000' },
      shadow: { offsetX: 0, offsetY: 0, blur: 0, color: '#000000' }
    };
    setLayers([...layers, newLayer]);
    setSelectedLayer(newLayer.id);
  };

  const updateLayer = (id, updates) => {
    const newLayers = layers.map(l => l.id === id ? { ...l, ...updates } : l);
    setLayers(newLayers);
  };

  const deleteLayer = (ids) => {
    const newLayers = layers.filter(l => !ids.includes(l.id));
    setLayers(newLayers);
    if (ids.includes(selectedLayer)) setSelectedLayer(null);
    setSelectedLayers(prevSelected => prevSelected.filter(id => !ids.includes(id)));
    setDeleteConfirmation(null);
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  const toggleVisibility = (id) => {
    const newLayers = layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l);
    setLayers(newLayers);
  };

  const moveLayer = (fromIndex, toIndex) => {
    const newLayers = [...layers];
    const [moved] = newLayers.splice(fromIndex, 1);
    newLayers.splice(toIndex, 0, moved);
    setLayers(newLayers);
  };



  const handleCanvasMouseDown = (e) => {
    if (deleteConfirmation) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    if (cropMode && cropBox) {
      const cropHandleSize = 12;
      const cropHandles = [
        { pos: 'tl', x: cropBox.x, y: cropBox.y },
        { pos: 'tr', x: cropBox.x + cropBox.width, y: cropBox.y },
        { pos: 'bl', x: cropBox.x, y: cropBox.y + cropBox.height },
        { pos: 'br', x: cropBox.x + cropBox.width, y: cropBox.y + cropBox.height }
      ];

      const clickedCropHandle = cropHandles.find(h => 
        Math.abs(x - h.x) < cropHandleSize && Math.abs(y - h.y) < cropHandleSize
      );

      if (clickedCropHandle) {
        setCropResizing({ 
          handle: clickedCropHandle.pos, 
          startX: x, 
          startY: y,
          startCropX: cropBox.x,
          startCropY: cropBox.y,
          startCropWidth: cropBox.width,
          startCropHeight: cropBox.height
        });
        return;
      }

      if (x >= cropBox.x && x <= cropBox.x + cropBox.width && 
          y >= cropBox.y && y <= cropBox.y + cropBox.height) {
        setCropDragging(true);
        setDragStart({ x: x - cropBox.x, y: y - cropBox.y });
        return;
      }

      return;
    }

    const clickedLayer = [...layers].reverse().find(l => 
      l.visible && x >= l.x && x <= l.x + l.width && y >= l.y && y <= l.y + l.height
    );
    
    const isCtrlPressed = e.ctrlKey || e.metaKey;

    if (clickedLayer) {
      // Multi-selection mode: Ctrl is pressed
      if (isCtrlPressed) {
        if (selectedLayers.includes(clickedLayer.id)) {
          // Deselect if already selected in multi-selection
          setSelectedLayers(selectedLayers.filter(id => id !== clickedLayer.id));
          setSelectedLayer(null);
          return;
        } else {
          // Add to selection
          // If there's a currently selected single layer, include it
          const newSelection = [...selectedLayers];
          if (selectedLayer && !newSelection.includes(selectedLayer)) {
            newSelection.push(selectedLayer);
          }
          newSelection.push(clickedLayer.id);
          setSelectedLayers(newSelection);
          setSelectedLayer(null);
          return;
        }
      }
      
      // If clicking on a layer that's part of current multi-selection without Ctrl,
      // start dragging all selected layers instead of clearing selection
      if (selectedLayers.length > 0 && selectedLayers.includes(clickedLayer.id)) {
        // Start dragging multi-selected layers
        if (!cropMode) {
          setIsDragging(true);
          setDragStart({ x: x, y: y }); // Use absolute position for multi-drag
        }
        return;
      }
      
      // Clear multi-selection when clicking without Ctrl
      setSelectedLayers([]);
      setSelectedLayer(clickedLayer.id);
      
      const handleSize = 16;
      const handles = [
        { pos: 'tl', x: clickedLayer.x, y: clickedLayer.y },
        { pos: 'tr', x: clickedLayer.x + clickedLayer.width, y: clickedLayer.y },
        { pos: 'bl', x: clickedLayer.x, y: clickedLayer.y + clickedLayer.height },
        { pos: 'br', x: clickedLayer.x + clickedLayer.width, y: clickedLayer.y + clickedLayer.height }
      ];

      const clickedHandle = handles.find(h => 
        Math.abs(x - h.x) < handleSize && Math.abs(y - h.y) < handleSize
      );

      if (clickedHandle && !cropMode) {
        setResizing({ 
          layerId: clickedLayer.id, 
          handle: clickedHandle.pos, 
          startX: x, 
          startY: y,
          startWidth: clickedLayer.width,
          startHeight: clickedLayer.height,
          startPosX: clickedLayer.x,
          startPosY: clickedLayer.y,
          startFontSize: clickedLayer.fontSize || 48
        });
      } else if (!cropMode) {
        setIsDragging(true);
        setDragStart({ x: x - clickedLayer.x, y: y - clickedLayer.y });
      }
    } else if (!cropMode) {
      setSelectedLayer(null);
      setSelectedLayers([]);
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (deleteConfirmation) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    if (cropDragging && cropBox && cropMode) {
      const layer = layers.find(l => l.id === cropMode);
      if (!layer) return;

      let newX = x - dragStart.x;
      let newY = y - dragStart.y;

      newX = Math.max(layer.x, Math.min(newX, layer.x + layer.width - cropBox.width));
      newY = Math.max(layer.y, Math.min(newY, layer.y + layer.height - cropBox.height));

      setCropBox({ ...cropBox, x: newX, y: newY });
      return;
    }

    if (cropResizing && cropBox && cropMode) {
      const layer = layers.find(l => l.id === cropMode);
      if (!layer) return;

      const dx = x - cropResizing.startX;
      const dy = y - cropResizing.startY;
      
      const shiftPressed = e.shiftKey;

      let newX = cropResizing.startCropX;
      let newY = cropResizing.startCropY;
      let newWidth = cropResizing.startCropWidth;
      let newHeight = cropResizing.startCropHeight;

      const aspectRatio = cropResizing.startCropWidth / cropResizing.startCropHeight;

      if (cropResizing.handle === 'br') {
        if (shiftPressed) {
          const avgDelta = Math.max(dx, dy);
          newWidth = Math.max(30, cropResizing.startCropWidth + avgDelta);
          newHeight = newWidth / aspectRatio;
        } else {
          newWidth = Math.max(30, cropResizing.startCropWidth + dx);
          newHeight = Math.max(30, cropResizing.startCropHeight + dy);
        }
        newWidth = Math.min(newWidth, layer.x + layer.width - newX);
        newHeight = Math.min(newHeight, layer.y + layer.height - newY);
        
        if (shiftPressed) {
          const constrainedWidth = Math.min(newWidth, (layer.y + layer.height - newY) * aspectRatio);
          newWidth = constrainedWidth;
          newHeight = constrainedWidth / aspectRatio;
        }
      } else if (cropResizing.handle === 'bl') {
        if (shiftPressed) {
          const avgDelta = Math.max(-dx, dy);
          newHeight = Math.max(30, cropResizing.startCropHeight + avgDelta);
          newWidth = newHeight * aspectRatio;
          newX = cropResizing.startCropX + cropResizing.startCropWidth - newWidth;
        } else {
          newX = cropResizing.startCropX + dx;
          newWidth = Math.max(30, cropResizing.startCropWidth - dx);
          newHeight = Math.max(30, cropResizing.startCropHeight + dy);
        }
        if (newX < layer.x) {
          newWidth += newX - layer.x;
          newX = layer.x;
        }
        newHeight = Math.min(newHeight, layer.y + layer.height - newY);
        
        if (shiftPressed) {
          const constrainedHeight = Math.min(newHeight, (newX + newWidth - layer.x) / aspectRatio);
          newHeight = constrainedHeight;
          newWidth = constrainedHeight * aspectRatio;
          newX = cropResizing.startCropX + cropResizing.startCropWidth - newWidth;
        }
      } else if (cropResizing.handle === 'tr') {
        if (shiftPressed) {
          const avgDelta = Math.max(dx, -dy);
          newWidth = Math.max(30, cropResizing.startCropWidth + avgDelta);
          newHeight = newWidth / aspectRatio;
          newY = cropResizing.startCropY + cropResizing.startCropHeight - newHeight;
        } else {
          newY = cropResizing.startCropY + dy;
          newWidth = Math.max(30, cropResizing.startCropWidth + dx);
          newHeight = Math.max(30, cropResizing.startCropHeight - dy);
        }
        if (newY < layer.y) {
          newHeight += newY - layer.y;
          newY = layer.y;
        }
        newWidth = Math.min(newWidth, layer.x + layer.width - newX);
        
        if (shiftPressed) {
          const constrainedWidth = Math.min(newWidth, (newY + newHeight - layer.y) * aspectRatio);
          newWidth = constrainedWidth;
          newHeight = constrainedWidth / aspectRatio;
          newY = cropResizing.startCropY + cropResizing.startCropHeight - newHeight;
        }
      } else if (cropResizing.handle === 'tl') {
        if (shiftPressed) {
          const avgDelta = Math.max(-dx, -dy);
          newWidth = Math.max(30, cropResizing.startCropWidth + avgDelta);
          newHeight = newWidth / aspectRatio;
          newX = cropResizing.startCropX + cropResizing.startCropWidth - newWidth;
          newY = cropResizing.startCropY + cropResizing.startCropHeight - newHeight;
        } else {
          newX = cropResizing.startCropX + dx;
          newY = cropResizing.startCropY + dy;
          newWidth = Math.max(30, cropResizing.startCropWidth - dx);
          newHeight = Math.max(30, cropResizing.startCropHeight - dy);
        }
        if (newX < layer.x) {
          newWidth += newX - layer.x;
          newX = layer.x;
        }
        if (newY < layer.y) {
          newHeight += newY - layer.y;
          newY = layer.y;
        }
        
        if (shiftPressed) {
          const constrainedWidth = Math.min(newWidth, newHeight * aspectRatio);
          const constrainedHeight = constrainedWidth / aspectRatio;
          newX = cropResizing.startCropX + cropResizing.startCropWidth - constrainedWidth;
          newY = cropResizing.startCropY + cropResizing.startCropHeight - constrainedHeight;
          newWidth = constrainedWidth;
          newHeight = constrainedHeight;
        }
      }

      setCropBox({ x: newX, y: newY, width: newWidth, height: newHeight });
      return;
    }

    if (isDragging && (selectedLayer || selectedLayers.length > 0)) {
      if (selectedLayers.length > 0) {
        // Move all selected layers together, maintaining relative positions
        const dx = x - dragStart.x;
        const dy = y - dragStart.y;
        
        const newLayers = layers.map(layer => {
          if (selectedLayers.includes(layer.id)) {
            return { ...layer, x: layer.x + dx, y: layer.y + dy };
          }
          return layer;
        });
        setLayers(newLayers);
        // Update dragStart to current position for next movement
        setDragStart({ x: x, y: y });
      } else {
        // Single layer movement
        let newX = x - dragStart.x;
        let newY = y - dragStart.y;
      
      const snapThreshold = 5;
      const currentLayer = layers.find(l => l.id === selectedLayer);
      if (!currentLayer) return;
      
      const xGuides = [];
      const yGuides = [];
      
      const currentCenterX = newX + currentLayer.width / 2;
      const currentCenterY = newY + currentLayer.height / 2;
      const currentRight = newX + currentLayer.width;
      const currentBottom = newY + currentLayer.height;
      
      const canvasCenterX = canvasSettings.width / 2;
      const canvasCenterY = canvasSettings.height / 2;
      
      if (Math.abs(currentCenterX - canvasCenterX) < snapThreshold) {
        xGuides.push(canvasCenterX);
        newX = canvasCenterX - currentLayer.width / 2;
      }
      if (Math.abs(currentCenterY - canvasCenterY) < snapThreshold) {
        yGuides.push(canvasCenterY);
        newY = canvasCenterY - currentLayer.height / 2;
      }
      
      if (Math.abs(newX) < snapThreshold) {
        xGuides.push(0);
        newX = 0;
      }
      if (Math.abs(newY) < snapThreshold) {
        yGuides.push(0);
        newY = 0;
      }
      if (Math.abs(currentRight - canvasSettings.width) < snapThreshold) {
        xGuides.push(canvasSettings.width);
        newX = canvasSettings.width - currentLayer.width;
      }
      if (Math.abs(currentBottom - canvasSettings.height) < snapThreshold) {
        yGuides.push(canvasSettings.height);
        newY = canvasSettings.height - currentLayer.height;
      }
      
      layers.forEach(layer => {
        if (layer.id === selectedLayer || !layer.visible) return;
        
        const layerCenterX = layer.x + layer.width / 2;
        const layerCenterY = layer.y + layer.height / 2;
        const layerRight = layer.x + layer.width;
        const layerBottom = layer.y + layer.height;
        
        const recalcCenterX = newX + currentLayer.width / 2;
        const recalcCenterY = newY + currentLayer.height / 2;
        const recalcRight = newX + currentLayer.width;
        const recalcBottom = newY + currentLayer.height;
        
        if (Math.abs(newX - layer.x) < snapThreshold) {
          xGuides.push(layer.x);
          newX = layer.x;
        }
        if (Math.abs(recalcRight - layerRight) < snapThreshold) {
          xGuides.push(layerRight);
          newX = layerRight - currentLayer.width;
        }
        if (Math.abs(recalcCenterX - layerCenterX) < snapThreshold) {
          xGuides.push(layerCenterX);
          newX = layerCenterX - currentLayer.width / 2;
        }
        
        if (Math.abs(newY - layer.y) < snapThreshold) {
          yGuides.push(layer.y);
          newY = layer.y;
        }
        if (Math.abs(recalcBottom - layerBottom) < snapThreshold) {
          yGuides.push(layerBottom);
          newY = layerBottom - currentLayer.height;
        }
        if (Math.abs(recalcCenterY - layerCenterY) < snapThreshold) {
          yGuides.push(layerCenterY);
          newY = layerCenterY - currentLayer.height / 2;
        }
      });
      
      updateLayer(selectedLayer, { x: newX, y: newY });
      setGuides({ x: xGuides, y: yGuides });
      }
    } else if (resizing) {
      const layer = layers.find(l => l.id === resizing.layerId);
      if (!layer) return;

      const shiftPressed = e.shiftKey;
      let updates = {};
      
      const dx = x - resizing.startX;
      const dy = y - resizing.startY;

      if (layer.type === 'text') {
        const avgDelta = (dx + dy) / 2;
        const fontSizeChange = avgDelta / 5;
        const newFontSize = Math.max(8, resizing.startFontSize + fontSizeChange);
        updates.fontSize = newFontSize;
      } else {
        if (resizing.handle === 'br') {
          if (shiftPressed && layer.aspectRatio) {
            const newWidth = Math.max(20, resizing.startWidth + dx);
            updates.width = newWidth;
            updates.height = newWidth / layer.aspectRatio;
          } else {
            updates.width = Math.max(20, resizing.startWidth + dx);
            updates.height = Math.max(20, resizing.startHeight + dy);
          }
        } else if (resizing.handle === 'tr') {
          if (shiftPressed && layer.aspectRatio) {
            const newWidth = Math.max(20, resizing.startWidth + dx);
            updates.width = newWidth;
            updates.height = newWidth / layer.aspectRatio;
            updates.y = resizing.startPosY - (updates.height - resizing.startHeight);
          } else {
            updates.width = Math.max(20, resizing.startWidth + dx);
            updates.height = Math.max(20, resizing.startHeight - dy);
            updates.y = resizing.startPosY + dy;
          }
        } else if (resizing.handle === 'bl') {
          if (shiftPressed && layer.aspectRatio) {
            const newHeight = Math.max(20, resizing.startHeight + dy);
            updates.height = newHeight;
            updates.width = newHeight * layer.aspectRatio;
            updates.x = resizing.startPosX - (updates.width - resizing.startWidth);
          } else {
            updates.width = Math.max(20, resizing.startWidth - dx);
            updates.height = Math.max(20, resizing.startHeight + dy);
            updates.x = resizing.startPosX + dx;
          }
        } else if (resizing.handle === 'tl') {
          if (shiftPressed && layer.aspectRatio) {
            const newWidth = Math.max(20, resizing.startWidth - dx);
            updates.width = newWidth;
            updates.height = newWidth / layer.aspectRatio;
            updates.x = resizing.startPosX + dx;
            updates.y = resizing.startPosY - (updates.height - resizing.startHeight);
          } else {
            updates.width = Math.max(20, resizing.startWidth - dx);
            updates.height = Math.max(20, resizing.startHeight - dy);
            updates.x = resizing.startPosX + dx;
            updates.y = resizing.startPosY + dy;
          }
        }
      }

      updateLayer(resizing.layerId, updates);
    }
  };

  const handleCanvasMouseUp = () => {
    if (deleteConfirmation) return;
    
    setIsDragging(false);
    setResizing(null);
    setCropDragging(false);
    setCropResizing(null);
    setGuides({ x: [], y: [] });
  };

  const exportImage = () => {
    // Create a temporary canvas for clean export
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasSettings.width;
    tempCanvas.height = canvasSettings.height;
    const ctx = tempCanvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Draw background
    ctx.save();
    ctx.globalAlpha = canvasSettings.bgOpacity;
    
    // Apply background image filters if there's a background image
    if (canvasSettings.bgImage) {
      const bgFilters = [];
      
      if (canvasSettings.bgBrightness !== 100) {
        bgFilters.push(`brightness(${canvasSettings.bgBrightness}%)`);
      }
      if (canvasSettings.bgContrast !== 100) {
        bgFilters.push(`contrast(${canvasSettings.bgContrast}%)`);
      }
      if (canvasSettings.bgSaturation !== 100) {
        bgFilters.push(`saturate(${canvasSettings.bgSaturation}%)`);
      }
      if (canvasSettings.bgHue !== 0) {
        bgFilters.push(`hue-rotate(${canvasSettings.bgHue}deg)`);
      }
      
      switch (canvasSettings.bgFilter) {
        case 'grayscale':
          bgFilters.push('grayscale(100%)');
          break;
        case 'sepia':
          bgFilters.push('sepia(100%)');
          break;
        case 'invert':
          bgFilters.push('invert(100%)');
          break;
        case 'vintage':
          bgFilters.push('sepia(40%) contrast(110%) brightness(90%)');
          break;
      }
      
      if (canvasSettings.bgBlur > 0) {
        bgFilters.push(`blur(${canvasSettings.bgBlur}px)`);
      }
      
      if (bgFilters.length > 0) {
        ctx.filter = bgFilters.join(' ');
      }
    } else if (canvasSettings.bgBlur > 0) {
      ctx.filter = `blur(${canvasSettings.bgBlur}px)`;
    }
    
    if (canvasSettings.bgImage) {
      ctx.drawImage(canvasSettings.bgImage, 0, 0, tempCanvas.width, tempCanvas.height);
    } else if (canvasSettings.bgType === 'gradient') {
      const angle = (canvasSettings.bgGradientAngle || 0) * Math.PI / 180;
      const x1 = tempCanvas.width / 2 - Math.cos(angle) * tempCanvas.width / 2;
      const y1 = tempCanvas.height / 2 - Math.sin(angle) * tempCanvas.height / 2;
      const x2 = tempCanvas.width / 2 + Math.cos(angle) * tempCanvas.width / 2;
      const y2 = tempCanvas.height / 2 + Math.sin(angle) * tempCanvas.height / 2;
      
      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      gradient.addColorStop(0, canvasSettings.bgGradientStart || canvasSettings.bgColor);
      gradient.addColorStop(1, canvasSettings.bgGradientEnd || '#ffffff');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    } else {
      ctx.fillStyle = canvasSettings.bgColor;
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    }
    
    ctx.restore();

    // Draw all visible layers (without selection box, guides, grid, etc.)
    layers.filter(l => l.visible).forEach(layer => {
      ctx.save();
      ctx.globalAlpha = layer.opacity;

      if (layer.type === 'image' && layer.image) {
        // Apply image adjustments and filters
        const filters = [];
        
        if (layer.brightness !== 100) {
          filters.push(`brightness(${layer.brightness}%)`);
        }
        if (layer.contrast !== 100) {
          filters.push(`contrast(${layer.contrast}%)`);
        }
        if (layer.saturation !== 100) {
          filters.push(`saturate(${layer.saturation}%)`);
        }
        if (layer.hue !== 0) {
          filters.push(`hue-rotate(${layer.hue}deg)`);
        }
        
        switch (layer.filter) {
          case 'grayscale':
            filters.push('grayscale(100%)');
            break;
          case 'sepia':
            filters.push('sepia(100%)');
            break;
          case 'invert':
            filters.push('invert(100%)');
            break;
          case 'vintage':
            filters.push('sepia(40%) contrast(110%) brightness(90%)');
            break;
        }
        
        if (layer.blur > 0) {
          filters.push(`blur(${layer.blur}px)`);
        }
        
        if (filters.length > 0) {
          ctx.filter = filters.join(' ');
        }
        
        if (layer.shadow.blur > 0) {
          ctx.shadowColor = layer.shadow.color;
          ctx.shadowBlur = layer.shadow.blur;
          ctx.shadowOffsetX = layer.shadow.offsetX;
          ctx.shadowOffsetY = layer.shadow.offsetY;
        }

        ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
        
        // Apply 3D rotation (Z-axis is normal rotation)
        const imgRotX = (layer.rotateX || 0) * Math.PI / 180;
        const imgRotY = (layer.rotateY || 0) * Math.PI / 180;
        const imgRotZ = (layer.rotateZ || 0) * Math.PI / 180;
        
        // Apply Z rotation (normal rotation)
        ctx.rotate(imgRotZ);
        
        // Apply 3D effect for X and Y rotation
        const imgScaleX = Math.cos(imgRotY);
        const imgScaleY = Math.cos(imgRotX);
        const imgSkewX = Math.sin(imgRotY) * 0.5;
        const imgSkewY = Math.sin(imgRotX) * 0.5;
        
        ctx.transform(imgScaleX, imgSkewY, imgSkewX, imgScaleY, 0, 0);
        
        ctx.scale(layer.flipH ? -1 : 1, layer.flipV ? -1 : 1);
        
        // Draw border first if needed (using image alpha as mask)
        if (layer.border.width > 0) {
          // Create a temporary canvas for border effect
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = layer.width + layer.border.width * 4;
          tempCanvas.height = layer.height + layer.border.width * 4;
          const tempCtx = tempCanvas.getContext('2d');
          
          const offset = layer.border.width * 2;
          
          // Draw the image multiple times offset to create outline
          for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
            const xOff = Math.cos(angle) * layer.border.width;
            const yOff = Math.sin(angle) * layer.border.width;
            tempCtx.drawImage(layer.image, offset + xOff, offset + yOff, layer.width, layer.height);
          }
          
          // Set composite mode to only draw where there's image pixels
          tempCtx.globalCompositeOperation = 'source-in';
          tempCtx.fillStyle = layer.border.color;
          tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
          
          // Draw the border from temp canvas
          ctx.drawImage(tempCanvas, -layer.width / 2 - offset, -layer.height / 2 - offset);
        }
        
        ctx.drawImage(
          layer.image,
          -layer.width / 2, -layer.height / 2, layer.width, layer.height
        );
        
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      } else if (layer.type === 'text') {
        let fontStyle = '';
        if (layer.bold) fontStyle += 'bold ';
        if (layer.italic) fontStyle += 'italic ';
        ctx.font = `${fontStyle}${layer.fontSize}px ${layer.fontFamily}`;
        
        if (layer.blur > 0) {
          ctx.filter = `blur(${layer.blur}px)`;
        }

        if (layer.shadow.blur > 0) {
          ctx.shadowColor = layer.shadow.color;
          ctx.shadowBlur = layer.shadow.blur;
          ctx.shadowOffsetX = layer.shadow.offsetX;
          ctx.shadowOffsetY = layer.shadow.offsetY;
        }

        if (layer.textEffect === 'gradient') {
          const angle = (layer.gradientAngle || 0) * Math.PI / 180;
          const gradientLength = layer.fontSize * 2;
          const x1 = layer.x - Math.cos(angle) * gradientLength / 2;
          const y1 = layer.y - Math.sin(angle) * gradientLength / 2;
          const x2 = layer.x + Math.cos(angle) * gradientLength / 2;
          const y2 = layer.y + Math.sin(angle) * gradientLength / 2;
          
          const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
          gradient.addColorStop(0, layer.gradientStart || layer.color);
          gradient.addColorStop(1, layer.gradientEnd || '#ff0000');
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = layer.color;
        }
        
        const lines = layer.text.split('\n');
        const lineHeightMultiplier = layer.lineHeight || 1.2;
        const lineHeight = layer.fontSize * lineHeightMultiplier;
        
        // Apply 3D rotation (Z-axis is normal rotation)
        const exportTxtRotX = (layer.rotateX || 0) * Math.PI / 180;
        const exportTxtRotY = (layer.rotateY || 0) * Math.PI / 180;
        const exportTxtRotZ = (layer.rotateZ || 0) * Math.PI / 180;
        
        ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
        
        // Apply Z rotation (normal rotation)
        ctx.rotate(exportTxtRotZ);
        
        // Apply 3D effect for X and Y rotation
        if (exportTxtRotX !== 0 || exportTxtRotY !== 0) {
          const exportTxtScaleX = Math.cos(exportTxtRotY);
          const exportTxtScaleY = Math.cos(exportTxtRotX);
          const exportTxtSkewX = Math.sin(exportTxtRotY) * 0.5;
          const exportTxtSkewY = Math.sin(exportTxtRotX) * 0.5;
          
          ctx.transform(exportTxtScaleX, exportTxtSkewY, exportTxtSkewX, exportTxtScaleY, 0, 0);
        }
        
        ctx.translate(-(layer.x + layer.width / 2), -(layer.y + layer.height / 2));
        
        lines.forEach((line, index) => {
          const yPos = layer.y + layer.fontSize + (index * lineHeight);
          const xPos = layer.x;
          
          if (layer.strokeWidth > 0) {
            ctx.strokeStyle = layer.strokeColor || '#000000';
            ctx.lineWidth = layer.strokeWidth;
            ctx.lineJoin = 'round';
            ctx.miterLimit = 2;
            ctx.strokeText(line, xPos, yPos);
          }
          
          ctx.fillText(line, xPos, yPos);
          
          // Draw underline if enabled
          if (layer.underline) {
            const textWidth = ctx.measureText(line).width;
            const underlineY = yPos + layer.fontSize * 0.1;
            const underlineThickness = Math.max(1, layer.fontSize * 0.05);
            
            ctx.save();
            ctx.strokeStyle = layer.textEffect === 'gradient' ? layer.color : ctx.fillStyle;
            ctx.lineWidth = underlineThickness;
            ctx.beginPath();
            ctx.moveTo(xPos, underlineY);
            ctx.lineTo(xPos + textWidth, underlineY);
            ctx.stroke();
            ctx.restore();
          }
        });
        
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }

      ctx.restore();
    });
    
    // Export the clean canvas
    const link = document.createElement('a');
    link.download = 'thumbnail.png';
    link.href = tempCanvas.toDataURL();
    link.click();
  };

  const flipLayer = (horizontal) => {
    if (!selectedLayer) return;
    const layer = layers.find(l => l.id === selectedLayer);
    if (layer && layer.type === 'image') {
      updateLayer(selectedLayer, horizontal ? { flipH: !layer.flipH } : { flipV: !layer.flipV });
    }
  };



  const startCropMode = () => {
    if (!selectedLayer) return;
    const layer = layers.find(l => l.id === selectedLayer);
    if (layer && layer.type === 'image') {
      const cropWidth = layer.width * 0.8;
      const cropHeight = layer.height * 0.8;
      const cropX = layer.x + (layer.width - cropWidth) / 2;
      const cropY = layer.y + (layer.height - cropHeight) / 2;
      
      setCropBox({
        x: cropX,
        y: cropY,
        width: cropWidth,
        height: cropHeight
      });
      setCropMode(selectedLayer);
    }
  };

  const applyCrop = () => {
    if (!cropMode || !cropBox) return;
    
    const layer = layers.find(l => l.id === cropMode);
    if (!layer || layer.type !== 'image') return;

    const scaleX = layer.originalWidth / layer.width;
    const scaleY = layer.originalHeight / layer.height;
    
    const cropRelX = (cropBox.x - layer.x) * scaleX;
    const cropRelY = (cropBox.y - layer.y) * scaleY;
    const cropRelWidth = cropBox.width * scaleX;
    const cropRelHeight = cropBox.height * scaleY;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cropRelWidth;
    tempCanvas.height = cropRelHeight;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.save();
    
    if (layer.rotateZ || layer.flipH || layer.flipV) {
      tempCtx.translate(cropRelWidth / 2, cropRelHeight / 2);
      tempCtx.rotate((layer.rotateZ || 0) * Math.PI / 180);
      tempCtx.scale(layer.flipH ? -1 : 1, layer.flipV ? -1 : 1);
      
      tempCtx.drawImage(
        layer.image,
        cropRelX, cropRelY, cropRelWidth, cropRelHeight,
        -cropRelWidth / 2, -cropRelHeight / 2, cropRelWidth, cropRelHeight
      );
    } else {
      tempCtx.drawImage(
        layer.image,
        cropRelX, cropRelY, cropRelWidth, cropRelHeight,
        0, 0, cropRelWidth, cropRelHeight
      );
    }
    
    tempCtx.restore();

    const croppedImg = new Image();
    croppedImg.onload = () => {
      updateLayer(cropMode, {
        image: croppedImg,
        originalWidth: cropRelWidth,
        originalHeight: cropRelHeight,
        width: cropBox.width,
        height: cropBox.height,
        aspectRatio: cropBox.width / cropBox.height,
        x: cropBox.x,
        y: cropBox.y,
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        flipH: false,
        flipV: false
      });
      
      setCropMode(null);
      setCropBox(null);
    };
    croppedImg.src = tempCanvas.toDataURL();
  };

  const cancelCrop = () => {
    setCropMode(null);
    setCropBox(null);
  };

  const swapDimensions = () => {
    setCanvasSettings({ 
      ...canvasSettings, 
      width: canvasSettings.height, 
      height: canvasSettings.width 
    });
  };

  const uploadBackgroundImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setCanvasSettings({ ...canvasSettings, bgImage: img });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const removeBackgroundImage = () => {
    setCanvasSettings({ ...canvasSettings, bgImage: null });
  };

  const clearAll = () => {
    if (confirm('Are you sure you want to clear everything? This cannot be undone.')) {
      setLayers([]);
      setSelectedLayer(null);
      setCanvasSettings(DEFAULT_CANVAS);
      localStorage.removeItem('thumbnailEditorLayers');
      localStorage.removeItem('thumbnailEditorCanvas');
    }
  };

  const exportProject = () => {
    try {
      // Convert layers to serializable format
      const serializableLayers = layers.map(layer => {
        if (layer.type === 'image' && layer.image) {
          const canvas = document.createElement('canvas');
          canvas.width = layer.image.width;
          canvas.height = layer.image.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(layer.image, 0, 0);
          const imageData = canvas.toDataURL();
          return { ...layer, image: null, imageData };
        }
        return layer;
      });
      
      // Save canvas settings
      const serializableCanvas = { ...canvasSettings };
      if (canvasSettings.bgImage) {
        const canvas = document.createElement('canvas');
        canvas.width = canvasSettings.bgImage.width;
        canvas.height = canvasSettings.bgImage.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(canvasSettings.bgImage, 0, 0);
        serializableCanvas.bgImageData = canvas.toDataURL();
        serializableCanvas.bgImage = null;
      }
      
      const project = {
        version: '1.0',
        layers: serializableLayers,
        canvas: serializableCanvas,
        timestamp: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `thumbnail-project-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export project:', error);
      alert('Failed to export project. Please try again.');
    }
  };

  const importProject = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const project = JSON.parse(event.target.result);
        
        // Restore layers
        const restoredLayers = project.layers.map(layer => {
          if (layer.type === 'image' && layer.imageData) {
            const img = new Image();
            img.src = layer.imageData;
            return { ...layer, image: img };
          }
          return layer;
        });
        
        setLayers(restoredLayers);
        setSelectedLayer(null);
        
        // Restore canvas settings
        if (project.canvas.bgImageData) {
          const img = new Image();
          img.src = project.canvas.bgImageData;
          img.onload = () => {
            setCanvasSettings({ ...project.canvas, bgImage: img });
          };
        } else {
          setCanvasSettings(project.canvas);
        }
        
        alert('Project imported successfully!');
      } catch (error) {
        console.error('Failed to import project:', error);
        alert('Failed to import project. Please make sure the file is valid.');
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    e.target.value = '';
  };

  const selectedLayerData = layers.find(l => l.id === selectedLayer);

  const handleLayerSelect = (layerId, mode, currentSelectedLayer) => {
    if (mode === 'single') {
      setSelectedLayer(layerId);
      setSelectedLayers([]);
    } else if (mode === 'add-multi') {
      const newSelection = [...selectedLayers];
      if (currentSelectedLayer && !newSelection.includes(currentSelectedLayer)) {
        newSelection.push(currentSelectedLayer);
      }
      newSelection.push(layerId);
      setSelectedLayers(newSelection);
      setSelectedLayer(null);
    } else if (mode === 'remove-multi') {
      setSelectedLayers(selectedLayers.filter(id => id !== layerId));
      setSelectedLayer(null);
    }
  };

  const handleDeleteLayer = (type, ids) => {
    setDeleteConfirmation({ type, ids });
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <LayersPanel
        layers={layers}
        selectedLayer={selectedLayer}
        selectedLayers={selectedLayers}
        draggedLayer={draggedLayer}
        dragOverIndex={dragOverIndex}
        cropMode={cropMode}
        deleteConfirmation={deleteConfirmation}
        onLayerSelect={handleLayerSelect}
        onToggleVisibility={toggleVisibility}
        onDeleteLayer={handleDeleteLayer}
        onMoveLayer={moveLayer}
        onDraggedLayerChange={setDraggedLayer}
        onDragOverIndexChange={setDragOverIndex}
        onDeselectAll={() => setSelectedLayer(null)}
      />

      <div className="flex-1 flex flex-col" style={{ backgroundColor: canvasSettings.workspaceColor || '#2E3848' }}>
        <Toolbar
          zoom={zoom}
          selectedLayer={selectedLayer}
          selectedLayers={selectedLayers}
          cropMode={cropMode}
          deleteConfirmation={deleteConfirmation}
          onZoomIn={() => setZoom(Math.min(3, zoom + 0.1))}
          onZoomOut={() => setZoom(Math.max(0.1, zoom - 0.1))}
          onResetZoom={() => setZoom(1)}
          onExportProject={exportProject}
          onImportProject={importProject}
          onAddImage={addImage}
          onAddText={addText}
          onExportImage={exportImage}
          onDeleteSelected={() => {
            if (selectedLayers.length > 0) {
              setDeleteConfirmation({ type: 'multiple', ids: selectedLayers });
            } else if (selectedLayer) {
              setDeleteConfirmation({ type: 'single', ids: [selectedLayer] });
            }
          }}
          onApplyCrop={applyCrop}
          onCancelCrop={cancelCrop}
          onConfirmDelete={() => deleteLayer(deleteConfirmation.ids)}
          onCancelDelete={cancelDelete}
          onDeselectAll={() => setSelectedLayer(null)}
        />

        <div className="flex-1 flex items-center justify-center p-8 overflow-auto" onMouseDown={(e) => {
          if (e.target === e.currentTarget && !cropMode && !deleteConfirmation) {
            setSelectedLayer(null);
          }
        }}>
          <div className="relative" style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}>
            <canvas
              ref={canvasRef}
              width={canvasSettings.width}
              height={canvasSettings.height}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              onWheel={(e) => {
                if (!cropMode && !deleteConfirmation) {
                  e.preventDefault();
                  const delta = e.deltaY > 0 ? -0.1 : 0.1;
                  setZoom(Math.max(0.1, Math.min(3, zoom + delta)));
                }
              }}
              className={`border border-gray-700 shadow-2xl ${deleteConfirmation ? 'pointer-events-none opacity-50' : 'cursor-crosshair'}`}
            />
          </div>
        </div>
      </div>

      {selectedLayerData && selectedLayers.length === 0 ? (
        <PropertiesPanel
          selectedLayerData={selectedLayerData}
          selectedLayer={selectedLayer}
          cropMode={cropMode}
          deleteConfirmation={deleteConfirmation}
          updateLayer={updateLayer}
          flipLayer={flipLayer}
          startCropMode={startCropMode}
        />
      ) : selectedLayers.length > 0 ? (
        <div className="w-80 bg-gray-800 p-4 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Multi-Selection</h2>
          <div className="text-center py-8 px-4">
            <div className="space-y-2 text-sm text-gray-300">
              <p>✓ Drag on canvas to move</p>
              <p>✓ Arrow keys to move</p>
              <p>✓ Delete key to remove all</p>
              <p>✓ Escape to deselect</p>
            </div>
          </div>
        </div>
      ) : (
        <CanvasSettingsPanel
          canvasSettings={canvasSettings}
          setCanvasSettings={setCanvasSettings}
          cropMode={cropMode}
          deleteConfirmation={deleteConfirmation}
          swapDimensions={swapDimensions}
          uploadBackgroundImage={uploadBackgroundImage}
          removeBackgroundImage={removeBackgroundImage}
          clearAll={clearAll}
        />
      )}
    </div>
  );
}
