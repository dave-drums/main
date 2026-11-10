import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const origin = 'https://www.davedrums.com.au';

export function versionAssetReferences(html, page, versions) {
  return html.replace(/\b(src|href)=(['"])([^'"]+)\2/g, (attribute, name, quote, source) => {
    const url = new URL(source, `${origin}/${page}`);
    const version = url.origin === origin && versions.get(url.pathname);
    if (!version) return attribute;
    // Preserve relative paths, fragments and any other query parameters.
    const [pathAndQuery, fragment] = source.split('#');
    const [path, query = ''] = pathAndQuery.split('?');
    const params = new URLSearchParams(query);
    params.set('v', version);
    return `${name}=${quote}${path}?${params}${fragment === undefined ? '' : `#${fragment}`}${quote}`;
  });
}

export async function versionSiteAssets(output) {
  const versions = new Map();
  for (const folder of ['assets', 'groove/app/js', 'groove/app/css']) {
    for (const entry of await readdir(resolve(output, folder), { withFileTypes: true })) {
      if (!entry.isFile() || !/\.(?:css|js|svg)$/.test(entry.name)) continue;
      const bytes = await readFile(resolve(output, folder, entry.name));
      versions.set(`/${folder}/${entry.name}`, createHash('sha256').update(bytes).digest('hex').slice(0, 12));
    }
  }
  async function walk(folder = '') {
    for (const entry of await readdir(resolve(output, folder), { withFileTypes: true })) {
      const name = folder ? `${folder}/${entry.name}` : entry.name;
      // HELP remains independent. App support pages may use the website theme.
      if (entry.isDirectory()) {
        if (name !== 'help') await walk(name);
      } else if (name.endsWith('.html')) {
        const path = resolve(output, name);
        const html = await readFile(path, 'utf8');
        const versioned = versionAssetReferences(html, name, versions);
        if (html !== versioned) await writeFile(path, versioned);
      }
    }
  }
  await walk();
}
