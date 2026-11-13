import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const UPLOAD_ROOT = fileURLToPath(new URL('./public/uploads', import.meta.url))
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const MIME_EXT = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'image/avif': '.avif',
}

function sendJson(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

function safeSegment(value, fallback) {
  const clean = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return clean || fallback
}

function localUploadHandler(req, res, next) {
  const url = new URL(req.url || '/', 'http://localhost')
  if (url.pathname !== '/api/upload') return next()
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Metode tidak didukung.' })

  const mime = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase()
  const ext = MIME_EXT[mime]
  if (!ext) return sendJson(res, 415, { error: 'Berkas harus berupa gambar (JPG, PNG, WEBP).' })

  const declaredSize = Number(req.headers['content-length'] || 0)
  if (declaredSize > MAX_UPLOAD_BYTES) {
    return sendJson(res, 413, { error: 'Ukuran gambar maksimal 5 MB.' })
  }

  const bucket = safeSegment(url.searchParams.get('bucket'), 'umum')
  const originalName = decodeURIComponent(String(req.headers['x-file-name'] || 'foto'))
  const baseName = safeSegment(path.basename(originalName, path.extname(originalName)), 'foto')
  const fileName = `${Date.now()}-${baseName}${ext}`
  const folder = path.join(UPLOAD_ROOT, bucket)

  const chunks = []
  let size = 0
  let aborted = false

  req.on('data', (chunk) => {
    if (aborted) return
    size += chunk.length
    if (size > MAX_UPLOAD_BYTES) {
      aborted = true
      sendJson(res, 413, { error: 'Ukuran gambar maksimal 5 MB.' })
      req.destroy()
      return
    }
    chunks.push(chunk)
  })

  req.on('end', () => {
    if (aborted) return
    if (!size) return sendJson(res, 400, { error: 'Berkas kosong.' })
    try {
      fs.mkdirSync(folder, { recursive: true })
      fs.writeFileSync(path.join(folder, fileName), Buffer.concat(chunks))
      sendJson(res, 201, { url: `/uploads/${bucket}/${fileName}` })
    } catch (err) {
      sendJson(res, 500, { error: `Gagal menyimpan berkas: ${err.message}` })
    }
  })

  req.on('error', () => {
    if (!aborted) sendJson(res, 500, { error: 'Gagal membaca berkas.' })
  })
}

function localUploadPlugin() {
  return {
    name: 'local-upload',
    configureServer(server) {
      server.middlewares.use(localUploadHandler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(localUploadHandler)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), localUploadPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src/landing', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    // canvg adalah optional peer jspdf (dipakai hanya untuk gambar SVG di PDF);
    // tanpa ini build produksi gagal resolve.
    rolldownOptions: {
      external: ['canvg'],
    },
  },
  optimizeDeps: {
    entries: ['src/main.jsx'],
  },
})
