import React, { useState } from 'react';
import { X, FolderOpen, Plus, Trash2, MapPin, Calendar, Check, ExternalLink } from 'lucide-react';
import { SavedProject } from '../types/gis';

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: SavedProject[];
  currentProjectId?: string;
  onSelectProject: (project: SavedProject) => void;
  onSaveCurrentMap: (name: string, description: string) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  isOpen,
  onClose,
  projects,
  currentProjectId,
  onSelectProject,
  onSaveCurrentMap,
  onDeleteProject
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [savingLoading, setSavingLoading] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setSavingLoading(true);
    try {
      await onSaveCurrentMap(newProjectName.trim(), newProjectDesc.trim());
      setNewProjectName('');
      setNewProjectDesc('');
      setIsCreating(false);
    } catch (err) {
      console.error('Failed to save project:', err);
    } finally {
      setSavingLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#122436] border border-[#233B54] rounded-lg max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col text-xs text-slate-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#233B54] flex items-center justify-between bg-[#0B1724]">
          <div className="flex items-center space-x-2">
            <FolderOpen className="w-4 h-4 text-[#56E6B2]" />
            <h3 className="font-semibold text-slate-100 text-sm">Saved Projects & Terrain Studies</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Top Actions: Save Current Map */}
          {!isCreating ? (
            <div className="flex justify-between items-center bg-[#182C42] p-3 rounded border border-[#233B54]">
              <div>
                <p className="font-semibold text-slate-100 text-xs">Save Current Workspace</p>
                <p className="text-[11px] text-slate-400">
                  Saves current viewport, center coordinates, active AOI, contour interval, and layer stack.
                </p>
              </div>
              <button
                onClick={() => setIsCreating(true)}
                className="px-3 py-1.5 bg-[#56E6B2] hover:bg-[#45d4a1] text-[#0B1724] font-semibold rounded flex items-center space-x-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Project</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="bg-[#182C42] p-3 rounded border border-[#56E6B2]/40 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-[#56E6B2] text-xs">New Project Details</span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-[10px] text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-0.5">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sierra Nevada Ridge Survey"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-[#122436] border border-[#233B54] rounded px-2.5 py-1 text-slate-100 text-xs focus:outline-none focus:border-[#56E6B2]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-0.5">Description (optional)</label>
                <textarea
                  rows={2}
                  placeholder="Study area notes, purpose, elevation range..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full bg-[#122436] border border-[#233B54] rounded px-2.5 py-1 text-slate-100 text-xs focus:outline-none focus:border-[#56E6B2]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1 bg-[#122436] hover:bg-[#1A3650] text-slate-300 rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLoading}
                  className="px-3 py-1 bg-[#56E6B2] text-[#0B1724] font-semibold rounded text-xs hover:bg-[#45d4a1]"
                >
                  {savingLoading ? 'Saving...' : 'Save to Database'}
                </button>
              </div>
            </form>
          )}

          {/* Project List */}
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Available Projects ({projects.length})
            </span>

            {projects.map((proj) => {
              const isSelected = currentProjectId === proj.id;
              return (
                <div
                  key={proj.id}
                  className={`p-3 rounded border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#183652] border-[#56E6B2]'
                      : 'bg-[#182C42] border-[#233B54] hover:border-[#38BDF8]/50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-slate-100 text-xs">{proj.name}</h4>
                      {isSelected && (
                        <span className="text-[9px] bg-[#56E6B2]/20 text-[#56E6B2] border border-[#56E6B2]/30 px-1 py-0.2 rounded font-mono font-medium">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">{proj.description}</p>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 font-mono pt-1">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-[#56E6B2]" />
                        <span>
                          {proj.center[1].toFixed(3)}°N, {proj.center[0].toFixed(3)}°E (Zoom {proj.zoom})
                        </span>
                      </span>
                      <span>Contour: {proj.contourSettings.interval}m</span>
                      <span>Basemap: {proj.basemap}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => {
                        onSelectProject(proj);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-[#1F3D5C] hover:bg-[#284f75] text-[#56E6B2] rounded font-medium text-xs transition-colors flex items-center space-x-1"
                    >
                      <span>Load Study</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => onDeleteProject(proj.id)}
                      title="Delete project"
                      className="p-1.5 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#233B54] bg-[#0B1724] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#182C42] hover:bg-[#223d5a] text-slate-200 rounded font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
