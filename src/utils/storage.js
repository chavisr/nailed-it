const STORAGE_KEYS = {
  LAYERS: 'thumbnailEditorLayers',
  CANVAS: 'thumbnailEditorCanvas'
};

export const loadLayers = () => {
  try {
    const savedLayers = localStorage.getItem(STORAGE_KEYS.LAYERS);
    if (savedLayers) {
      const parsedLayers = JSON.parse(savedLayers);
      // Restore image objects
      return parsedLayers.map(layer => {
        if (layer.type === 'image' && layer.imageData) {
          const img = new Image();
          img.src = layer.imageData;
          return { ...layer, image: img };
        }
        return layer;
      });
    }
    return [];
  } catch (error) {
    console.error('Failed to load layers:', error);
    return [];
  }
};

export const loadCanvasSettings = (defaultCanvas) => {
  try {
    const savedCanvas = localStorage.getItem(STORAGE_KEYS.CANVAS);
    if (savedCanvas) {
      const parsedCanvas = JSON.parse(savedCanvas);
      // Restore background image if exists
      if (parsedCanvas.bgImageData) {
        const img = new Image();
        img.src = parsedCanvas.bgImageData;
        return new Promise((resolve) => {
          img.onload = () => {
            resolve({ ...parsedCanvas, bgImage: img });
          };
        });
      }
      return Promise.resolve(parsedCanvas);
    }
    return Promise.resolve(defaultCanvas);
  } catch (error) {
    console.error('Failed to load canvas settings:', error);
    return Promise.resolve(defaultCanvas);
  }
};

export const saveLayers = (layers) => {
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

    localStorage.setItem(STORAGE_KEYS.LAYERS, JSON.stringify(serializableLayers));
  } catch (error) {
    console.error('Failed to save layers:', error);
  }
};

export const saveCanvasSettings = (canvasSettings) => {
  try {
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

    localStorage.setItem(STORAGE_KEYS.CANVAS, JSON.stringify(serializableCanvas));
  } catch (error) {
    console.error('Failed to save canvas settings:', error);
  }
};
