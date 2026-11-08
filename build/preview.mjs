import { resolve } from 'node:path';
import { ROOT } from './common.mjs';
import { serveSite } from './serve.mjs';

const port = Number(process.env.PORT || 4178);
const server = await serveSite({ root: resolve(ROOT, 'dist'), port });
console.log(`Built Dave Drums website: http://127.0.0.1:${port}/`);
process.on('SIGINT', () => server.close());
process.on('SIGTERM', () => server.close());
