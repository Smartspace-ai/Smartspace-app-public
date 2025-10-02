#!/usr/bin/env node
/**
 * test-smartspace-payload.js
 *
 * Usage (Bash):
 *   TENANT_ID=... SP_CLIENT_ID=... SP_CLIENT_SECRET=... SMARTSPACE_CLIENT_ID=... \
 *   SMARTSPACE_API_URL=https://.../messages/ WORKSPACE_ID=... node test-smartspace-payload.js [payload.json]
 *
 * If you pass a path to a JSON file as an argument it will use that as the "payload" value.
 * If not, it uses a small built-in sample payload.
 *
 * Output: prints the request body sent and the response (status + parsed JSON or raw text).
 */

const {
    TENANT_ID,
    SP_CLIENT_ID,
    SP_CLIENT_SECRET,
    SMARTSPACE_CLIENT_ID,
    SMARTSPACE_API_URL,
    WORKSPACE_ID
  } = process.env;
  
  function requireEnv(name, v) {
    if (!v) {
      console.error(`Missing env var: ${name}`);
      process.exit(2);
    }
  }
  
  // check required envs
  requireEnv('TENANT_ID', TENANT_ID);
  requireEnv('SP_CLIENT_ID', SP_CLIENT_ID);
  requireEnv('SP_CLIENT_SECRET', SP_CLIENT_SECRET);
  requireEnv('SMARTSPACE_CLIENT_ID', SMARTSPACE_CLIENT_ID);
  requireEnv('SMARTSPACE_API_URL', SMARTSPACE_API_URL);
  requireEnv('WORKSPACE_ID', WORKSPACE_ID);
  
  // simple token fetch
  async function getToken() {
    const url = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
    const scope = `api://${SMARTSPACE_CLIENT_ID}/.default`;
  
    const params = new URLSearchParams();
    params.append('client_id', SP_CLIENT_ID);
    params.append('client_secret', SP_CLIENT_SECRET);
    params.append('scope', scope);
    params.append('grant_type', 'client_credentials');
  
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
  
    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }
  
    if (!resp.ok) {
      const pretty = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
      throw new Error(`Token request failed: ${resp.status}\n${pretty}`);
    }
    if (!data.access_token) throw new Error(`Token response missing access_token: ${JSON.stringify(data)}`);
    return data.access_token;
  }
  
  function makeThreadId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  
  async function callSmartspace(payloadObj) {
    const token = await getToken();
  
    const threadId = makeThreadId();
    const requestBody = {
      workSpaceId: WORKSPACE_ID,
      messageThreadId: threadId,
      // Single field "payload" as you requested
      inputs: [
        { name: 'payload', value: payloadObj }
      ]
    };
  
    console.log('\n--- REQUEST BODY (what will be sent) ---\n');
    console.log(JSON.stringify(requestBody, null, 2));
    console.log('\n--- SENDING to', SMARTSPACE_API_URL, '---\n');
  
    const resp = await fetch(SMARTSPACE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
  
    const resText = await resp.text();
    let resJson;
    try { resJson = JSON.parse(resText); } catch (e) { resJson = null; }
  
    console.log('HTTP', resp.status, resp.statusText);
    if (resJson) {
      console.log('--- RESPONSE JSON ---\n', JSON.stringify(resJson, null, 2));
    } else {
      console.log('--- RESPONSE TEXT ---\n', resText);
    }
  
    return { status: resp.status, body: resJson ?? resText };
  }
  
  (async () => {
    try {
      // support passing a payload JSON file as first arg
      const arg = process.argv[2];
      let payloadObj;
      if (arg) {
        const fs = await import('fs/promises');
        const txt = await fs.readFile(arg, { encoding: 'utf8' });
        try { payloadObj = JSON.parse(txt); }
        catch (e) {
          console.error('Failed to parse payload JSON file:', e.message);
          process.exit(3);
        }
      } else {
        // default sample payload — replace with realistic data
        payloadObj = {
          releaseContext: {
            branch: 'develop',
            triggeredBy: process.env.USER || 'local-test'
          },
          issues: [
            { number: 123, title: 'Fix X', url: 'https://github.com/Smartspace-ai/Smartspace-app-public/issues/123' },
            { number: 124, title: 'Add Y',  url: 'https://github.com/Smartspace-ai/Smartspace-app-public/issues/124' }
          ],
          notes: "This is a test payload from local script"
        };
      }
  
      await callSmartspace(payloadObj);
      console.log('\nDone.');
    } catch (err) {
      console.error('\nERROR:', err.message || err);
      process.exitCode = 1;
    }
  })();
  