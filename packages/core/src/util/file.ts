import undici from 'undici'
import type { URL, UrlObject } from 'url'
import fs from 'fs'

const MAX_REDIRECTS = 5

export async function downloadFile(url: string | URL | UrlObject, filePath: string, numRedirects = 0) {
  try {
    if (numRedirects > MAX_REDIRECTS) {
      throw new Error('Maximum number of redirects reached')
    }

    const { statusCode, headers, body } = await undici.request(url)

    switch (statusCode) {
      case 200: {
        const fileStream = fs.createWriteStream(filePath)

        await new Promise((res, rej) => {
          body
            .pipe(fileStream)
            .on('finish', () => {
              fileStream.close()
              res(0)
            })
            .on('error', (error) => {
              rej(error)
            })
        })

        break
      }
      case 301:
      case 302:
      case 303:
      case 307:
      case 308: {
        const redirectURL = headers.location
        await downloadFile(redirectURL as string, filePath, numRedirects + 1)
        break
      }
      default: {
        throw new Error(`Failed to download the file. Status code: ${statusCode}`)
      }
    }
  } catch (error) {
    console.error('Error downloading file:', error)
  }
}
