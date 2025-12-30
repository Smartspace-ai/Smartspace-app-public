import { defaultValueCtx, Editor, editorViewCtx, editorViewOptionsCtx, rootCtx } from '@milkdown/core'
import { clipboard } from '@milkdown/plugin-clipboard'
import { listener, listenerCtx } from '@milkdown/plugin-listener'
import { commonmark } from '@milkdown/preset-commonmark'
import { Slice } from '@milkdown/prose/model'
import type { EditorView } from '@milkdown/prose/view'
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react'
import { useQuery } from '@tanstack/react-query'
//
import type React from 'react'
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import type { MentionUser } from '@/domains/workspaces'
import { taggableUsersOptions } from '@/domains/workspaces'


// Note: Mention plugin is not published under @milkdown/plugin-mention on npm.
// This setup is ready to add a mention-like plugin later if desired.
import { fileTag } from './extensions/fileTag'
import { mention } from './extensions/mention'
import { ssImageNode, ssImageView } from './extensions/ssImage'
import './styles.css'

const initial = [
  '# Milkdown Demo',
  '',
  'Type *Markdown* and see it render live.',
  '',
  'Custom file tag example: ',
  '[[file:123|Project Spec.docx]]',
  '',
  'Mention example: @alice (plugin placeholder)',
].join('\n')

export type MarkdownEditorHandle = {
  addFiles: (files: File[]) => void
  focus: () => void
  /** Clears the editor content (useful when host clears `value`, since Milkdown isn't fully controlled here). */
  clear: () => void
}

export type MarkdownEditorProps = {
  value?: string
  onChange?: (md: string) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  onImagesPasted?: (files: File[]) => void
  onFilesAdded?: (files: File[]) => void
  onUploadFiles?: (files: File[]) => Promise<{ id: string; name: string }[]>
  /**
   * Controls what happens when the user drops files onto the editor surface.
   * - 'inline' (default): upload + insert `ssImage`/`fileTag` nodes into the editor when possible.
   * - 'attachments': do NOT insert into the editor; instead call `onFilesAdded` so the host can manage attachments UI.
   */
  fileHandlingMode?: 'inline' | 'attachments'
  disabled?: boolean
  editable?: boolean
  className?: string
  minHeight?: number | string
  maxHeight?: number | string
  ghostMessage?: string
  placeholder?: string
  workspaceId?: string
  threadId?: string
  enableMentions?: boolean
}

function EditorInner({
  value,
  onChange: _onChange,
  onKeyDown,
  onImagesPasted: _onImagesPasted,
  onFilesAdded: _onFilesAdded,
  onUploadFiles: _onUploadFiles,
  fileHandlingMode = 'inline',
  disabled,
  editable,
  className,
  minHeight,
  maxHeight,
  ghostMessage,
  placeholder,
  workspaceId,
  enableMentions,
  editorHandleRef,
}: {
  value?: MarkdownEditorProps['value']
  onChange?: MarkdownEditorProps['onChange']
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>
  onImagesPasted?: MarkdownEditorProps['onImagesPasted']
  onFilesAdded?: MarkdownEditorProps['onFilesAdded']
  onUploadFiles?: MarkdownEditorProps['onUploadFiles']
  fileHandlingMode?: MarkdownEditorProps['fileHandlingMode']
  disabled?: MarkdownEditorProps['disabled']
  editable?: MarkdownEditorProps['editable']
  className?: MarkdownEditorProps['className']
  minHeight?: MarkdownEditorProps['minHeight']
  maxHeight?: MarkdownEditorProps['maxHeight']
  ghostMessage?: MarkdownEditorProps['ghostMessage']
  placeholder?: MarkdownEditorProps['placeholder']
  workspaceId?: MarkdownEditorProps['workspaceId']
  enableMentions?: MarkdownEditorProps['enableMentions']
  editorHandleRef?: React.ForwardedRef<MarkdownEditorHandle>
}) {
  const initialValueRef = useRef(value ?? initial)
  const isEditable = (editable ?? (disabled != null ? !disabled : true)) === true
  const [isEmpty, setIsEmpty] = useState(
    !initialValueRef.current || initialValueRef.current.replace(/\s+/g, '') === ''
  )
  const [hasFocus, setHasFocus] = useState(false)
  const effectivePlaceholder = placeholder ?? ghostMessage
  const [attachments, setAttachments] = useState<{ url: string; name: string; isImage: boolean }[]>([])
  const previewUrlsRef = useRef<string[]>([])
  const [_isDragging, setIsDragging] = useState(false)
  const viewRef = useRef<EditorView | null>(null)

  function guessImageExt(mime: string) {
    const t = (mime || '').toLowerCase()
    if (t === 'image/jpeg') return 'jpg'
    if (t === 'image/svg+xml') return 'svg'
    const parts = t.split('/')
    return parts[1] || 'png'
  }

  function ensurePastedImageHasNiceName(file: File): File {
    if (!file.type?.startsWith('image/')) return file
    const raw = (file.name || '').trim()
    const looksDefault = !raw || raw === 'image' || raw === 'blob' || raw === 'image.png' || raw === 'image.jpg' || raw === 'image.jpeg'
    if (!looksDefault) return file

    const ext = guessImageExt(file.type)
    const ts = new Date().toISOString().replace(/[:.]/g, '-')
    const nextName = `pasted-image-${ts}.${ext}`
    try {
      return new File([file], nextName, { type: file.type, lastModified: Date.now() })
    } catch {
      return file
    }
  }

  // Mentions UI state
  const [mentionOpen, setMentionOpen] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionFromPos, setMentionFromPos] = useState<number | null>(null)
  const [mentionCoords, setMentionCoords] = useState<{ left: number; top: number; bottom: number }>({
    left: 0,
    top: 0,
    bottom: 0,
  })
  const [mentionIndex, setMentionIndex] = useState(0)
  const [mentionPlacement, setMentionPlacement] = useState<'up' | 'down'>('down')

  // Refs to prevent keyup-driven recalculation from clobbering arrow-key navigation.
  const mentionQueryRef = useRef('')
  const mentionFromPosRef = useRef<number | null>(null)
  const mentionOpenRef = useRef(false)

  useEffect(() => {
    mentionQueryRef.current = mentionQuery
  }, [mentionQuery])
  useEffect(() => {
    mentionFromPosRef.current = mentionFromPos
  }, [mentionFromPos])
  useEffect(() => {
    mentionOpenRef.current = mentionOpen
  }, [mentionOpen])

  // If mentions are disabled, ensure the dropdown is never visible.
  useEffect(() => {
    if (enableMentions) return
    setMentionOpen(false)
    setMentionQuery('')
    setMentionFromPos(null)
    setMentionIndex(0)
  }, [enableMentions])

  const {
    data: usersData = [],
    isLoading: isUsersLoading,
    isFetching: isUsersFetching,
  } = useQuery({
    ...taggableUsersOptions(workspaceId || ''),
    enabled: !!enableMentions && !!workspaceId && (mentionOpen || (mentionQuery ?? '').length > 0),
  }) as unknown as { data: MentionUser[]; isLoading: boolean; isFetching: boolean }

  const mentionCandidates = useMemo(() => {
    if (!enableMentions) return [] as MentionUser[]
    if (!mentionOpen) return [] as MentionUser[]
    const q = mentionQuery.trim().toLowerCase()
    const list = (usersData as MentionUser[]) || []
    if (!q) return list.slice(0, 8)
    return list.filter((u) => u.displayName.toLowerCase().includes(q)).slice(0, 8)
  }, [mentionOpen, mentionQuery, usersData, enableMentions])

  // Debug logs for workspace and users
  useEffect(() => {
    if (!enableMentions) return
    // eslint-disable-next-line no-console
    console.log('[MarkdownEditor] workspaceId:', workspaceId)
  }, [workspaceId, enableMentions])
  useEffect(() => {
    if (!enableMentions) return
    // eslint-disable-next-line no-console
    console.log('[MarkdownEditor] usersData length:', Array.isArray(usersData) ? usersData.length : 'n/a', usersData)
  }, [usersData, enableMentions])
  useEffect(() => {
    if (!enableMentions) return
    // eslint-disable-next-line no-console
    console.log('[MarkdownEditor] mentionOpen:', mentionOpen, 'mentionQuery:', mentionQuery, 'candidates:', mentionCandidates?.length)
  }, [mentionOpen, mentionQuery, mentionCandidates, enableMentions])

  useEffect(() => {
    return () => {
      // cleanup object URLs on unmount
      previewUrlsRef.current.forEach((u) => {
        try {
          URL.revokeObjectURL(u)
        } catch (_err) {
          /* ignore revoke errors */
        }
      })
      previewUrlsRef.current = []
    }
  }, [])

  useEditor((root) => {
    return Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root)
        ctx.set(defaultValueCtx, initialValueRef.current)
        ctx.set(editorViewOptionsCtx, {
          editable: () => isEditable,
        })
        if (_onChange) {
          const lm = ctx.get(listenerCtx)
          lm.markdownUpdated((_ctx, md) => {
            _onChange(md)
          })
        }
        const lm = ctx.get(listenerCtx)
        lm.markdownUpdated((_ctx, md) => {
          setIsEmpty(!md || md.replace(/\s+/g, '') === '')
        })
        lm.focus(() => setHasFocus(true))
        lm.blur(() => setHasFocus(false))
        lm.mounted((c: unknown) => {
          try {
            const anyCtx = c as { get: (t: unknown) => unknown }
            const view = anyCtx.get(editorViewCtx) as EditorView
            viewRef.current = view
            const handle = () => {
              try { if (enableMentions) updateMentionFromView() } catch { /* ignore */ }
            }
            const handleKeyDown = (ev: KeyboardEvent) => {
              if (!enableMentions) return
              if (ev.key === '@') {
                try {
                  const pos = view.state.selection.from
                  const coords = view.coordsAtPos(pos)
                  // eslint-disable-next-line no-console
                  console.log('[MarkdownEditor] @ pressed at pos:', pos, 'coords:', coords)
                  setMentionCoords({ left: coords.left, top: coords.top, bottom: coords.bottom })
                  setMentionPlacement(getMentionPlacement(coords.top))
                  setMentionFromPos(Math.max(0, pos - 1))
                  setMentionQuery('')
                  setMentionIndex(0)
                  setMentionOpen(true)
                } catch { /* ignore */ }
              }
            }
            const dom: HTMLElement = view.dom as unknown as HTMLElement
            dom.addEventListener('keyup', handle)
            dom.addEventListener('click', handle)
            dom.addEventListener('keydown', handleKeyDown)
          } catch {
            /* ignore get view errors */
          }
        })
      })
      .use(commonmark)
      .use(clipboard)
      .use(listener)
      .use(fileTag)
      .use(ssImageNode)
      .use(ssImageView)
      .use(enableMentions ? mention : fileTag)
  }, [isEditable])

  async function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
    try {
      const url = URL.createObjectURL(file)
      const img = new Image()
      const dims = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
        img.onerror = () => reject(new Error('image load failed'))
        img.src = url
      })
      URL.revokeObjectURL(url)
      return dims
    } catch {
      return null
    }
  }

  function clampImageSize(
    width: number,
    height: number,
    maxWidth = 260,
    maxHeight = 180,
  ): { width: number; height: number } {
    const w = Number(width) || 1
    const h = Number(height) || 1
    const scale = Math.min(maxWidth / w, maxHeight / h, 1)
    return {
      width: Math.max(1, Math.round(w * scale)),
      height: Math.max(1, Math.round(h * scale)),
    }
  }

  async function uploadSingleFile(file: File): Promise<{ id: string; name: string } | null> {
    if (!_onUploadFiles) return null
    try {
      const res = await _onUploadFiles([file])
      if (res && res[0]) return { id: res[0].id, name: res[0].name || file.name || 'file' }
      return null
    } catch {
      return null
    }
  }

  function insertTextAtSelection(view: EditorView, text: string) {
    const { from, to } = view.state.selection
    const tr = view.state.tr.insertText(text, from, to)
    view.dispatch(tr.scrollIntoView())
  }

  function insertNodeAtSelection(view: EditorView, node: any) {
    const { from, to } = view.state.selection
    const tr = view.state.tr.replaceWith(from, to, node)
    view.dispatch(tr.scrollIntoView())
  }

  async function insertUploadedFilesIntoEditor(files: File[]) {
    const view = viewRef.current
    if (!isEditable || !view) return false

    try {
      view.focus()
    } catch {
      /* ignore focus errors */
    }

    for (const file of files) {
      const isImage = file.type.startsWith('image/')
      const uploaded = await uploadSingleFile(file)
      const id = uploaded?.id ?? 'local'
      const name = uploaded?.name ?? (file.name || (isImage ? 'image' : 'file'))

      if (isImage) {
        const dims = await getImageDimensions(file)
        const rawW = dims?.width ?? 500
        const rawH = dims?.height ?? 500
        const { width, height } = clampImageSize(rawW, rawH)
        try {
          const type = (view.state.schema.nodes as any)['ssImage']
          if (type) {
            const node = type.create({ fileId: id, alt: name, w: width, h: height })
            insertNodeAtSelection(view, node)
            insertTextAtSelection(view, ' ')
          } else {
            insertTextAtSelection(view, `![${name}](ss-file:${id}?w=${width}&h=${height}) `)
          }
        } catch {
          /* ignore insert errors */
        }
      } else {
        try {
          const type = (view.state.schema.nodes as any)['fileTag']
          if (type) {
            const node = type.create({ id, label: name })
            insertNodeAtSelection(view, node)
            insertTextAtSelection(view, ' ')
          } else {
            insertTextAtSelection(view, `[[file:${id}|${name}]] `)
          }
        } catch {
          /* ignore insert errors */
        }
      }
    }

    return true
  }

  async function handleFiles(files: File[], opts?: { notifyHost?: boolean }) {
    if (!files || files.length === 0) return
    const notifyHost = opts?.notifyHost !== false

    // If we can insert into the editor (focused/imperative add), prefer that over the local preview list.
    // Note: callers (file picker) will focus the editor first via the imperative handle.
    if (isEditable && viewRef.current && _onUploadFiles) {
      const inserted = await insertUploadedFilesIntoEditor(files)
      if (inserted) {
        if (notifyHost && _onFilesAdded) _onFilesAdded(files)
        return
      }
    }

    // Fallback: local-only attachment previews
    const items = files.map((f) => {
      const isImage = f.type.startsWith('image/')
      const url = isImage ? URL.createObjectURL(f) : ''
      const key = `${f.name}:${f.size}:${f.type}`
      if (url) previewUrlsRef.current.push(url)
      return { key, url, name: f.name || 'file', isImage, status: 'uploading' as const }
    })

    setAttachments((prev) => [...prev, ...items])
    if (notifyHost && _onFilesAdded) _onFilesAdded(files)
  }

  useImperativeHandle(
    editorHandleRef ?? null,
    () => ({
      addFiles: (files: File[]) => {
        void handleFiles(files)
      },
      focus: () => {
        try {
          viewRef.current?.focus()
        } catch {
          /* ignore focus errors */
        }
      },
      clear: () => {
        const view = viewRef.current
        if (!view) return
        try {
          const emptyDoc = view.state.schema.topNodeType.createAndFill()
          if (!emptyDoc) return
          const slice = new Slice(emptyDoc.content, 0, 0)

          // Replace the entire document content with the empty doc content.
          // Positions can be a little tricky across PM versions, so we try a safe primary path with a fallback.
          try {
            const tr = view.state.tr.replace(0, view.state.doc.content.size, slice)
            view.dispatch(tr.scrollIntoView())
          } catch {
            // Fallback: common "inside doc" range.
            const from = 1
            const to = Math.max(from, view.state.doc.content.size - 1)
            const tr = view.state.tr.replace(from, to, slice)
            view.dispatch(tr.scrollIntoView())
          }
        } catch {
          /* ignore clear errors */
        }
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isEditable],
  )

  return (
    <div
      className={`md-editor${!isEditable ? ' md-editor--readonly' : ''}${className ? ` ${className}` : ''}`}
      onKeyDown={(e) => {
        if (mentionOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Escape')) {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setMentionIndex((i) => (mentionCandidates.length > 0 ? (i + 1) % mentionCandidates.length : 0))
            return
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            setMentionIndex((i) => (mentionCandidates.length > 0 ? (i - 1 + mentionCandidates.length) % mentionCandidates.length : 0))
            return
          }
          if (e.key === 'Enter') {
            if (mentionCandidates.length > 0) {
              e.preventDefault();
              const user = mentionCandidates[mentionIndex] || mentionCandidates[0]
              insertMention(user)
              return
            }
          }
          if (e.key === 'Escape') {
            setMentionOpen(false)
            return
          }
        }
        onKeyDown?.(e as React.KeyboardEvent<HTMLDivElement>)
      }}
      onKeyUpCapture={(_e) => {
        try {
          if (enableMentions) updateMentionFromView()
        } catch {
          /* ignore keyup errors */
        }
      }}
      onDragEnter={(e) => {
        try {
          if (e.dataTransfer?.types?.includes('Files')) {
            e.preventDefault(); e.stopPropagation();
            setIsDragging(true)
          }
        } catch (_err) {
          // ignore dragenter errors
        }
      }}
      onDragOver={(e) => {
        try {
          if (e.dataTransfer?.types?.includes('Files')) {
            e.preventDefault(); e.stopPropagation();
          }
        } catch (_err) {
          // ignore dragover errors
        }
      }}
      onDragLeave={(e) => {
        try {
          if (e.dataTransfer?.types?.includes('Files')) {
            e.preventDefault(); e.stopPropagation();
            setIsDragging(false)
          }
        } catch (_err) {
          // ignore dragleave errors
        }
      }}
      onDrop={(e) => {
        try {
          if (!e.dataTransfer?.files?.length) return
          e.preventDefault(); e.stopPropagation();
          setIsDragging(false)
          const filesArray = Array.from(e.dataTransfer.files)
          if (fileHandlingMode === 'attachments' && _onFilesAdded) {
            _onFilesAdded(filesArray)
            return
          }
          void handleFiles(filesArray)
        } catch (_err) {
          // ignore drop errors
        }
      }}
      onPasteCapture={(e) => {
        try {
          const items = e.clipboardData?.items
          if (!items) return
          const imageFiles: File[] = []
          for (const item of Array.from(items)) {
            if (item.kind === 'file') {
              const file = item.getAsFile()
              if (file && file.type.startsWith('image/')) imageFiles.push(file)
            }
          }
          if (imageFiles.length > 0) {
            // show inline previews immediately and forward to host for upload
            const renamed = imageFiles.map(ensurePastedImageHasNiceName)
            void handleFiles(renamed, { notifyHost: false })
            e.preventDefault()
            e.stopPropagation()
            _onImagesPasted?.(renamed)
          }
        } catch {
          // no-op on paste errors
        }
      }}
      role="textbox"
      aria-readonly={isEditable ? 'false' : 'true'}
      aria-disabled={isEditable ? 'false' : 'true'}
      aria-multiline="true"
      tabIndex={0}
      style={((): React.CSSProperties & { ['--md-min-height']?: string; ['--md-max-height']?: string } => {
        const vars: React.CSSProperties & {
          ['--md-min-height']?: string
          ['--md-max-height']?: string
        } = {}
        if (minHeight != null) {
          vars['--md-min-height'] = typeof minHeight === 'number' ? `${minHeight}px` : String(minHeight)
        }
        if (maxHeight != null) {
          vars['--md-max-height'] = typeof maxHeight === 'number' ? `${maxHeight}px` : String(maxHeight)
        }
        return vars
      })()}
    >
      {effectivePlaceholder && isEditable && isEmpty && !hasFocus ? (
        <div className="md-editor__ghost">{effectivePlaceholder}</div>
      ) : null}
      <Milkdown />
      {mentionOpen
        ? createPortal(
            <div
              className="md-mention-menu"
              style={{
                position: 'fixed',
                left: mentionCoords.left,
                top: mentionPlacement === 'up' ? mentionCoords.top : mentionCoords.bottom,
                transform: mentionPlacement === 'up' ? 'translateY(calc(-100% - 8px))' : 'translateY(8px)',
              }}
              role="dialog" aria-label="User mentions"
            >
              <ul className="max-h-60 overflow-auto" role="listbox">
                {mentionCandidates.length === 0 && (isUsersLoading || isUsersFetching) ? (
                  <li className="px-3 py-2 text-sm text-muted-foreground">Loading users…</li>
                ) : mentionCandidates.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-muted-foreground">No users</li>
                ) : (
                  mentionCandidates.map((u, i) => (
                    <li key={u.id} role="option" aria-selected={i === mentionIndex}>
                      <button
                        type="button"
                        className={`w-full text-left px-3 py-1 cursor-pointer ${i === mentionIndex ? 'bg-muted' : ''}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseEnter={() => setMentionIndex(i)}
                        onClick={(ev) => {
                          ev.stopPropagation()
                          insertMention(u)
                        }}
                        onKeyDown={(ke) => {
                          if (ke.key === 'Enter' || ke.key === ' ') {
                            ke.preventDefault()
                            insertMention(u)
                          }
                        }}
                      >
                        {u.displayName}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>,
            document.body,
          )
        : null}
      {attachments.length > 0 ? (
        <div className="mt-2 border-t pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 auto-rows-min">
            {attachments.map((p, index) => (
              <div key={`${p.url || p.name}-${index}`} className="relative group">
                <div className={`flex items-center gap-2 p-2 rounded-md border bg-muted/20 ${p.isImage ? 'flex-col' : ''}`}>
                  {p.isImage && p.url ? (
                    <img
                      src={p.url}
                      alt={`Attachment ${index + 1}`}
                      className="w-full h-20 object-cover rounded"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full text-xs text-muted-foreground truncate">{p.name || 'file'}</div>
                  )}
                  {!p.isImage ? (
                    <div className="text-[10px] text-muted-foreground truncate">{p.name || 'file'}</div>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-background border opacity-0 group-hover:opacity-100"
                  onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== index))}
                  aria-label="Remove attachment"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )

  function insertMention(user: MentionUser) {
    try {
      const view = viewRef.current
      if (!view) return
      const to = view.state.selection.from
      const start = mentionFromPos != null ? mentionFromPos : to - 1
      const type = view.state.schema.nodes['mention']
      if (!type) return
      const node = type.create({ id: user.id, label: user.displayName })
      const tr = view.state.tr.replaceWith(start, to, node)
      view.dispatch(tr)
      // eslint-disable-next-line no-console
      console.log('[MarkdownEditor] inserted mention:', { id: user.id, label: user.displayName, start, to })
      setMentionOpen(false)
      setMentionQuery('')
    } catch {
      /* ignore insert errors */
    }
  }

  // reserved for future file tag inline insert

  function updateMentionFromView() {
    if (!enableMentions) {
      if (mentionOpen) setMentionOpen(false)
      return
    }
    const view = viewRef.current
    if (!isEditable || !view) return
    const { from } = view.state.selection
    const windowStart = Math.max(0, from - 200)
    const text = view.state.doc.textBetween(windowStart, from, '\n', '\n')
    const at = text.lastIndexOf('@')
    if (at === -1) {
      if (mentionOpen) setMentionOpen(false)
      return
    }
    const after = text.slice(at + 1)
    // Allow a single space so users can type "First Last" in the mention query.
    // Close the dropdown once they type a second space (or any newline/tab).
    if (/[\t\r\n]/.test(after)) {
      if (mentionOpen) setMentionOpen(false)
      return
    }
    const spaceCount = (after.match(/ /g) ?? []).length
    if (spaceCount > 1) {
      if (mentionOpen) setMentionOpen(false)
      return
    }
    const absoluteFrom = windowStart + at
    const coords = view.coordsAtPos(from)
    setMentionCoords({ left: coords.left, top: coords.top, bottom: coords.bottom })
    setMentionPlacement(getMentionPlacement(coords.top))
    setMentionFromPos(absoluteFrom)
    setMentionQuery(after)
    // Only reset the highlighted option when the query/session changes.
    // Otherwise, arrow key navigation will be immediately overwritten by this updater.
    const queryChanged = after !== mentionQueryRef.current
    const sessionChanged = absoluteFrom !== mentionFromPosRef.current || !mentionOpenRef.current
    if (queryChanged || sessionChanged) setMentionIndex(0)
    setMentionOpen(true)
    // eslint-disable-next-line no-console
    console.log('[MarkdownEditor] updateMentionFromView:', { from, absoluteFrom, query: after, coords })
  }

  function getMentionPlacement(caretTop: number): 'up' | 'down' {
    // Prefer opening upward; flip to downward if there isn't enough space above.
    // Mention menu has max height 15rem (~240px), plus a small gap.
    const maxMenuHeight = 240
    const gap = 12
    const minViewportPadding = 8
    return caretTop - (maxMenuHeight + gap) < minViewportPadding ? 'down' : 'up'
  }
}

export const MarkdownEditor = forwardRef<MarkdownEditorHandle, MarkdownEditorProps>((props, ref) => {
  return (
    <MilkdownProvider>
      <EditorInner {...props} editorHandleRef={ref} />
    </MilkdownProvider>
  )
})
MarkdownEditor.displayName = 'MarkdownEditor'

export default MarkdownEditor


