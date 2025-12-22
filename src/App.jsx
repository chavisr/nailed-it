import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Trash2, ImagePlus, Type, Download, ZoomIn, ZoomOut, FlipHorizontal, FlipVertical, RotateCw, ArrowRightLeft, Crop, Check, X, Settings, ClipboardPaste, RotateCcw } from 'lucide-react';

// Load Google Fonts
const loadGoogleFonts = () => {
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&family=Open+Sans:wght@400;700&family=Montserrat:wght@400;700&family=Oswald:wght@400;700&family=Bebas+Neue&family=Pacifico&family=Bangers&family=Permanent+Marker&display=swap';
  link.rel = 'stylesheet';
  if (!document.querySelector(`link[href="${link.href}"]`)) {
    document.head.appendChild(link);
  }
};

const DEFAULT_CANVAS = { 
  width: 1280, 
  height: 720, 
  bgColor: '#1a1a1a', 
  bgType: 'solid',
  bgGradientStart: '#1a1a1a',
  bgGradientEnd: '#4a4a4a',
  bgGradientAngle: 45,
  bgImage: null, 
  bgOpacity: 1, 
  bgBlur: 0,
  showGrid: false,
  gridSize: 20,
  gridColor: '#444444',
  showRulers: false
};

const IMAGE_FILTERS = {
  none: 'None',
  grayscale: 'Grayscale',
  sepia: 'Sepia',
  invert: 'Invert',
  blur: 'Blur',
  sharpen: 'Sharpen',
  vintage: 'Vintage',
  cool: 'Cool',
  warm: 'Warm'
};

export default function App() {
  const [canvasSettings, setCanvasSettings] = useState(DEFAULT_CANVAS);
  const [layers, setLayers] = useState([]);
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [draggedLayer, setDraggedLayer] = useState(null);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizing, setResizing] = useState(null);
  const [guides, setGuides] = useState({ x: [], y: [] });
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [copiedLayer, setCopiedLayer] = useState(null);
  const [cropMode, setCropMode] = useState(null);
  const [cropBox, setCropBox] = useState(null);
  const [cropDragging, setCropDragging] = useState(false);
  const [cropResizing, setCropResizing] = useState(null);
  const [manualGuides, setManualGuides] = useState({ vertical: [], horizontal: [] });

  // Load Google Fonts on mount
  useEffect(() => {
    loadGoogleFonts();
  }, []);

  useEffect(() => {
    renderCanvas();
  }, [layers, canvasSettings, selectedLayer, guides, cropMode, cropBox]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' && selectedLayer && !cropMode) {
        deleteLayer(selectedLayer);
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedLayer && !cropMode) {
        e.preventDefault();
        const layerToCopy = layers.find(l => l.id === selectedLayer);
        if (layerToCopy) {
          setCopiedLayer(layerToCopy);
        }
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && copiedLayer && !cropMode) {
        e.preventDefault();
        const newLayer = {
          ...copiedLayer,
          id: Date.now(),
          x: copiedLayer.x + 20,
          y: copiedLayer.y + 20
        };
        setLayers([...layers, newLayer]);
        setSelectedLayer(newLayer.id);
      }
      
      if (selectedLayer && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && !cropMode) {
        e.preventDefault();
        const layer = layers.find(l => l.id === selectedLayer);
        if (layer) {
          const step = e.shiftKey ? 10 : 5;
          let updates = {};
          
          if (e.key === 'ArrowUp') updates.y = layer.y - step;
          if (e.key === 'ArrowDown') updates.y = layer.y + step;
          if (e.key === 'ArrowLeft') updates.x = layer.x - step;
          if (e.key === 'ArrowRight') updates.x = layer.x + step;
          
          updateLayer(selectedLayer, updates);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayer, copiedLayer, layers, cropMode]);

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
      case 'cool':
        filters.push('hue-rotate(180deg) saturate(120%)');
        break;
      case 'warm':
        filters.push('sepia(20%) saturate(130%) brightness(105%)');
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
    
    if (canvasSettings.bgBlur > 0) {
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
      ctx.strokeStyle = canvasSettings.gridColor || '#444444';
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
        ctx.rotate((layer.rotation || 0) * Math.PI / 180);
        ctx.scale(layer.flipH ? -1 : 1, layer.flipV ? -1 : 1);
        
        ctx.drawImage(
          layer.image,
          -layer.width / 2, -layer.height / 2, layer.width, layer.height
        );
        
        if (layer.border.width > 0) {
          ctx.strokeStyle = layer.border.color;
          ctx.lineWidth = layer.border.width;
          ctx.strokeRect(-layer.width / 2, -layer.height / 2, layer.width, layer.height);
        }
        
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
        
        // Apply rotation if present
        if (layer.rotation) {
          ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
          ctx.rotate((layer.rotation || 0) * Math.PI / 180);
          ctx.translate(-(layer.x + layer.width / 2), -(layer.y + layer.height / 2));
        }
        
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
        });
        
        // Reset transformation
        if (layer.rotation) {
          ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
      }

      ctx.restore();
    });

    const layer = layers.find(l => l.id === selectedLayer);
    if (layer) {
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
          rotation: 0,
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
      fontFamily: 'Arial',
      color: '#ffffff',
      bold: false,
      italic: false,
      strokeWidth: 0,
      strokeColor: '#000000',
      textEffect: 'none',
      gradientStart: '#ffffff',
      gradientEnd: '#ff0000',
      gradientAngle: 0,
      visible: true,
      opacity: 1,
      blur: 0,
      rotation: 0,
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

  const deleteLayer = (id) => {
    const newLayers = layers.filter(l => l.id !== id);
    setLayers(newLayers);
    if (selectedLayer === id) setSelectedLayer(null);
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

  const pasteFromClipboard = async () => {
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
                  rotation: 0,
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
                setLayers([...layers, newLayer]);
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
            fontFamily: 'Arial',
            color: '#ffffff',
            bold: false,
            italic: false,
            visible: true,
            opacity: 1,
            blur: 0,
            rotation: 0,
            border: { width: 0, color: '#000000' },
            shadow: { offsetX: 0, offsetY: 0, blur: 0, color: '#000000' }
          };
          setLayers([...layers, newLayer]);
          setSelectedLayer(newLayer.id);
          return;
        }
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
      alert('Failed to paste from clipboard. Please make sure you have granted clipboard permissions.');
    }
  };

  const handleCanvasMouseDown = (e) => {
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

    if (clickedLayer) {
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
    }
  };

  const handleCanvasMouseMove = (e) => {
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

    if (isDragging && selectedLayer) {
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
    
    if (canvasSettings.bgBlur > 0) {
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
          case 'cool':
            filters.push('hue-rotate(180deg) saturate(120%)');
            break;
          case 'warm':
            filters.push('sepia(20%) saturate(130%) brightness(105%)');
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
        ctx.rotate((layer.rotation || 0) * Math.PI / 180);
        ctx.scale(layer.flipH ? -1 : 1, layer.flipV ? -1 : 1);
        
        ctx.drawImage(
          layer.image,
          -layer.width / 2, -layer.height / 2, layer.width, layer.height
        );
        
        if (layer.border.width > 0) {
          ctx.strokeStyle = layer.border.color;
          ctx.lineWidth = layer.border.width;
          ctx.strokeRect(-layer.width / 2, -layer.height / 2, layer.width, layer.height);
        }
        
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
        
        if (layer.rotation) {
          ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
          ctx.rotate((layer.rotation || 0) * Math.PI / 180);
          ctx.translate(-(layer.x + layer.width / 2), -(layer.y + layer.height / 2));
        }
        
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
        });
        
        if (layer.rotation) {
          ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
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

  const rotateLayer = () => {
    if (!selectedLayer) return;
    const layer = layers.find(l => l.id === selectedLayer);
    if (layer) {
      updateLayer(selectedLayer, { rotation: (layer.rotation + 90) % 360 });
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
    
    if (layer.rotation || layer.flipH || layer.flipV) {
      tempCtx.translate(cropRelWidth / 2, cropRelHeight / 2);
      tempCtx.rotate((layer.rotation || 0) * Math.PI / 180);
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
        rotation: 0,
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

  const selectedLayerData = layers.find(l => l.id === selectedLayer);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <div className={`w-64 bg-gray-800 p-4 overflow-y-auto ${cropMode ? 'pointer-events-none opacity-50' : ''}`} onMouseDown={(e) => {
        if (e.target === e.currentTarget && !cropMode) {
          setSelectedLayer(null);
        }
      }}>
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Nailed-it
        </h1>
        <p className="text-sm text-gray-400 mb-6">
          Thumbnail Editor
        </p>
        
        <h2 className="text-xl font-bold mb-4">Tools</h2>

        <div className="space-y-2 mb-6">
          <button
            onClick={() => setSelectedLayer(null)}
            className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
          >
            <Settings size={18} />
            Canvas Settings
          </button>
          <button
            onClick={pasteFromClipboard}
            className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded"
          >
            <ClipboardPaste size={18} />
            Paste from Clipboard
          </button>
          <label className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded cursor-pointer">
            <ImagePlus size={18} />
            Add Image
            <input type="file" accept="image/*" onChange={addImage} className="hidden" />
          </label>
          <button
            onClick={addText}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
          >
            <Type size={18} />
            Add Text
          </button>
          <button
            onClick={exportImage}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
          >
            <Download size={18} />
            Export PNG
          </button>
        </div>

        <h2 className="text-xl font-bold mb-3">Layers</h2>
        <div className="space-y-2">
          {[...layers].reverse().map((layer, idx) => {
            const actualIndex = layers.length - 1 - idx;
            const isDragOver = dragOverIndex === actualIndex;
            return (
              <div key={layer.id} className="relative">
                {isDragOver && (
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 z-10"></div>
                )}
                <div
                  draggable
                  onDragStart={() => setDraggedLayer(actualIndex)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverIndex(actualIndex);
                  }}
                  onDragLeave={() => setDragOverIndex(null)}
                  onDrop={() => {
                    if (draggedLayer !== null) {
                      moveLayer(draggedLayer, actualIndex);
                      setDraggedLayer(null);
                      setDragOverIndex(null);
                    }
                  }}
                  className={`p-2 bg-gray-700 rounded flex items-center gap-2 cursor-move ${
                    selectedLayer === layer.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedLayer(layer.id)}
                >
                  <button onClick={(e) => { e.stopPropagation(); toggleVisibility(layer.id); }}>
                    {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <span className="flex-1 text-sm truncate">
                    {layer.type === 'text' ? layer.text : `Image ${layer.id}`}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}>
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gray-950">
        <div className="p-4 bg-gray-800 flex items-center gap-4 border-b border-gray-700" onMouseDown={(e) => {
          if (e.target === e.currentTarget && !cropMode) {
            setSelectedLayer(null);
          }
        }}>
          <div className={`flex items-center gap-4 flex-1 ${cropMode ? 'pointer-events-none opacity-50' : ''}`}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded"
                title="Zoom Out"
              >
                <ZoomOut size={18} />
              </button>
              <span className="text-sm w-16 text-center">{(zoom * 100).toFixed(0)}%</span>
              <button
                onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded"
                title="Zoom In"
              >
                <ZoomIn size={18} />
              </button>
              <button
                onClick={() => setZoom(1)}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                title="Reset Zoom"
              >
                Reset Zoom
              </button>
            </div>
          </div>
          
          {cropMode && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 mr-2">Hold <strong>Shift</strong> to maintain ratio</span>
              <button
                onClick={applyCrop}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium"
              >
                <Check size={18} />
                Apply Crop
              </button>
              <button
                onClick={cancelCrop}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium"
              >
                <X size={18} />
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 flex items-center justify-center p-8 overflow-auto" onMouseDown={(e) => {
          if (e.target === e.currentTarget && !cropMode) {
            setSelectedLayer(null);
          }
        }}>
          <div className="relative" style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}>
            {canvasSettings.showRulers && (
              <>
                <div 
                  className="absolute -top-6 left-0 h-6 bg-gray-800 border-b border-gray-600 flex items-end text-xs text-gray-400"
                  style={{ width: `${canvasSettings.width}px` }}
                >
                  {Array.from({ length: Math.floor(canvasSettings.width / 100) + 1 }, (_, i) => (
                    <div key={i} className="relative" style={{ width: `100px` }}>
                      <span className="absolute left-0 bottom-0 px-1">{i * 100}</span>
                      <div className="absolute bottom-0 left-0 w-px h-2 bg-gray-500"></div>
                    </div>
                  ))}
                </div>
                <div 
                  className="absolute -left-6 top-0 w-6 bg-gray-800 border-r border-gray-600 text-xs text-gray-400"
                  style={{ height: `${canvasSettings.height}px` }}
                >
                  {Array.from({ length: Math.floor(canvasSettings.height / 100) + 1 }, (_, i) => (
                    <div key={i} className="relative" style={{ height: `100px` }}>
                      <span className="absolute top-0 left-0 px-1 transform -rotate-90 origin-top-left whitespace-nowrap" style={{ transformOrigin: '0 0' }}>{i * 100}</span>
                      <div className="absolute top-0 left-4 h-px w-2 bg-gray-500"></div>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            <canvas
              ref={canvasRef}
              width={canvasSettings.width}
              height={canvasSettings.height}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              onWheel={(e) => {
                if (!cropMode) {
                  e.preventDefault();
                  const delta = e.deltaY > 0 ? -0.1 : 0.1;
                  setZoom(Math.max(0.1, Math.min(3, zoom + delta)));
                }
              }}
              className="border border-gray-700 shadow-2xl cursor-crosshair"
            />
          </div>
        </div>
      </div>

      {selectedLayerData ? (
        <div className="w-80 bg-gray-800 overflow-y-auto relative">
          <div className={`p-4 ${cropMode ? 'pointer-events-none opacity-50' : ''}`}>
            <h2 className="text-xl font-bold mb-4">Properties</h2>
          
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs mb-1">X</label>
                <input
                  type="number"
                  value={Math.round(selectedLayerData.x)}
                  onChange={(e) => updateLayer(selectedLayer, { x: +e.target.value })}
                  className="w-full bg-gray-700 px-2 py-1 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs mb-1">Y</label>
                <input
                  type="number"
                  value={Math.round(selectedLayerData.y)}
                  onChange={(e) => updateLayer(selectedLayer, { y: +e.target.value })}
                  className="w-full bg-gray-700 px-2 py-1 rounded text-sm"
                />
              </div>
            </div>
          </div>

          {selectedLayerData.type === 'image' && (
            <>
              <div className="mb-4">
                <label className="block text-sm mb-2 font-semibold">Image Controls</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    onClick={() => flipLayer(true)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                  >
                    <FlipHorizontal size={16} />
                    Flip H
                  </button>
                  <button
                    onClick={() => flipLayer(false)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                  >
                    <FlipVertical size={16} />
                    Flip V
                  </button>
                </div>
                
                {!cropMode && (
                  <button
                    onClick={startCropMode}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-sm"
                  >
                    <Crop size={16} />
                    Start Crop
                  </button>
                )}
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm">Brightness: {selectedLayerData.brightness}%</label>
                  <button
                    onClick={() => updateLayer(selectedLayer, { brightness: 100 })}
                    className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
                    title="Reset Brightness"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={selectedLayerData.brightness}
                  onChange={(e) => updateLayer(selectedLayer, { brightness: +e.target.value })}
                  className="w-full"
                />
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm">Contrast: {selectedLayerData.contrast}%</label>
                  <button
                    onClick={() => updateLayer(selectedLayer, { contrast: 100 })}
                    className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
                    title="Reset Contrast"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={selectedLayerData.contrast}
                  onChange={(e) => updateLayer(selectedLayer, { contrast: +e.target.value })}
                  className="w-full"
                />
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm">Saturation: {selectedLayerData.saturation}%</label>
                  <button
                    onClick={() => updateLayer(selectedLayer, { saturation: 100 })}
                    className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
                    title="Reset Saturation"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={selectedLayerData.saturation}
                  onChange={(e) => updateLayer(selectedLayer, { saturation: +e.target.value })}
                  className="w-full"
                />
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm">Hue: {selectedLayerData.hue}°</label>
                  <button
                    onClick={() => updateLayer(selectedLayer, { hue: 0 })}
                    className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
                    title="Reset Hue"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={selectedLayerData.hue}
                  onChange={(e) => updateLayer(selectedLayer, { hue: +e.target.value })}
                  className="w-full"
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm mb-1">Filter</label>
                <select
                  value={selectedLayerData.filter}
                  onChange={(e) => updateLayer(selectedLayer, { filter: e.target.value })}
                  className="w-full bg-gray-700 px-2 py-1 rounded text-sm"
                >
                  {Object.entries(IMAGE_FILTERS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm">Rotation: {selectedLayerData.rotation}°</label>
                  <button
                    onClick={() => updateLayer(selectedLayer, { rotation: 0 })}
                    className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
                    title="Reset Rotation"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={selectedLayerData.rotation}
                  onChange={(e) => updateLayer(selectedLayer, { rotation: +e.target.value })}
                  className="w-full"
                />
                <button
                  onClick={rotateLayer}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm mt-2"
                >
                  <RotateCw size={16} />
                  Rotate 90°
                </button>
              </div>
            </>
          )}

          {selectedLayerData.type === 'text' && (
            <>
              <div className="mb-3">
                <label className="block text-sm mb-1">Text</label>
                <textarea
                  value={selectedLayerData.text}
                  onChange={(e) => updateLayer(selectedLayer, { text: e.target.value })}
                  className="w-full bg-gray-700 px-2 py-1 rounded resize-none"
                  rows="3"
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm mb-1">Font Size</label>
                <input
                  type="number"
                  value={selectedLayerData.fontSize}
                  onChange={(e) => updateLayer(selectedLayer, { fontSize: +e.target.value })}
                  className="w-full bg-gray-700 px-2 py-1 rounded"
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm mb-1">Font Family</label>
                <select
                  value={selectedLayerData.fontFamily}
                  onChange={(e) => updateLayer(selectedLayer, { fontFamily: e.target.value })}
                  className="w-full bg-gray-700 px-2 py-1 rounded text-sm"
                >
                  <option value="Arial">Arial</option>
                  <option value="Impact">Impact</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Verdana">Verdana</option>
                  <option value="'Roboto', sans-serif">Roboto</option>
                  <option value="'Open Sans', sans-serif">Open Sans</option>
                  <option value="'Montserrat', sans-serif">Montserrat</option>
                  <option value="'Oswald', sans-serif">Oswald</option>
                  <option value="'Bebas Neue', cursive">Bebas Neue</option>
                  <option value="'Pacifico', cursive">Pacifico</option>
                  <option value="'Bangers', cursive">Bangers</option>
                  <option value="'Permanent Marker', cursive">Permanent Marker</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="block text-sm mb-1">Text Effect</label>
                <select
                  value={selectedLayerData.textEffect || 'none'}
                  onChange={(e) => updateLayer(selectedLayer, { textEffect: e.target.value })}
                  className="w-full bg-gray-700 px-2 py-1 rounded text-sm"
                >
                  <option value="none">Solid Color</option>
                  <option value="gradient">Gradient</option>
                </select>
              </div>

              {selectedLayerData.textEffect === 'none' || !selectedLayerData.textEffect ? (
                <div className="mb-3">
                  <label className="block text-sm mb-1">Text Color</label>
                  <input
                    type="color"
                    value={selectedLayerData.color}
                    onChange={(e) => updateLayer(selectedLayer, { color: e.target.value })}
                    className="w-full h-8 bg-gray-700 rounded cursor-pointer"
                  />
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <label className="block text-sm mb-1">Gradient Start</label>
                    <input
                      type="color"
                      value={selectedLayerData.gradientStart || selectedLayerData.color}
                      onChange={(e) => updateLayer(selectedLayer, { gradientStart: e.target.value })}
                      className="w-full h-8 bg-gray-700 rounded cursor-pointer"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm mb-1">Gradient End</label>
                    <input
                      type="color"
                      value={selectedLayerData.gradientEnd || '#ff0000'}
                      onChange={(e) => updateLayer(selectedLayer, { gradientEnd: e.target.value })}
                      className="w-full h-8 bg-gray-700 rounded cursor-pointer"
                    />
                  </div>
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm">Gradient Angle: {selectedLayerData.gradientAngle || 0}°</label>
                      <button
                        onClick={() => updateLayer(selectedLayer, { gradientAngle: 0 })}
                        className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
                        title="Reset Gradient Angle"
                      >
                        <RotateCcw size={14} />
                      </button>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={selectedLayerData.gradientAngle || 0}
                      onChange={(e) => updateLayer(selectedLayer, { gradientAngle: +e.target.value })}
                      className="w-full"
                    />
                  </div>
                </>
              )}

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm">Stroke Width: {selectedLayerData.strokeWidth || 0}px</label>
                  <button
                    onClick={() => updateLayer(selectedLayer, { strokeWidth: 0 })}
                    className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
                    title="Reset Stroke Width"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={selectedLayerData.strokeWidth || 0}
                  onChange={(e) => updateLayer(selectedLayer, { strokeWidth: +e.target.value })}
                  className="w-full"
                />
              </div>
              {selectedLayerData.strokeWidth > 0 && (
                <div className="mb-3">
                  <label className="block text-sm mb-1">Stroke Color</label>
                  <input
                    type="color"
                    value={selectedLayerData.strokeColor || '#000000'}
                    onChange={(e) => updateLayer(selectedLayer, { strokeColor: e.target.value })}
                    className="w-full h-8 bg-gray-700 rounded cursor-pointer"
                  />
                </div>
              )}

              <div className="mb-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedLayerData.bold}
                    onChange={(e) => updateLayer(selectedLayer, { bold: e.target.checked })}
                  />
                  <span className="text-sm">Bold</span>
                </label>
              </div>
              
              <div className="mb-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedLayerData.italic}
                    onChange={(e) => updateLayer(selectedLayer, { italic: e.target.checked })}
                  />
                  <span className="text-sm">Italic</span>
                </label>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm">Rotation: {selectedLayerData.rotation || 0}°</label>
                  <button
                    onClick={() => updateLayer(selectedLayer, { rotation: 0 })}
                    className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
                    title="Reset Rotation"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={selectedLayerData.rotation || 0}
                  onChange={(e) => updateLayer(selectedLayer, { rotation: +e.target.value })}
                  className="w-full"
                />
                <button
                  onClick={rotateLayer}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm mt-2"
                >
                  <RotateCw size={16} />
                  Rotate 90°
                </button>
              </div>
            </>
          )}

          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm">Opacity: {selectedLayerData.opacity.toFixed(2)}</label>
              <button
                onClick={() => updateLayer(selectedLayer, { opacity: 1 })}
                className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
                title="Reset Opacity"
              >
                <RotateCcw size={14} />
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={selectedLayerData.opacity}
              onChange={(e) => updateLayer(selectedLayer, { opacity: +e.target.value })}
              className="w-full"
            />
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm">Blur: {selectedLayerData.blur}px</label>
              <button
                onClick={() => updateLayer(selectedLayer, { blur: 0 })}
                className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
                title="Reset Blur"
              >
                <RotateCcw size={14} />
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={selectedLayerData.blur}
              onChange={(e) => updateLayer(selectedLayer, { blur: +e.target.value })}
              className="w-full"
            />
          </div>

          {selectedLayerData.type === 'image' && (
            <>
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm">Border Width: {selectedLayerData.border.width}px</label>
                  <button
                    onClick={() => updateLayer(selectedLayer, { 
                      border: { ...selectedLayerData.border, width: 0 }
                    })}
                    className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
                    title="Reset Border Width"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={selectedLayerData.border.width}
                  onChange={(e) => updateLayer(selectedLayer, { 
                    border: { ...selectedLayerData.border, width: +e.target.value }
                  })}
                  className="w-full"
                />
              </div>
              {selectedLayerData.border.width > 0 && (
                <div className="mb-3">
                  <label className="block text-sm mb-1">Border Color</label>
                  <input
                    type="color"
                    value={selectedLayerData.border.color}
                    onChange={(e) => updateLayer(selectedLayer, { 
                      border: { ...selectedLayerData.border, color: e.target.value }
                    })}
                    className="w-full h-8 bg-gray-700 rounded cursor-pointer"
                  />
                </div>
              )}
            </>
          )}

          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm">Shadow Blur: {selectedLayerData.shadow.blur}px</label>
              <button
                onClick={() => updateLayer(selectedLayer, { 
                  shadow: { ...selectedLayerData.shadow, blur: 0 }
                })}
                className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
                title="Reset Shadow Blur"
              >
                <RotateCcw size={14} />
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={selectedLayerData.shadow.blur}
              onChange={(e) => updateLayer(selectedLayer, { 
                shadow: { ...selectedLayerData.shadow, blur: +e.target.value }
              })}
              className="w-full"
            />
          </div>
          {selectedLayerData.shadow.blur > 0 && (
            <>
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm">Shadow Offset X: {selectedLayerData.shadow.offsetX}px</label>
                  <button
                    onClick={() => updateLayer(selectedLayer, { 
                      shadow: { ...selectedLayerData.shadow, offsetX: 0 }
                    })}
                    className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
                    title="Reset Shadow Offset X"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={selectedLayerData.shadow.offsetX}
                  onChange={(e) => updateLayer(selectedLayer, { 
                    shadow: { ...selectedLayerData.shadow, offsetX: +e.target.value }
                  })}
                  className="w-full"
                />
              </div>
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm">Shadow Offset Y: {selectedLayerData.shadow.offsetY}px</label>
                  <button
                    onClick={() => updateLayer(selectedLayer, { 
                      shadow: { ...selectedLayerData.shadow, offsetY: 0 }
                    })}
                    className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
                    title="Reset Shadow Offset Y"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={selectedLayerData.shadow.offsetY}
                  onChange={(e) => updateLayer(selectedLayer, { 
                    shadow: { ...selectedLayerData.shadow, offsetY: +e.target.value }
                  })}
                  className="w-full"
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm mb-1">Shadow Color</label>
                <input
                  type="color"
                  value={selectedLayerData.shadow.color}
                  onChange={(e) => updateLayer(selectedLayer, { 
                    shadow: { ...selectedLayerData.shadow, color: e.target.value }
                  })}
                  className="w-full h-8 bg-gray-700 rounded cursor-pointer"
                />
              </div>
            </>
          )}
          </div>
        </div>
      ) : (
        <div className={`w-80 bg-gray-800 p-4 overflow-y-auto ${cropMode ? 'pointer-events-none opacity-50' : ''}`}>
          <h2 className="text-xl font-bold mb-4">Canvas Settings</h2>

          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Canvas Presets</label>
              <select
                onChange={(e) => {
                  const [w, h] = e.target.value.split('x').map(Number);
                  if (w && h) {
                    setCanvasSettings({...canvasSettings, width: w, height: h});
                  }
                }}
                className="w-full bg-gray-700 px-2 py-1 rounded text-sm"
                value={`${canvasSettings.width}x${canvasSettings.height}`}
              >
                <option value="1280x720">YouTube (1280x720)</option>
                <option value="1080x1080">Instagram Square (1080x1080)</option>
                <option value="1080x1920">Instagram Story (1080x1920)</option>
                <option value="1200x628">Facebook Post (1200x628)</option>
                <option value="1024x512">Twitter Header (1024x512)</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-sm mb-1">Width</label>
                <input
                  type="number"
                  value={canvasSettings.width}
                  onChange={(e) => setCanvasSettings({...canvasSettings, width: +e.target.value})}
                  className="w-full bg-gray-700 px-2 py-1 rounded"
                />
              </div>
              
              <button
                onClick={swapDimensions}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 rounded"
                title="Swap Width and Height"
              >
                <ArrowRightLeft size={18} />
              </button>
              
              <div className="flex-1">
                <label className="block text-sm mb-1">Height</label>
                <input
                  type="number"
                  value={canvasSettings.height}
                  onChange={(e) => setCanvasSettings({...canvasSettings, height: +e.target.value})}
                  className="w-full bg-gray-700 px-2 py-1 rounded"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">Background Type</label>
              <select
                value={canvasSettings.bgType || 'solid'}
                onChange={(e) => setCanvasSettings({...canvasSettings, bgType: e.target.value})}
                className="w-full bg-gray-700 px-2 py-1 rounded text-sm"
              >
                <option value="solid">Solid Color</option>
                <option value="gradient">Gradient</option>
              </select>
            </div>

            {canvasSettings.bgType === 'solid' ? (
              <div>
                <label className="block text-sm mb-1">Background Color</label>
                <input
                  type="color"
                  value={canvasSettings.bgColor}
                  onChange={(e) => setCanvasSettings({...canvasSettings, bgColor: e.target.value})}
                  className="w-full h-8 bg-gray-700 rounded cursor-pointer"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm mb-1">Gradient Start</label>
                  <input
                    type="color"
                    value={canvasSettings.bgGradientStart || canvasSettings.bgColor}
                    onChange={(e) => setCanvasSettings({...canvasSettings, bgGradientStart: e.target.value})}
                    className="w-full h-8 bg-gray-700 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Gradient End</label>
                  <input
                    type="color"
                    value={canvasSettings.bgGradientEnd || '#ffffff'}
                    onChange={(e) => setCanvasSettings({...canvasSettings, bgGradientEnd: e.target.value})}
                    className="w-full h-8 bg-gray-700 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm">Gradient Angle: {canvasSettings.bgGradientAngle || 0}°</label>
                    <button
                      onClick={() => setCanvasSettings({...canvasSettings, bgGradientAngle: 0})}
                      className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
                      title="Reset Gradient Angle"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={canvasSettings.bgGradientAngle || 0}
                    onChange={(e) => setCanvasSettings({...canvasSettings, bgGradientAngle: +e.target.value})}
                    className="w-full"
                  />
                </div>
              </>
            )}
            
            <div>
              <label className="block text-sm mb-1">Background Image</label>
              {canvasSettings.bgImage ? (
                <div className="space-y-2">
                  <button
                    onClick={removeBackgroundImage}
                    className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
                  >
                    Remove Background Image
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded cursor-pointer text-sm">
                  <ImagePlus size={16} />
                  Upload Image
                  <input type="file" accept="image/*" onChange={uploadBackgroundImage} className="hidden" />
                </label>
              )}
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm">Background Opacity: {canvasSettings.bgOpacity.toFixed(2)}</label>
                <button
                  onClick={() => setCanvasSettings({...canvasSettings, bgOpacity: 1})}
                  className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
                  title="Reset Background Opacity"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={canvasSettings.bgOpacity}
                onChange={(e) => setCanvasSettings({...canvasSettings, bgOpacity: +e.target.value})}
                className="w-full"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm">Background Blur: {canvasSettings.bgBlur}px</label>
                <button
                  onClick={() => setCanvasSettings({...canvasSettings, bgBlur: 0})}
                  className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
                  title="Reset Background Blur"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={canvasSettings.bgBlur}
                onChange={(e) => setCanvasSettings({...canvasSettings, bgBlur: +e.target.value})}
                className="w-full"
              />
            </div>

            <div className="border-t border-gray-700 pt-3 mt-3">
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={canvasSettings.showGrid}
                  onChange={(e) => setCanvasSettings({...canvasSettings, showGrid: e.target.checked})}
                />
                <span className="text-sm">Show Grid</span>
              </label>
              {canvasSettings.showGrid && (
                <>
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs">Grid Size: {canvasSettings.gridSize}px</label>
                      <button
                        onClick={() => setCanvasSettings({...canvasSettings, gridSize: 20})}
                        className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
                        title="Reset Grid Size"
                      >
                        <RotateCcw size={12} />
                      </button>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="10"
                      value={canvasSettings.gridSize}
                      onChange={(e) => setCanvasSettings({...canvasSettings, gridSize: +e.target.value})}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Grid Color</label>
                    <input
                      type="color"
                      value={canvasSettings.gridColor || '#444444'}
                      onChange={(e) => setCanvasSettings({...canvasSettings, gridColor: e.target.value})}
                      className="w-full h-6 bg-gray-700 rounded cursor-pointer"
                    />
                  </div>
                </>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={canvasSettings.showRulers}
                  onChange={(e) => setCanvasSettings({...canvasSettings, showRulers: e.target.checked})}
                />
                <span className="text-sm">Show Rulers</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
