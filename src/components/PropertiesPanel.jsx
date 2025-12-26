import React from 'react';
import { FlipHorizontal, FlipVertical, Crop, RotateCcw } from 'lucide-react';
import { IMAGE_FILTERS } from '../constants';

export default function PropertiesPanel({
  selectedLayerData,
  selectedLayer,
  cropMode,
  deleteConfirmation,
  updateLayer,
  flipLayer,
  startCropMode
}) {
  if (!selectedLayerData) return null;

  return (
    <div className="w-80 bg-gray-800 overflow-y-auto relative">
      <div className={`p-4 ${cropMode || deleteConfirmation ? 'pointer-events-none opacity-50' : ''}`}>
        <h2 className="text-xl font-bold mb-4">Properties</h2>

      {/* Position */}
      <div className="mb-4 pb-4 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-gray-400 mb-2">POSITION</h3>
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
          {/* Image Controls */}
          <div className="mb-4 pb-4 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">IMAGE CONTROLS</h3>
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

          {/* Color Adjustments */}
          <div className="mb-4 pb-4 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">COLOR ADJUSTMENTS</h3>

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

            <div className="mb-0">
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
          </div>

          {/* Transform */}
          <div className="mb-4 pb-4 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">3D ROTATION</h3>

            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm">X-axis (Tilt): {selectedLayerData.rotateX || 0}°</label>
                <button
                  onClick={() => updateLayer(selectedLayer, { rotateX: 0 })}
                  className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
                  title="Reset X-axis"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={selectedLayerData.rotateX || 0}
                onChange={(e) => updateLayer(selectedLayer, { rotateX: +e.target.value })}
                className="w-full"
              />
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm">Y-axis (Pan): {selectedLayerData.rotateY || 0}°</label>
                <button
                  onClick={() => updateLayer(selectedLayer, { rotateY: 0 })}
                  className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
                  title="Reset Y-axis"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={selectedLayerData.rotateY || 0}
                onChange={(e) => updateLayer(selectedLayer, { rotateY: +e.target.value })}
                className="w-full"
              />
            </div>

            <div className="mb-0">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm">Z-axis (Rotation): {selectedLayerData.rotateZ || 0}°</label>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateLayer(selectedLayer, { rotateZ: ((selectedLayerData.rotateZ || 0) + 90) % 360 })}
                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs font-semibold"
                    title="Rotate 90°"
                  >
                    90°
                  </button>
                  <button
                    onClick={() => updateLayer(selectedLayer, { rotateZ: 0 })}
                    className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
                    title="Reset Z-axis"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={selectedLayerData.rotateZ || 0}
                onChange={(e) => updateLayer(selectedLayer, { rotateZ: +e.target.value })}
                className="w-full"
              />
            </div>
          </div>
        </>
      )}

      {selectedLayerData.type === 'text' && (
        <>
          {/* Text Content */}
          <div className="mb-4 pb-4 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">TEXT CONTENT</h3>
            <div className="mb-3">
              <label className="block text-sm mb-1">Text</label>
              <textarea
                value={selectedLayerData.text}
                onChange={(e) => updateLayer(selectedLayer, { text: e.target.value })}
                className="w-full bg-gray-700 px-2 py-1 rounded resize-none"
                rows="3"
              />
            </div>
          </div>

          {/* Typography */}
          <div className="mb-4 pb-4 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">TYPOGRAPHY</h3>

            <div className="mb-3">
              <label className="block text-sm mb-1">Font Family</label>
              <select
                value={selectedLayerData.fontFamily}
                onChange={(e) => updateLayer(selectedLayer, { fontFamily: e.target.value })}
                className="w-full bg-gray-700 px-2 py-1 rounded text-sm"
              >
                <option value="Impact, 'Arial Black', sans-serif">Impact</option>
                <option value="'Anton', sans-serif">Anton</option>
                <option value="'Bebas Neue', sans-serif">Bebas Neue</option>
                <option value="'Oswald', sans-serif">Oswald</option>
                <option value="'Montserrat', sans-serif">Montserrat</option>
                <option value="'League Spartan', sans-serif">League Spartan</option>
                <option value="'Roboto Condensed', sans-serif">Roboto Condensed</option>
                <option value="'Luckiest Guy', sans-serif">Luckiest Guy</option>
                <option value="'Permanent Marker', cursive">Permanent Marker</option>
                <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                <option value="'Noto Sans Thai', sans-serif">Noto Sans Thai</option>
                <option value="'Sarabun', sans-serif">Sarabun (Thai)</option>
                <option value="'Arial Black', sans-serif">Arial Black</option>
              </select>
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

            <div className="mb-0 grid grid-cols-3 gap-2">
              <label className="flex items-center justify-center gap-1 cursor-pointer bg-gray-700 hover:bg-gray-600 px-2 py-2 rounded">
                <input
                  type="checkbox"
                  checked={selectedLayerData.bold}
                  onChange={(e) => updateLayer(selectedLayer, { bold: e.target.checked })}
                  className="hidden"
                />
                <span className={`text-lg font-bold ${selectedLayerData.bold ? 'text-blue-400' : 'text-gray-400'}`}>B</span>
              </label>
              <label className="flex items-center justify-center gap-1 cursor-pointer bg-gray-700 hover:bg-gray-600 px-2 py-2 rounded">
                <input
                  type="checkbox"
                  checked={selectedLayerData.italic}
                  onChange={(e) => updateLayer(selectedLayer, { italic: e.target.checked })}
                  className="hidden"
                />
                <span className={`text-lg italic font-serif ${selectedLayerData.italic ? 'text-blue-400' : 'text-gray-400'}`}>I</span>
              </label>
              <label className="flex items-center justify-center gap-1 cursor-pointer bg-gray-700 hover:bg-gray-600 px-2 py-2 rounded">
                <input
                  type="checkbox"
                  checked={selectedLayerData.underline || false}
                  onChange={(e) => updateLayer(selectedLayer, { underline: e.target.checked })}
                  className="hidden"
                />
                <span className={`text-lg underline ${selectedLayerData.underline ? 'text-blue-400' : 'text-gray-400'}`}>U</span>
              </label>
            </div>
          </div>

          {/* Text Style */}
          <div className="mb-4 pb-4 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">TEXT STYLE</h3>

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
              <div className="mb-0">
                <label className="block text-sm mb-1">Stroke Color</label>
                <input
                  type="color"
                  value={selectedLayerData.strokeColor || '#000000'}
                  onChange={(e) => updateLayer(selectedLayer, { strokeColor: e.target.value })}
                  className="w-full h-8 bg-gray-700 rounded cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Transform */}
          <div className="mb-4 pb-4 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">3D ROTATION</h3>

            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm">X-axis (Tilt): {selectedLayerData.rotateX || 0}°</label>
                <button
                  onClick={() => updateLayer(selectedLayer, { rotateX: 0 })}
                  className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
                  title="Reset X-axis"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={selectedLayerData.rotateX || 0}
                onChange={(e) => updateLayer(selectedLayer, { rotateX: +e.target.value })}
                className="w-full"
              />
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm">Y-axis (Pan): {selectedLayerData.rotateY || 0}°</label>
                <button
                  onClick={() => updateLayer(selectedLayer, { rotateY: 0 })}
                  className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
                  title="Reset Y-axis"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={selectedLayerData.rotateY || 0}
                onChange={(e) => updateLayer(selectedLayer, { rotateY: +e.target.value })}
                className="w-full"
              />
            </div>

            <div className="mb-0">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm">Z-axis (Rotation): {selectedLayerData.rotateZ || 0}°</label>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateLayer(selectedLayer, { rotateZ: ((selectedLayerData.rotateZ || 0) + 90) % 360 })}
                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs font-semibold"
                    title="Rotate 90°"
                  >
                    90°
                  </button>
                  <button
                    onClick={() => updateLayer(selectedLayer, { rotateZ: 0 })}
                    className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
                    title="Reset Z-axis"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={selectedLayerData.rotateZ || 0}
                onChange={(e) => updateLayer(selectedLayer, { rotateZ: +e.target.value })}
                className="w-full"
              />
            </div>
          </div>
        </>
      )}

      {/* Appearance */}
      <div className="mb-4 pb-4 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-gray-400 mb-2">APPEARANCE</h3>

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

        <div className="mb-0">
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
      </div>

      {/* Border (Image only) */}
      {selectedLayerData.type === 'image' && (
        <div className="mb-4 pb-4 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">BORDER</h3>

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
            <div className="mb-0">
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
        </div>
      )}

      {/* Shadow */}
      <div className="mb-0">
        <h3 className="text-sm font-semibold text-gray-400 mb-2">SHADOW</h3>

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
            <div className="mb-0">
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
    </div>
  );
}
