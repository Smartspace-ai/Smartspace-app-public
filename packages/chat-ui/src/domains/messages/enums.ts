export enum MessageValueType {
  OUTPUT = 'Output',
  INPUT = 'Input',
}

export enum MessageResponseSourceType {
  BlobInternal = 'BlobInternal',
  WebExternal = 'WebExternal',
  File = 'File',
  URL = 'URL',
}

// How well a citation's source text backs the model's claim (WS3c, AIS
// vocabulary). Absent on responses from before citation verification shipped.
export enum MessageAttribution {
  Supported = 'supported',
  Partial = 'partial',
  Unsupported = 'unsupported',
}
