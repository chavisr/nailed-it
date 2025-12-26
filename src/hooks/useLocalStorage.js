import { useEffect } from 'react';
import { loadLayers, loadCanvasSettings, saveLayers, saveCanvasSettings } from '../utils/storage';
import { loadGoogleFonts } from '../utils/fonts';

export const useLocalStorage = (layers, canvasSettings, setLayers, setCanvasSettings) => {
  // Load on mount
  useEffect(() => {
    loadGoogleFonts();

    const savedLayers = loadLayers();
    if (savedLayers.length > 0) {
      setLayers(savedLayers);
    }

    loadCanvasSettings(canvasSettings).then(settings => {
      setCanvasSettings(settings);
    });
  }, []);

  // Save on change
  useEffect(() => {
    saveLayers(layers);
    saveCanvasSettings(canvasSettings);
  }, [layers, canvasSettings]);
};
