export const applyImageAdjustments = (ctx, layer) => {
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
