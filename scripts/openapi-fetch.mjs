import { BlobServiceClient } from '@azure/storage-blob';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const connectionString = process.env.OPENAPI_STORAGE_CONNECTION_STRING;
if (!connectionString) {
  console.error('Missing OPENAPI_STORAGE_CONNECTION_STRING');
  process.exit(1);
}

const containerName = process.env.OPENAPI_CONTAINER || 'openapi';
const prefix = process.env.OPENAPI_BASELINE_PREFIX || 'develop';

const outputDir = path.resolve('openapi');
await mkdir(outputDir, { recursive: true });

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(containerName);

const files = ['chat-api.json'];

for (const name of files) {
  const blobName = `${prefix}/${name}`;
  const blobClient = containerClient.getBlobClient(blobName);
  const downloadResponse = await blobClient.download();
  const buffer = await streamToBuffer(downloadResponse.readableStreamBody);
  const outputPath = path.join(outputDir, name);

  // Ensure spec has info.version for strict validators (e.g., orval).
  const patched = ensureInfoVersion(buffer);
  await writeFile(outputPath, patched);
  console.log(`Downloaded ${blobName} -> ${outputPath}`);
}

async function streamToBuffer(readable) {
  if (!readable) return Buffer.alloc(0);
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function ensureInfoVersion(buffer) {
  try {
    const json = JSON.parse(buffer.toString('utf8'));
    if (!json.info) json.info = {};
    if (!json.info.version) json.info.version = '0.0.0';
    return Buffer.from(JSON.stringify(json));
  } catch {
    // If parsing fails, return the original bytes.
    return buffer;
  }
}
