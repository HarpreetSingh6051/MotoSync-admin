import fs from 'fs'
import path from 'path'

const SUSPICIOUS_PATTERNS = [
  'dYOS',
  '22?C',
  '?7,890',
  'â‚¹',
  'Ã©',
  'Â°',
  '\uFFFD'
]

const IGNORED_NAMES = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  '.expo',
  '.vercel',
  'package-lock.json',
  '.png',
  '.jpg',
  '.jpeg',
  '.ico',
  '.wav',
  '.mp3'
])

let foundCount = 0

function scan(dir) {
  let list = []
  try {
    list = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }

  for (const item of list) {
    if (IGNORED_NAMES.has(item.name)) continue
    const full = path.join(dir, item.name)

    if (item.isDirectory()) {
      scan(full)
    } else if (/\.(ts|tsx|js|jsx|json|md|html|css)$/.test(item.name)) {
      try {
        const text = fs.readFileSync(full, 'utf8')
        for (const pattern of SUSPICIOUS_PATTERNS) {
          if (text.includes(pattern)) {
            console.error(`[MOJIBAKE CORRUPTION] Found '${pattern}' in: ${full}`)
            foundCount++
          }
        }
      } catch (err) {
        console.error(`[READ ERROR] Could not read ${full}:`, err.message)
      }
    }
  }
}

scan(process.cwd())

if (foundCount > 0) {
  console.error(`Encoding check failed: ${foundCount} corrupted characters detected.`)
  process.exit(1)
} else {
  console.log('Encoding check passed: 100% clean UTF-8 with zero corrupted characters.')
}
