const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

async function test() {
  const entryCode = `
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import VendorPortal from './src/pages/VendorPortal.jsx';

// Mock localStorage
const store = {
  dw_vendor_loggedIn: 'true',
  dw_vendor_session: JSON.stringify({
    id: 'vnd_mwsuogyt_j4kh',
    name: 'Gayatri Decoration Studio',
    businessName: 'Gayatri Decoration Studio',
    ownerName: 'Gayatri Patel',
    email: 'gayatri@decorationstudio.com',
    service: 'Decoration',
    avatar: '🌸'
  })
};
global.localStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => { store[k] = v; },
  removeItem: (k) => { delete store[k]; }
};
global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  showToast: () => {}
};

try {
  const html = ReactDOMServer.renderToString(
    React.createElement(MemoryRouter, null, React.createElement(VendorPortal))
  );
  console.log('RENDER SUCCESS! HTML length:', html.length);
} catch (err) {
  console.error('EXACT RUNTIME CRASH:');
  console.error(err);
}
`;

  fs.writeFileSync('temp_test_entry.jsx', entryCode);

  try {
    await esbuild.build({
      entryPoints: ['temp_test_entry.jsx'],
      bundle: true,
      platform: 'node',
      outfile: 'temp_test_out.cjs',
      loader: {
        '.css': 'empty'
      },
      external: []
    });

    require('./temp_test_out.cjs');
  } catch (e) {
    console.error('Build error:', e);
  } finally {
    try { fs.unlinkSync('temp_test_entry.jsx'); } catch {}
    try { fs.unlinkSync('temp_test_out.cjs'); } catch {}
  }
}

test();
