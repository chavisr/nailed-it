import React from 'react';
import { Eye, EyeOff, Trash2, Github } from 'lucide-react';

export default function LayersPanel({
  layers,
  selectedLayer,
  selectedLayers,
  draggedLayer,
  dragOverIndex,
  cropMode,
  deleteConfirmation,
  onLayerSelect,
  onToggleVisibility,
  onDeleteLayer,
  onMoveLayer,
  onDraggedLayerChange,
  onDragOverIndexChange,
  onDeselectAll
}) {
  return (
    <div
      className={`w-64 bg-gray-800 flex flex-col ${cropMode || deleteConfirmation ? 'pointer-events-none opacity-50' : ''}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !cropMode && !deleteConfirmation) {
          onDeselectAll();
        }
      }}
    >
      <div className="p-4 overflow-y-auto flex-1">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Nailed-it
        </h1>
        <p className="text-sm text-gray-400 mb-6">
          Thumbnail Editor
        </p>

        <h2 className="text-xl font-bold mb-3">Layers</h2>
        <div className="space-y-2">
          {layers.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-gray-400 text-sm mb-2">No layers yet</p>
              <p className="text-gray-500 text-xs">Add an image or text to get started</p>
            </div>
          ) : (
            <>
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
                      onDragStart={() => onDraggedLayerChange(actualIndex)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        onDragOverIndexChange(actualIndex);
                      }}
                      onDragLeave={() => onDragOverIndexChange(null)}
                      onDrop={() => {
                        if (draggedLayer !== null) {
                          onMoveLayer(draggedLayer, actualIndex);
                          onDraggedLayerChange(null);
                          onDragOverIndexChange(null);
                        }
                      }}
                      className={`p-2 bg-gray-700 rounded flex items-center gap-2 cursor-move ${
                        selectedLayer === layer.id || selectedLayers.includes(layer.id) ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={(e) => {
                        // Ctrl is pressed: multi-select mode
                        if (e.ctrlKey || e.metaKey) {
                          // Toggle selection
                          if (selectedLayers.includes(layer.id)) {
                            onLayerSelect(layer.id, 'remove-multi', selectedLayer);
                          } else {
                            // Add to selection
                            onLayerSelect(layer.id, 'add-multi', selectedLayer);
                          }
                        } else {
                          // Single select mode
                          onLayerSelect(layer.id, 'single');
                        }
                      }}
                    >
                      <button onClick={(e) => {
                        e.stopPropagation();
                        onToggleVisibility(layer.id);
                      }}>
                        {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <span className="flex-1 text-sm truncate">
                        {layer.type === 'text' ? layer.text : `Image ${layer.id}`}
                      </span>
                      <button onClick={(e) => {
                        e.stopPropagation();
                        // If this layer is part of a multi-selection, delete all selected layers
                        if (selectedLayers.includes(layer.id) && selectedLayers.length > 0) {
                          onDeleteLayer('multiple', selectedLayers);
                        } else {
                          onDeleteLayer('single', [layer.id]);
                        }
                      }}>
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-gray-700">
        <a
          href="https://github.com/chavisr/nailed-it"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
          title="View on GitHub"
        >
          <Github size={18} />
          <span>GitHub</span>
        </a>
      </div>
    </div>
  );
}
