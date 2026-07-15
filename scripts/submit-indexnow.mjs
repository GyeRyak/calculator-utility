const SITE_ORIGIN = 'https://www.maplecalc.com'
const SITE_HOST = 'www.maplecalc.com'
const INDEXNOW_KEY = 'a0cb9692b89c61c2f96f4a85fb57552b'
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'
const KEY_LOCATION = `${SITE_ORIGIN}/${INDEXNOW_KEY}.txt`

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

async function fetchDeployedResource(url, validate, attempts = 6) {
  let lastError

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(`${url}?deployment=${Date.now()}`, { cache: 'no-store' })
      const body = await response.text()
      if (response.ok && validate(body)) return body
      lastError = new Error(`${url} returned HTTP ${response.status}`)
    } catch (error) {
      lastError = error
    }

    if (attempt < attempts) await sleep(5000)
  }

  throw lastError
}

function extractSitemapUrls(sitemapXml) {
  return [...sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)]
    .map((match) => match[1].replaceAll('&amp;', '&'))
    .filter((url) => new URL(url).hostname === SITE_HOST)
}

const keyFile = await fetchDeployedResource(KEY_LOCATION, (body) => body.trim() === INDEXNOW_KEY)
if (keyFile.trim() !== INDEXNOW_KEY) throw new Error('IndexNow key verification failed')

const sitemapXml = await fetchDeployedResource(
  `${SITE_ORIGIN}/sitemap.xml`,
  (body) => body.includes('<urlset') && body.includes('<loc>')
)
const urlList = extractSitemapUrls(sitemapXml)

if (urlList.length === 0 || urlList.length > 10_000) {
  throw new Error(`Invalid IndexNow URL count: ${urlList.length}`)
}

const response = await fetch(INDEXNOW_ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: SITE_HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  }),
})

if (![200, 202].includes(response.status)) {
  throw new Error(`IndexNow submission failed with HTTP ${response.status}: ${await response.text()}`)
}

console.log(`IndexNow accepted ${urlList.length} URLs with HTTP ${response.status}.`)
