import React from 'react';
import { ImagePlus, Type, Download, ZoomIn, ZoomOut, Trash2, Check, X } from 'lucide-react';

export default function Toolbar({
  zoom,
  selectedLayer,
  selectedLayers,
  cropMode,
  deleteConfirmation,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onExportProject,
  onImportProject,
  onAddImage,
  onAddText,
  onExportImage,
  onDeleteSelected,
  onApplyCrop,
  onCancelCrop,
  onConfirmDelete,
  onCancelDelete,
  onDeselectAll
}) {
  return (
    <div
      className="p-4 bg-gray-800 flex items-center gap-4 border-b border-gray-700"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !cropMode && !deleteConfirmation) {
          onDeselectAll();
        }
      }}
    >
      <div className={`flex items-center gap-2 ${cropMode || deleteConfirmation ? 'pointer-events-none opacity-50' : ''}`}>
        <button
          onClick={onExportProject}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded text-sm"
          title="Save Project"
        >
          <Download size={16} />
          <span className="text-xs">Save</span>
        </button>
        <label
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded cursor-pointer text-sm"
          title="Load Project"
        >
          <ImagePlus size={16} />
          <span className="text-xs">Load</span>
          <input type="file" accept=".json" onChange={onImportProject} className="hidden" />
        </label>
      </div>

      <div className="h-6 w-px bg-gray-600"></div>

      <div className={`flex items-center gap-2 ${cropMode || deleteConfirmation ? 'pointer-events-none opacity-50' : ''}`}>
        <label
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded cursor-pointer text-sm"
          title="Add Image"
        >
          <ImagePlus size={18} />
          <input type="file" accept="image/*" onChange={onAddImage} className="hidden" />
        </label>
        <button
          onClick={onAddText}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm"
          title="Add Text"
        >
          <Type size={18} />
        </button>
        <button
          onClick={onExportImage}
          className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded text-sm"
          title="Download PNG"
        >
          <Download size={18} />
        </button>
      </div>

      {(selectedLayer || selectedLayers.length > 0) && !cropMode && !deleteConfirmation && (
        <>
          <div className="h-6 w-px bg-gray-600"></div>
          <div className="flex items-center gap-2">
            <button
              onClick={onDeleteSelected}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm"
              title="Delete Selected Layer(s)"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </>
      )}

      <div className="h-6 w-px bg-gray-600"></div>

      <div className={`flex items-center gap-4 flex-1 ${cropMode || deleteConfirmation ? 'pointer-events-none opacity-50' : ''}`}>
        <div className="flex items-center gap-2">
          <button
            onClick={onZoomOut}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded"
            title="Zoom Out"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-sm w-16 text-center">{(zoom * 100).toFixed(0)}%</span>
          <button
            onClick={onZoomIn}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded"
            title="Zoom In"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={onResetZoom}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            title="Reset Zoom"
          >
            Reset Zoom
          </button>
        </div>
      </div>

      {cropMode && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 mr-2">
            Hold <strong>Shift</strong> to maintain ratio
          </span>
          <button
            onClick={onApplyCrop}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium"
          >
            <Check size={18} />
            Apply Crop
          </button>
          <button
            onClick={onCancelCrop}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium"
          >
            <X size={18} />
            Cancel
          </button>
        </div>
      )}

      {deleteConfirmation && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 mr-2">
            Delete {deleteConfirmation.ids.length} layer{deleteConfirmation.ids.length > 1 ? 's' : ''}?
          </span>
          <button
            onClick={onConfirmDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium"
          >
            <Check size={18} />
            Confirm Delete
          </button>
          <button
            onClick={onCancelDelete}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm font-medium"
          >
            <X size={18} />
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
