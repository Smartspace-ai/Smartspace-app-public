import { editorViewCtx } from '@milkdown/core'
import type { Node as PMNode } from '@milkdown/prose/model'
import type { EditorView } from '@milkdown/prose/view'
import { $node, $view } from '@milkdown/utils'

function parseQuery(query: string): Record<string, string> {
  const params = new URLSearchParams(query)
  const out: Record<string, string> = {}
  params.forEach((v, k) => { out[k] = v })
  return out
}

type SsImageAttrs = {
  fileId: string
  alt?: string
  w?: string | number | null
  h?: string | number | null
  fit?: string | null
  align?: string | null
  caption?: string | null
  extraClass?: string | null
  title?: string | null
}

export const ssImageNode = $node('ssImage', () => ({
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,
  attrs: {
    fileId: { default: '' },
    alt: { default: '' },
    w: { default: null },
    h: { default: null },
    fit: { default: null },
    align: { default: null },
    caption: { default: null },
    extraClass: { default: null },
    title: { default: null },
  },
  toDOM: (node: PMNode) => {
    const a = node.attrs as SsImageAttrs
    const attrs: Record<string, string> = {
      'data-ss-image': '',
      'data-file-id': a.fileId || '',
      alt: a.alt || '',
      title: a.title || '',
    }
    if (a.w != null) attrs['width'] = String(a.w)
    if (a.h != null) attrs['height'] = String(a.h)
    if (a.fit) attrs['data-fit'] = String(a.fit)
    if (a.align) attrs['data-align'] = String(a.align)
    if (a.caption) attrs['data-caption'] = String(a.caption)
    if (a.extraClass) attrs['data-class'] = String(a.extraClass)
    return ['img', attrs]
  },
  parseDOM: [
    {
      tag: 'img[data-ss-image]'
    },
  ],
  parseMarkdown: {
    match: (n) => {
      try {
        const md = n as Record<string, unknown>
        return md.type === 'image' && typeof md.url === 'string' && md.url.startsWith('ss-file:')
      } catch { return false }
    },
    runner: (state, node, type) => {
      const raw = node as unknown as { url?: string; alt?: string; title?: string }
      const url = raw.url ?? ''
      const withoutScheme = url.substring('ss-file:'.length)
      const [idPart, query = ''] = withoutScheme.split('?')
      const q = parseQuery(query)
      state.openNode(type, {
        fileId: idPart,
        alt: raw.alt ?? '',
        w: q.w ?? null,
        h: q.h ?? null,
        fit: q.fit ?? null,
        align: q.align ?? null,
        caption: q.caption ?? null,
        extraClass: q.class ?? null,
        title: raw.title ?? null,
      })
      state.closeNode()
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === 'ssImage',
    runner: (state, node) => {
      const a = node.attrs as SsImageAttrs
      const params = new URLSearchParams()
      if (a.w != null) params.set('w', String(a.w))
      if (a.h != null) params.set('h', String(a.h))
      if (a.fit) params.set('fit', String(a.fit))
      if (a.align) params.set('align', String(a.align))
      if (a.caption) params.set('caption', String(a.caption))
      if (a.extraClass) params.set('class', String(a.extraClass))
      const query = params.toString()
      const url = `ss-file:${a.fileId}${query ? `?${query}` : ''}`
      // Milkdown's state.addNode('image', ...): use normal image serializer context
      const imageMeta = { url, title: a.title ?? undefined, alt: a.alt ?? undefined }
      state.addNode('image', undefined, undefined, imageMeta as Parameters<typeof state.addNode>[3])
    },
  },
}))

export const ssImageView = $view(ssImageNode, (ctx) => (node) => {
  const dom = document.createElement('span')
  dom.className = 'ss-attach ss-attach--image'
  // allow spinner overlay
  dom.style.position = 'relative'
  const img = document.createElement('img')
  img.alt = (node.attrs as SsImageAttrs).alt || ''
  const fileId = (node.attrs as SsImageAttrs).fileId as string
  const w = (node.attrs as SsImageAttrs).w as number | string | null
  const h = (node.attrs as SsImageAttrs).h as number | string | null
  if (w) img.width = Number(w)
  if (h) img.height = Number(h)
  img.className = 'ss-attach__img'

  const spinner = document.createElement('span')
  spinner.className = 'ss-attach__spinner'

  // Remove (X) button (only meaningful when editor is editable)
  const removeBtn = document.createElement('button')
  removeBtn.type = 'button'
  removeBtn.className = 'ss-attach__remove'
  removeBtn.setAttribute('aria-label', 'Remove image')
  removeBtn.textContent = '×'
  removeBtn.addEventListener('mousedown', (e) => {
    // prevent ProseMirror from moving selection/caret weirdly
    e.preventDefault()
    e.stopPropagation()
  })
  removeBtn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const view = ctx.get(editorViewCtx) as EditorView
      if (!view || view.editable === false) return
      const pos = view.posAtDOM(dom, 0)
      if (typeof pos !== 'number') return
      const tr = view.state.tr.delete(pos, pos + node.nodeSize)
      view.dispatch(tr.scrollIntoView())
    } catch {
      // ignore remove errors
    }
  })

  // Show lightweight placeholder while downloading (do not set img.src yet)
  img.style.background = 'rgba(0,0,0,0.04)'
  let hasSetRealSrc = false

  // Hide spinner once image loads (or errors)
  img.addEventListener('load', () => {
    if (!hasSetRealSrc) return
    spinner.remove()
    img.style.background = ''
  })
  img.addEventListener('error', () => {
    if (!hasSetRealSrc) return
    spinner.remove()
    img.style.background = 'rgba(255,0,0,0.06)'
  })

  // Fetch via app API (window hook to avoid bundling React inside NodeView)
  try {
    const anyWin = window as unknown as { __ssDownloadFile?: (id: string) => Promise<string> }
    if (anyWin.__ssDownloadFile) {
      anyWin.__ssDownloadFile(fileId).then((blobUrl) => {
        hasSetRealSrc = true
        img.src = blobUrl
      }).catch(() => {
        // trigger error styling
        hasSetRealSrc = true
        img.dispatchEvent(new Event('error'))
      })
    } else {
      // leave as placeholder if integration not provided
    }
  } catch {
    // ignore download errors
  }

  dom.appendChild(spinner)
  dom.appendChild(img)
  dom.appendChild(removeBtn)
  return { dom, contentDOM: null }
})
