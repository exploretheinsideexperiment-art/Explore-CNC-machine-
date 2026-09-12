import React, { useState, useRef } from 'react';
import {
  FolderOpen,
  FileUp,
  FileCode,
  FileText,
  Trash2,
  Play,
  Download,
  Eye,
  Archive,
  CheckCircle2,
} from 'lucide-react';
import { cncService } from '../cnc/connection';
import JSZip from 'jszip';
import { safeStorage } from '../utils/storage';

interface StoredFile {
  id: string;
  name: string;
  type: 'gcode' | 'txt' | 'pdf' | 'svg';
  size: string;
  content: string;
  createdAt: string;
}

const DEFAULT_SAMPLES: StoredFile[] = [
  {
    id: 'sample-1',
    name: 'Calibration 40mm Square.gcode',
    type: 'gcode',
    size: '1.2 KB',
    content: `G21 ; Millimeters
G90 ; Absolute
M5 ; Pen UP
G0 X10 Y10
M3 ; Pen DOWN
G1 X50 Y10 F600
G1 X50 Y50
G1 X10 Y50
G1 X10 Y10
M5 ; Pen UP
G0 X0 Y0`,
    createdAt: 'Built-in Sample',
  },
  {
    id: 'sample-2',
    name: 'Explore CNC Welcome.txt',
    type: 'txt',
    size: '0.4 KB',
    content: `EXPLORE CNC PLOTTER
DESIGNED FOR ESP32
HIGH PRECISION 2D DRAWING`,
    createdAt: 'Built-in Sample',
  },
  {
    id: 'sample-3',
    name: 'Precision Concentric Circles.gcode',
    type: 'gcode',
    size: '3.8 KB',
    content: `; Concentric circles
G21
G90
M5
G0 X30 Y50
M3
G1 X70 Y50 F500
M5
G0 X0 Y0`,
    createdAt: 'Built-in Sample',
  },
];

export const FileManagerPage: React.FC<{ onJobStarted?: () => void }> = ({ onJobStarted }) => {
  const [files, setFiles] = useState<StoredFile[]>(() => {
    const saved = safeStorage.getItem('explore_cnc_stored_files');
    return saved ? JSON.parse(saved) : DEFAULT_SAMPLES;
  });

  const [selectedFile, setSelectedFile] = useState<StoredFile | null>(files[0] || null);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const saveFiles = (updated: StoredFile[]) => {
    setFiles(updated);
    safeStorage.setItem('explore_cnc_stored_files', JSON.stringify(updated));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;

    const ext = uploaded.name.split('.').pop()?.toLowerCase() || '';
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      const newFile: StoredFile = {
        id: 'file-' + Date.now(),
        name: uploaded.name,
        type: (ext as any) || 'txt',
        size: `${(uploaded.size / 1024).toFixed(1)} KB`,
        content,
        createdAt: new Date().toLocaleDateString(),
      };

      const updated = [newFile, ...files];
      saveFiles(updated);
      setSelectedFile(newFile);
    };

    reader.readAsText(uploaded);
  };

  const handleDelete = (id: string) => {
    const updated = files.filter((f) => f.id !== id);
    saveFiles(updated);
    if (selectedFile?.id === id) {
      setSelectedFile(updated[0] || null);
    }
  };

  const handleSendToMachine = (file: StoredFile) => {
    const lines = file.content.split('\n').filter((l) => l.trim().length > 0);
    cncService.startJob(lines);
    if (onJobStarted) onJobStarted();
  };

  const handleDownloadFile = (file: StoredFile) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export full firmware & docs ZIP bundle
  const handleExportFirmwareBundle = async () => {
    setIsExportingZip(true);
    try {
      const zip = new JSZip();
      const fwFolder = zip.folder('firmware');
      const docsFolder = zip.folder('docs');

      // Fetch or assemble firmware files
      fwFolder?.file('explore_cnc.ino', '// Explore CNC Master Sketch\n#include "config.h"\n// See repository firmware/explore_cnc.ino');
      fwFolder?.file('config.h', '// Hardware Configuration\n#define MOTOR_X_IN1 19\n');
      docsFolder?.file('wiring.md', '# Wiring Guide\nRefer to /docs/wiring.md');
      docsFolder?.file('calibration.md', '# Calibration Guide\nRefer to /docs/calibration.md');

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'explore_cnc_firmware_and_docs.zip';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <div id="file-manager-page" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-cyan-400" />
            <span>File Manager & G-Code Library</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Store, preview, and stream .gcode, .txt, .svg, and .pdf drawing files
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".gcode,.txt,.svg,.nc"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleExportFirmwareBundle}
            disabled={isExportingZip}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <Archive className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isExportingZip ? 'Packing...' : 'Download Firmware ZIP'}</span>
          </button>
          <button
            type="button"
            id="btn-upload-file-manager"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition"
          >
            <FileUp className="w-4 h-4" />
            <span>Upload File</span>
          </button>
        </div>
      </div>

      {/* Grid: Left File List | Right File Preview & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Files Table */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <h3 className="text-xs font-semibold text-slate-200">Stored Files ({files.length})</h3>
            <span className="text-[11px] text-slate-500">.gcode, .txt, .svg</span>
          </div>

          <div className="divide-y divide-slate-800/60 overflow-y-auto max-h-[500px]">
            {files.map((file) => {
              const isSelected = selectedFile?.id === file.id;
              return (
                <div
                  key={file.id}
                  onClick={() => setSelectedFile(file)}
                  className={`px-4 py-3 flex items-center justify-between gap-3 cursor-pointer transition ${
                    isSelected ? 'bg-cyan-950/40 border-l-2 border-cyan-400' : 'hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0 text-cyan-400">
                      {file.type === 'gcode' ? (
                        <FileCode className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-semibold text-slate-200 truncate">{file.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {file.size} • {file.createdAt}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadFile(file);
                      }}
                      title="Download"
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(file.id);
                      }}
                      title="Delete"
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: File Viewer & Stream to Plotter */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          {selectedFile ? (
            <div className="space-y-4 flex flex-col h-full">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">{selectedFile.name}</h3>
                  <p className="text-xs text-slate-400">Size: {selectedFile.size}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSendToMachine(selectedFile)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs shadow-md transition"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Send to Plotter</span>
                </button>
              </div>

              {/* Code / Text Viewer */}
              <div className="flex-1 min-h-[300px] max-h-[440px] bg-slate-950 border border-slate-800 rounded-xl p-3 overflow-y-auto font-mono text-xs text-slate-300">
                <pre>{selectedFile.content}</pre>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <Eye className="w-8 h-8 mb-2 stroke-1" />
              <p className="text-xs">Select a file from the list to preview content or stream to the plotter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
