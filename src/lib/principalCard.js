const CARD_W = 1024
const CARD_H = 1440
const SPLIT = 950
// Jarak atas foto supaya kepala tidak menabrak lubang tali di bagian atas kartu.
const PHOTO_TOP = 150

const FONT = '"Plus Jakarta Sans", "Segoe UI", system-ui, sans-serif'

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error('empty-src'))
      return
    }
    const img = new Image()
    if (/^https?:/i.test(src)) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`failed to load ${src}`))
    img.src = src
  })

const drawPhoto = (ctx, img, x, y, w, h) => {
  const scale = Math.max(w / img.width, h / img.height)
  const dw = img.width * scale
  const dh = img.height * scale
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.drawImage(img, x + (w - dw) / 2, y, dw, dh)
  ctx.restore()
}

const fitFont = (ctx, text, maxWidth, startSize, weight = 800, minSize = 40) => {
  let size = startSize
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${FONT}`
    if (ctx.measureText(text).width <= maxWidth) break
    size -= 2
  }
  ctx.font = `${weight} ${size}px ${FONT}`
  return size
}

const spacedText = (ctx, text, x, y, spacing) => {
  try {
    ctx.letterSpacing = `${spacing}px`
  } catch {
    /* letterSpacing unsupported */
  }
  ctx.fillText(text, x, y)
  try {
    ctx.letterSpacing = '0px'
  } catch {
    /* noop */
  }
}

async function waitForFonts() {
  if (typeof document === 'undefined' || !document.fonts) return
  try {
    await Promise.all([
      document.fonts.load(`800 72px ${FONT}`),
      document.fonts.load(`700 30px ${FONT}`),
      document.fonts.load(`600 24px ${FONT}`),
    ])
    await document.fonts.ready
  } catch {
    /* fall back to system font */
  }
}

export async function renderPrincipalCard({
  photoUrl = '',
  name = '',
  role = 'KEPALA SEKOLAH',
  schoolName = 'SMK Muhammadiyah 8 Medan',
  subtitle = 'SMK PUSAT KEUNGGULAN',
  tagline = 'Tunas Bangsa Berkarakter',
  logoUrl = '/images/logo.png',
} = {}) {
  if (typeof document === 'undefined') return ''

  await waitForFonts()

  const canvas = document.createElement('canvas')
  canvas.width = CARD_W
  canvas.height = CARD_H
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  ctx.textBaseline = 'alphabetic'

  const top = ctx.createLinearGradient(0, 0, 0, SPLIT)
  top.addColorStop(0, '#ff8a1e')
  top.addColorStop(1, '#ff5a00')
  ctx.fillStyle = top
  ctx.fillRect(0, 0, CARD_W, SPLIT)

  if (photoUrl) {
    try {
      const photo = await loadImage(photoUrl)
      drawPhoto(ctx, photo, 0, PHOTO_TOP, CARD_W, SPLIT - PHOTO_TOP)
    } catch {
      /* keep orange background if photo fails */
    }
  }

  const panel = ctx.createLinearGradient(0, SPLIT, 0, CARD_H)
  panel.addColorStop(0, '#0b1524')
  panel.addColorStop(1, '#070c14')
  ctx.fillStyle = panel
  ctx.fillRect(0, SPLIT, CARD_W, CARD_H - SPLIT)

  let logo = null
  if (logoUrl) {
    try {
      logo = await loadImage(logoUrl)
    } catch {
      logo = null
    }
  }

  if (logo) {
    ctx.drawImage(logo, 58, 60, 66, 66)
  }

  ctx.fillStyle = '#ffffff'
  ctx.font = `800 31px ${FONT}`
  ctx.fillText(schoolName, 142, 92)

  ctx.fillStyle = 'rgba(255,255,255,0.86)'
  ctx.font = `700 16px ${FONT}`
  spacedText(ctx, String(subtitle).toUpperCase(), 143, 122, 3.2)

  ctx.fillStyle = '#ff6a3d'
  ctx.font = `800 25px ${FONT}`
  spacedText(ctx, String(role).toUpperCase(), 62, 1072, 9)

  ctx.fillStyle = '#f5f7fb'
  const displayName = name || 'Kepala Sekolah'
  fitFont(ctx, displayName, CARD_W - 130, 78, 800)
  ctx.fillText(displayName, 60, 1166)

  ctx.fillStyle = 'rgba(255,255,255,0.16)'
  ctx.fillRect(60, 1224, CARD_W - 120, 1)

  ctx.fillStyle = '#e8edf5'
  ctx.font = `600 30px ${FONT}`
  ctx.fillText(schoolName, 60, 1338)

  if (tagline) {
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.font = `500 24px ${FONT}`
    ctx.fillText(tagline, 60, 1380)
  }

  if (logo) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(888, 1348, 62, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.clip()
    ctx.drawImage(logo, 838, 1298, 100, 100)
    ctx.restore()
  }

  return canvas.toDataURL('image/png')
}
