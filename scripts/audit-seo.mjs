import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const OUTPUT_DIRECTORY = join(process.cwd(), 'out')
const MIN_TITLE_LENGTH = 25
const MAX_TITLE_LENGTH = 65
const MIN_DESCRIPTION_LENGTH = 70
const MAX_DESCRIPTION_LENGTH = 180
const SHORT_METADATA_PAGES = new Set([
  'index.html',
  'about/index.html',
  'blog/index.html',
  'calculators/index.html',
])

async function findHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nestedFiles = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? findHtmlFiles(path) : [path]
  }))

  return nestedFiles.flat().filter((path) => path.endsWith('.html'))
}

function getAttribute(tag, attribute) {
  return tag.match(new RegExp(`${attribute}=["']([^"']*)["']`, 'i'))?.[1] ?? ''
}

function decodeHtml(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', "'")
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
}

const htmlFiles = (await findHtmlFiles(OUTPUT_DIRECTORY)).filter(
  (path) => !path.endsWith('/404.html') && !path.includes('/404/') && !path.includes('/_not-found/')
)
const failures = []

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8')
  const page = relative(OUTPUT_DIRECTORY, file)
  const title = decodeHtml(html.match(/<title>(.*?)<\/title>/i)?.[1] ?? '')
  const descriptionTag = (html.match(/<meta\b[^>]*>/gi) ?? []).find(
    (tag) => getAttribute(tag, 'name').toLowerCase() === 'description'
  )
  const description = decodeHtml(descriptionTag ? getAttribute(descriptionTag, 'content') : '')
  const h1Count = (html.match(/<h1\b/gi) ?? []).length

  const allowsShortMetadata = SHORT_METADATA_PAGES.has(page)

  if ((!allowsShortMetadata && title.length < MIN_TITLE_LENGTH) || title.length > MAX_TITLE_LENGTH) {
    failures.push(`${page}: title length ${title.length} (${MIN_TITLE_LENGTH}-${MAX_TITLE_LENGTH} required)`)
  }
  if ((!allowsShortMetadata && description.length < MIN_DESCRIPTION_LENGTH) || description.length > MAX_DESCRIPTION_LENGTH) {
    failures.push(`${page}: description length ${description.length} (${MIN_DESCRIPTION_LENGTH}-${MAX_DESCRIPTION_LENGTH} required)`)
  }
  if (h1Count !== 1) failures.push(`${page}: expected 1 h1, found ${h1Count}`)
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log(`SEO audit passed for ${htmlFiles.length} static pages.`)
