'use client'

import { useState, useRef } from 'react'
import { X, Upload, Loader2, FileText } from 'lucide-react'

interface FileUploadModalProps {
  onClose: () => void
  onUploaded: () => void
  entityType: 'deal' | 'company' | 'contact'
  entityId: string
  /** If provided, uploads as a new version of this file instead of a new file */
  versionOfFileId?: string
}

const DOC_TYPES = [
  { value: 'contract', label: 'Contract' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'other', label: 'Other' },
]

export default function FileUploadModal({
  onClose,
  onUploaded,
  entityType,
  entityId,
  versionOfFileId,
}: FileUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [docType, setDocType] = useState('other')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    if (!title) {
      // Pre-fill title from filename (strip extension)
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '')
      setTitle(nameWithoutExt)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) handleFileSelect(droppedFile)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      let uploadUrl: string
      let fileId: string
      let token: string

      if (versionOfFileId) {
        // Upload new version
        const res = await fetch(`/api/files/${versionOfFileId}/new-version`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            original_filename: file.name,
            mime_type: file.type || 'application/octet-stream',
            size_bytes: file.size,
          }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to get upload URL')
        }

        const data = await res.json()
        uploadUrl = data.upload_url
        fileId = data.new_file_id
        token = data.token
      } else {
        // New file upload
        const res = await fetch('/api/files/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title || file.name,
            original_filename: file.name,
            doc_type: docType,
            mime_type: file.type || 'application/octet-stream',
            size_bytes: file.size,
          }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to get upload URL')
        }

        const data = await res.json()
        uploadUrl = data.upload_url
        fileId = data.file_id
        token = data.token
      }

      // Upload file directly to Supabase Storage via signed URL
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      })

      if (!uploadRes.ok) {
        throw new Error('Failed to upload file to storage')
      }

      // Link file to entity (skip if new version — already linked in API)
      if (!versionOfFileId) {
        const linkRes = await fetch('/api/files/link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file_id: fileId,
            entity_type: entityType,
            entity_id: entityId,
          }),
        })

        if (!linkRes.ok) {
          const data = await linkRes.json()
          throw new Error(data.error || 'Failed to link file')
        }
      }

      onUploaded()
    } catch (err: any) {
      setError(err.message || 'Upload failed')
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {versionOfFileId ? 'Upload New Version' : 'Upload File'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-primary-500 bg-primary-50'
                : file
                ? 'border-green-300 bg-green-50'
                : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText size={24} className="text-green-600" />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[250px]">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
            ) : (
              <>
                <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Drag & drop a file here, or <span className="text-primary-600 font-medium">browse</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">Max 50MB</p>
              </>
            )}
          </div>

          {/* Title */}
          {!versionOfFileId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="File title"
                className="input"
              />
            </div>
          )}

          {/* Doc type */}
          {!versionOfFileId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Document Type</label>
              <select value={docType} onChange={(e) => setDocType(e.target.value)} className="input">
                {DOC_TYPES.map(dt => (
                  <option key={dt.value} value={dt.value}>{dt.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={uploading}>
              Cancel
            </button>
            <button type="submit" disabled={!file || uploading} className="btn btn-primary">
              {uploading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} className="mr-2" />
                  {versionOfFileId ? 'Upload Version' : 'Upload'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
