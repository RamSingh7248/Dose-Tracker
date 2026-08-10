import React, { useEffect, useState } from 'react';
import { documentApi } from '../services/api';
import { useQueryClient } from '@tanstack/react-query';
import {
  Upload, FileText, Search, Download, Share2, Trash2, X,
  Filter, Eye, LinkIcon, Tag, Folder, FolderPlus, RotateCcw,
  History, ArrowUpDown, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

const DASHBOARD_QUERY_KEY = ['admin-dashboard-stats'];

const TYPE_DETAILS = {
  prescription:      { icon: '💊', label: 'Prescription',      color: '#8b5cf6', badge: 'badge-purple' },
  report:            { icon: '📄', label: 'Medical Report',    color: '#06b6d4', badge: 'badge-cyan' },
  blood_report:      { icon: '🩸', label: 'Blood Report',      color: '#f43f5e', badge: 'badge-red' },
  x_ray:             { icon: '🩻', label: 'X-Ray',             color: '#06b6d4', badge: 'badge-cyan' },
  mri:               { icon: '🧠', label: 'MRI Scan',          color: '#3b82f6', badge: 'badge-blue' },
  ct_scan:           { icon: '⚡', label: 'CT Scan',          color: '#eab308', badge: 'badge-amber' },
  lab_report:        { icon: '🧪', label: 'Lab Report',        color: '#f97316', badge: 'badge-orange' },
  vaccination:       { icon: '💉', label: 'Vaccination Cert',  color: '#10b981', badge: 'badge-emerald' },
  insurance:         { icon: '🛡️', label: 'Insurance Card',    color: '#6366f1', badge: 'badge-indigo' },
  health_certificate:{ icon: '📜', label: 'Health Certificate',color: '#14b8a6', badge: 'badge-teal' },
  discharge_summary: { icon: '📝', label: 'Discharge Summary', color: '#a855f7', badge: 'badge-purple' },
  other:             { icon: '📎', label: 'Other Document',    color: '#94a3b8', badge: 'badge-gray' },
};

export default function HealthVault() {
  const queryClient = useQueryClient();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  
  // Navigation & filters
  const [currentFolder, setCurrentFolder] = useState('General');
  const [viewTrash, setViewTrash] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  
  // Upload and Custom folders
  const [uploadForm, setUploadForm] = useState({ title: '', type: 'other', folder: 'General', tags: '', notes: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [customFolders, setCustomFolders] = useState([]);
  
  // Versions state
  const [selectedDocForVersion, setSelectedDocForVersion] = useState(null);
  const [newVersionFile, setNewVersionFile] = useState(null);
  const [uploadingVersion, setUploadingVersion] = useState(false);

  useEffect(() => { fetchDocs(); }, [currentFolder, viewTrash, filterType, search, sortBy]);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const params = {
        trash: viewTrash ? 'true' : 'false',
        sortBy
      };
      if (currentFolder !== 'all' && !viewTrash) params.folder = currentFolder;
      if (filterType !== 'all') params.type = filterType;
      if (search) params.search = search;
      
      const res = await documentApi.getAll(params);
      setDocs(res.data.data || []);
    } catch { toast.error('Failed to load documents'); }
    finally { setLoading(false); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return toast.error('Please select a file');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', uploadForm.title || selectedFile.name);
      formData.append('type', uploadForm.type);
      formData.append('folder', uploadForm.folder);
      if (uploadForm.tags) {
        formData.append('tags', JSON.stringify(uploadForm.tags.split(',').map(t => t.trim()).filter(Boolean)));
      }
      if (uploadForm.notes) formData.append('notes', uploadForm.notes);

      await documentApi.upload(formData);
      toast.success('Document uploaded successfully');
      setShowUpload(false);
      setSelectedFile(null);
      setUploadForm({ title: '', type: 'other', folder: currentFolder === 'all' ? 'General' : currentFolder, tags: '', notes: '' });
      fetchDocs();
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const handleUploadNewVersion = async (e) => {
    e.preventDefault();
    if (!newVersionFile) return toast.error('Please select a new file version');
    setUploadingVersion(true);
    try {
      const formData = new FormData();
      formData.append('file', newVersionFile);
      
      const res = await documentApi.uploadVersion(selectedDocForVersion._id, formData);
      toast.success('New version uploaded successfully!');
      setSelectedDocForVersion(res.data.data);
      setNewVersionFile(null);
      fetchDocs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload new version');
    } finally {
      setUploadingVersion(false);
    }
  };

  const handleDelete = async (id, permanent = false) => {
    if (permanent && !confirm('Are you sure you want to permanently delete this document? This cannot be restored.')) return;
    if (!permanent && !confirm('Move this document to Trash?')) return;
    try {
      await documentApi.remove(id);
      toast.success(permanent ? 'Document permanently deleted' : 'Document moved to Trash');
      fetchDocs();
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    } catch { toast.error('Failed to delete'); }
  };

  const handleRestore = async (id) => {
    try {
      await documentApi.restore(id);
      toast.success('Document restored from Trash');
      fetchDocs();
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    } catch { toast.error('Failed to restore document'); }
  };

  const handleShare = async (id) => {
    try {
      const res = await documentApi.share(id);
      const link = `${window.location.origin}/api${res.data.shareLink}`;
      await navigator.clipboard.writeText(link);
      toast.success('Share link copied to clipboard!');
      fetchDocs();
    } catch { toast.error('Failed to create share link'); }
  };

  const handleUnshare = async (id) => {
    try {
      await documentApi.unshare(id);
      toast.success('Sharing link revoked');
      fetchDocs();
    } catch { toast.error('Failed to disable sharing'); }
  };

  const handleCreateFolder = () => {
    const name = prompt('Enter new folder name:');
    if (name && name.trim()) {
      const formatted = name.trim();
      if (!customFolders.includes(formatted)) {
        setCustomFolders([...customFolders, formatted]);
        setCurrentFolder(formatted);
        setViewTrash(false);
      }
    }
  };

  // Get active folders from documents + user created folders
  const allFolders = [
    'General',
    ...customFolders,
    ...new Set(docs.map(d => d.folder).filter(f => f && f !== 'General'))
  ];

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">🗄️ Digital Health Vault</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Securely store, organize, share, and track version histories of your medical records</p>
        </div>
        <button className="btn-primary" onClick={() => setShowUpload(true)}>
          <Upload size={16} /> Upload Document
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24 }} className="vault-layout">
        {/* Left Sidebar — Folders & Trash */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="glass-card" style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px 10px', borderBottom: '1px solid var(--border-color)', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>FOLDERS</span>
              <button onClick={handleCreateFolder} style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}>
                <FolderPlus size={14} /> Add
              </button>
            </div>

            {/* Folder Items */}
            <button className={`sidebar-folder-item ${currentFolder === 'all' && !viewTrash ? 'active' : ''}`}
              onClick={() => { setCurrentFolder('all'); setViewTrash(false); }}
              style={folderItemStyle(currentFolder === 'all' && !viewTrash)}>
              <Folder size={15} /> All Documents
            </button>

            {allFolders.map(folder => (
              <button key={folder} className={`sidebar-folder-item ${currentFolder === folder && !viewTrash ? 'active' : ''}`}
                onClick={() => { setCurrentFolder(folder); setViewTrash(false); }}
                style={folderItemStyle(currentFolder === folder && !viewTrash)}>
                <Folder size={15} /> {folder}
              </button>
            ))}

            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 10, paddingTop: 10 }}>
              <button className={`sidebar-folder-item ${viewTrash ? 'active' : ''}`}
                onClick={() => setViewTrash(true)}
                style={folderItemStyle(viewTrash, 'var(--accent-rose)')}>
                <Trash2 size={15} color={viewTrash ? '#ffffff' : 'var(--accent-rose)'} /> Trash Bin
              </button>
            </div>
          </div>
        </div>

        {/* Right Area — Document Browser */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Controls Bar */}
          <div className="glass-card" style={{ padding: 14, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="input-field" placeholder="Search documents, tags, folders..." value={search}
                onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 40, height: 38 }} />
            </div>

            {/* Document Type Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter size={15} color="var(--text-muted)" />
              <select className="input-field" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: 150, height: 38 }}>
                <option value="all">All Types</option>
                {Object.entries(TYPE_DETAILS).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ArrowUpDown size={15} color="var(--text-muted)" />
              <select className="input-field" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width: 160, height: 38 }}>
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="name_asc">Name A-Z</option>
                <option value="name_desc">Name Z-A</option>
                <option value="size_desc">Largest Size</option>
                <option value="size_asc">Smallest Size</option>
              </select>
            </div>
          </div>

          {/* Documents Grid */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>
          ) : docs.length === 0 ? (
            <div className="empty-state glass-card" style={{ padding: 60 }}>
              <div className="empty-state-icon">{viewTrash ? '🗑️' : '📂'}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{viewTrash ? 'Trash is empty' : 'No documents found'}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>
                {viewTrash ? 'Soft-deleted documents will appear here.' : 'Create custom folders and upload records to get started.'}
              </p>
              {!viewTrash && <button className="btn-primary" onClick={() => setShowUpload(true)}><Upload size={14} /> Upload First File</button>}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 16 }}>
              {docs.map(doc => {
                const details = TYPE_DETAILS[doc.type] || TYPE_DETAILS.other;
                return (
                  <div key={doc._id} className="glass-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: doc.isShared ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--border-color)' }}>
                    <div>
                      {/* Badge / Type & Size */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span className={`badge ${details.badge}`} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                          <span>{details.icon}</span> {details.label}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatSize(doc.fileSize)}</span>
                      </div>

                      {/* Title */}
                      <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={doc.title}>
                        {doc.title}
                      </h4>
                      
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
                        📁 {doc.folder} &middot; 📅 {new Date(doc.createdAt).toLocaleDateString()}
                      </div>

                      {/* Notes / Tags */}
                      {doc.notes && <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{doc.notes}</p>}

                      {doc.tags?.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
                          {doc.tags.map(tag => (
                            <span key={tag} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: 'rgba(139,92,246,0.08)', color: 'var(--accent-purple)', border: '1px solid rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Tag size={8} /> {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Panel */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12, display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {!viewTrash ? (
                        <>
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: '5px 8px', fontSize: 11 }} title="Preview">
                            <Eye size={12} /> View
                          </a>
                          <a href={doc.fileUrl} download className="btn-secondary" style={{ padding: '5px 8px', fontSize: 11 }} title="Download">
                            <Download size={12} />
                          </a>
                          <button className="btn-secondary" style={{ padding: '5px 8px', fontSize: 11 }} title="Versions" onClick={() => { setSelectedDocForVersion(doc); setShowVersionModal(true); }}>
                            <History size={12} /> {doc.versions?.length > 0 && `(${doc.versions.length + 1})`}
                          </button>
                          
                          {doc.isShared ? (
                            <button className="btn-secondary" style={{ padding: '5px 8px', fontSize: 11, color: 'var(--accent-emerald)', borderColor: 'rgba(16,185,129,0.3)' }} onClick={() => handleUnshare(doc._id)} title="Disable Sharing">
                              <LinkIcon size={12} /> Shared
                            </button>
                          ) : (
                            <button className="btn-secondary" style={{ padding: '5px 8px', fontSize: 11 }} onClick={() => handleShare(doc._id)} title="Copy share link">
                              <Share2 size={12} /> Share
                            </button>
                          )}
                          
                          <button className="btn-danger" style={{ padding: '5px 8px', fontSize: 11 }} onClick={() => handleDelete(doc._id, false)} title="Move to Trash">
                            <Trash2 size={12} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: 12, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => handleRestore(doc._id)}>
                            <RotateCcw size={12} /> Restore
                          </button>
                          <button className="btn-danger" style={{ padding: '5px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => handleDelete(doc._id, true)}>
                            <Trash2 size={12} /> Delete Permanently
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upload Document Modal */}
      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Outfit', fontSize: 20, fontWeight: 700 }}>Upload Document</h2>
              <button onClick={() => setShowUpload(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: 24, border: '2px dashed var(--border-color)', borderRadius: 12, cursor: 'pointer',
                background: 'rgba(255,255,255,0.02)', transition: 'all 0.2s',
              }}>
                <Upload size={28} color="var(--accent-purple)" style={{ marginBottom: 6 }} />
                <p style={{ fontSize: 13, fontWeight: 600 }}>{selectedFile ? selectedFile.name : 'Choose a file to upload'}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>PDF, Images (JPEG/PNG/WebP), Word (max 10MB)</p>
                <input type="file" accept="image/*,.pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => setSelectedFile(e.target.files[0])} />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Type</label>
                  <select className="input-field" value={uploadForm.type} onChange={e => setUploadForm({ ...uploadForm, type: e.target.value })} style={{ height: 38 }}>
                    <option value="prescription">💊 Prescription</option>
                    <option value="blood_report">🩸 Blood Report</option>
                    <option value="x_ray">🩻 X-Ray</option>
                    <option value="mri">🧠 MRI Scan</option>
                    <option value="ct_scan">⚡ CT Scan</option>
                    <option value="lab_report">🧪 Lab Report</option>
                    <option value="vaccination">💉 Vaccination</option>
                    <option value="insurance">🛡️ Insurance</option>
                    <option value="discharge_summary">📝 Discharge Summary</option>
                    <option value="other">📎 Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Folder</label>
                  <select className="input-field" value={uploadForm.folder} onChange={e => setUploadForm({ ...uploadForm, folder: e.target.value })} style={{ height: 38 }}>
                    {allFolders.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Title</label>
                <input className="input-field" placeholder="e.g. Blood sugar report" value={uploadForm.title} onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })} style={{ height: 38 }} />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Tags (comma separated)</label>
                <input className="input-field" placeholder="e.g. lab, blood-test" value={uploadForm.tags} onChange={e => setUploadForm({ ...uploadForm, tags: e.target.value })} style={{ height: 38 }} />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Notes</label>
                <textarea className="input-field" rows={2} placeholder="Add description notes..." value={uploadForm.notes} onChange={e => setUploadForm({ ...uploadForm, notes: e.target.value })} />
              </div>

              <button className="btn-primary" type="submit" style={{ width: '100%', height: 40 }} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Confirm Upload'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {showVersionModal && selectedDocForVersion && (
        <div className="modal-overlay" onClick={() => { setShowVersionModal(false); setSelectedDocForVersion(null); }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Outfit', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={20} color="var(--accent-purple)" /> Version History
              </h2>
              <button onClick={() => { setShowVersionModal(false); setSelectedDocForVersion(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: 12, borderRadius: 10, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--accent-purple)', marginBottom: 4 }}>CURRENT VERSION</div>
                <div style={{ fontSize: 14, fontWeight: 600, wordBreak: 'break-all' }}>{selectedDocForVersion.originalName}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Uploaded: {new Date(selectedDocForVersion.updatedAt || selectedDocForVersion.createdAt).toLocaleString()} &middot; Size: {formatSize(selectedDocForVersion.fileSize)}
                </div>
                <div style={{ marginTop: 8 }}>
                  <a href={selectedDocForVersion.fileUrl} download className="btn-secondary" style={{ padding: '4px 10px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Download size={10} /> Download Current
                  </a>
                </div>
              </div>

              {selectedDocForVersion.versions?.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>OLDER ARCHIVED VERSIONS</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 150, overflowY: 'auto' }}>
                    {selectedDocForVersion.versions.map((ver, idx) => (
                      <div key={idx} style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ minWidth: 0, flex: 1, marginRight: 10 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, wordBreak: 'break-all', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ver.originalName}>
                            v{idx + 1}: {ver.originalName}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                            {new Date(ver.uploadedAt).toLocaleString()} &middot; {formatSize(ver.fileSize)}
                          </div>
                        </div>
                        <a href={ver.fileUrl} download className="btn-secondary" style={{ padding: '4px 8px', fontSize: 10, flexShrink: 0 }}>
                          <Download size={10} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload New Version Form */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16, marginTop: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>UPLOAD A NEW VERSION</div>
                <form onSubmit={handleUploadNewVersion} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input type="file" accept="image/*,.pdf,.doc,.docx" onChange={e => setNewVersionFile(e.target.files[0])} style={{ fontSize: 12, color: 'var(--text-secondary)' }} />
                  <button className="btn-primary" type="submit" disabled={uploadingVersion} style={{ alignSelf: 'flex-end', padding: '6px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Upload size={12} /> {uploadingVersion ? 'Uploading...' : 'Replace with New Version'}
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .sidebar-folder-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-muted);
          background: none;
          border: none;
          text-align: left;
          width: 100%;
          cursor: pointer;
          transition: all 0.2s;
        }
        .sidebar-folder-item:hover {
          background: rgba(255,255,255,0.02);
          color: var(--text-primary);
        }
        @media (max-width: 768px) {
          .vault-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

// Styling helper
const folderItemStyle = (isActive, activeColor = 'var(--accent-purple)') => ({
  background: isActive ? activeColor : 'none',
  color: isActive ? '#ffffff' : 'var(--text-muted)',
});
