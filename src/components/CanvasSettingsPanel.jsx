import React from 'react';
import { ArrowRightLeft, ImagePlus, RotateCcw } from 'lucide-react';
import { IMAGE_FILTERS } from '../constants';

export default function CanvasSettingsPanel({
  canvasSettings,
  setCanvasSettings,
  cropMode,
  deleteConfirmation,
  swapDimensions,
  uploadBackgroundImage,
  removeBackgroundImage,
  clearAll
}) {
  return (
    <div className={`w-80 bg-gray-800 p-4 overflow-y-auto ${cropMode || deleteConfirmation ? 'pointer-events-none opacity-50' : ''}`}>
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

        {/* Background Image Filters - Only show if background image exists */}
        {canvasSettings.bgImage && (
          <>
            <div className="border-t border-gray-700 pt-3 mt-3">
              <label className="block text-sm mb-2 font-semibold">Background Image Adjustments</label>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm">Brightness: {canvasSettings.bgBrightness}%</label>
                <button
                  onClick={() => setCanvasSettings({...canvasSettings, bgBrightness: 100})}
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
                value={canvasSettings.bgBrightness}
                onChange={(e) => setCanvasSettings({...canvasSettings, bgBrightness: +e.target.value})}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm">Contrast: {canvasSettings.bgContrast}%</label>
                <button
                  onClick={() => setCanvasSettings({...canvasSettings, bgContrast: 100})}
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
                value={canvasSettings.bgContrast}
                onChange={(e) => setCanvasSettings({...canvasSettings, bgContrast: +e.target.value})}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm">Saturation: {canvasSettings.bgSaturation}%</label>
                <button
                  onClick={() => setCanvasSettings({...canvasSettings, bgSaturation: 100})}
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
                value={canvasSettings.bgSaturation}
                onChange={(e) => setCanvasSettings({...canvasSettings, bgSaturation: +e.target.value})}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm">Hue: {canvasSettings.bgHue}°</label>
                <button
                  onClick={() => setCanvasSettings({...canvasSettings, bgHue: 0})}
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
                value={canvasSettings.bgHue}
                onChange={(e) => setCanvasSettings({...canvasSettings, bgHue: +e.target.value})}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Filter</label>
              <select
                value={canvasSettings.bgFilter}
                onChange={(e) => setCanvasSettings({...canvasSettings, bgFilter: e.target.value})}
                className="w-full bg-gray-700 px-2 py-1 rounded text-sm"
              >
                {Object.entries(IMAGE_FILTERS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="mb-3">
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
                  value={canvasSettings.gridColor || '#7D7D7D'}
                  onChange={(e) => setCanvasSettings({...canvasSettings, gridColor: e.target.value})}
                  className="w-full h-6 bg-gray-700 rounded cursor-pointer"
                />
              </div>
            </>
          )}
        </div>

        <div className="border-t border-gray-700 pt-3 mt-3">
          <label className="block text-sm mb-2">Workspace Color</label>
          <input
            type="color"
            value={canvasSettings.workspaceColor || '#374151'}
            onChange={(e) => setCanvasSettings({...canvasSettings, workspaceColor: e.target.value})}
            className="w-full h-8 bg-gray-700 rounded cursor-pointer"
          />
        </div>

        <div className="border-t border-gray-700 pt-3 mt-3">
          <button
            onClick={clearAll}
            className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium"
          >
            Clear All
          </button>
          <p className="text-xs text-gray-500 mt-1 text-center">Remove all layers and reset canvas</p>
        </div>
      </div>
    </div>
  );
}
