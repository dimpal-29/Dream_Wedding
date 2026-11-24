
import React, { useState } from 'react';
import ReactDOMServer from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import fs from 'fs';

const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));
const vendor = db.vendors.find(v => v.id === 'vnd_mwsuogyt_j4kh');
const bookings = db.bookings || [];
const vendorTasks = db.vendorTasks || [];

let src = fs.readFileSync('src/pages/VendorPortal.jsx', 'utf8');

src = src.replace('const [vendor, setVendor] = useState(null)', 'const [vendor, setVendor] = useState(' + JSON.stringify(vendor) + ')');
src = src.replace('const [bookings, setBookings] = useState([])', 'const [bookings, setBookings] = useState(' + JSON.stringify(bookings) + ')');
src = src.replace('const [vendorTasks, setVendorTasks] = useState([])', 'const [vendorTasks, setVendorTasks] = useState(' + JSON.stringify(vendorTasks) + ')');
src = src.replace('const [loading, setLoading] = useState(true)', 'const [loading, setLoading] = useState(false)');
src = src.replace("const [activeTab, setActiveTab] = useState('overview')", "const [activeTab, setActiveTab] = useState('" + 'overview' + "')");

fs.writeFileSync('src/pages/temp_VendorPortal.jsx', src);

const testRunner = \`
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import VendorPortal from './src/pages/temp_VendorPortal.jsx';

global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  showToast: () => {}
};

try {
  const html = ReactDOMServer.renderToString(
    React.createElement(MemoryRouter, null, React.createElement(VendorPortal))
  );
  console.log('TAB overview SUCCESS! HTML length:', html.length);
} catch (err) {
  console.error('CRASH IN TAB overview:');
  console.error(err.stack || err);
}
\`;

fs.writeFileSync('temp_runner.jsx', testRunner);
