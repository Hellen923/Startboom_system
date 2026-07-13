import { clientsAPI, dealsAPI, salesAPI, usersAPI, tenantsAPI } from '../services/api';

const downloadCSV = (headers, rows, filename) => {
  const csv = [headers, ...rows]
    .map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const getTenantInfo = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return {
      name: user?.tenant?.name || user?.companyName || 'HoneyPot CRM',
      logo: user?.tenant?.branding?.logo || user?.tenant?.settings?.logo || localStorage.getItem('tenant_logo') || null,
      color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || 'var(--primary-color)',
    };
  } catch { return { name: 'HoneyPot CRM', logo: null, color: 'var(--primary-color)' }; }
};

const downloadPDF = (title, headers, rows) => {
  const { name: companyName, logo, color } = getTenantInfo();
  const logoHtml = logo ? `<img src="${logo}" style="height:40px;object-fit:contain" alt="logo" />` : '';
  const body = rows.map((row) => `<tr>${row.map((c) => `<td>${c ?? ''}</td>`).join('')}</tr>`).join('');
  const html = `<html><head><title>${title}</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:12px;margin:0;padding:20px}
      .header{display:flex;align-items:center;gap:12px;padding:16px 20px;background:${color};color:#fff;border-radius:8px;margin-bottom:16px}
      .header h1{margin:0;font-size:16px;font-weight:700}  
      .header p{margin:2px 0 0;font-size:11px;opacity:0.85}
      .meta{font-size:11px;color:#64748b;margin-bottom:12px}
      table{width:100%;border-collapse:collapse}th{background:#1f2937;color:#fff;padding:8px;text-align:left;font-size:11px}
      td{padding:7px 8px;border-bottom:1px solid #e5e7eb;font-size:11px}
    </style></head>
    <body>
      <div class="header">${logoHtml}<div><h1>${companyName}</h1><p>${title}</p></div></div>
      <p class="meta">Generated: ${new Date().toLocaleString()}</p>
      <table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table>
    </body></html>`;
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.print();
};

const routeExportMap = {
  '/agent/clients': async () => {
    const res = await clientsAPI.getAll({ limit: 1000 });
    const clients = res.data?.clients || [];
    return {
      title: 'Clients Export',
      headers: ['Name', 'Email', 'Phone', 'Company', 'Status', 'Priority'],
      rows: clients.map((c) => [c.name, c.email, c.phone, c.company, c.status, c.priority]),
    };
  },
  '/agent/leads': async () => routeExportMap['/agent/clients'](),
  '/agent/deals': async () => {
    const res = await dealsAPI.getAll();
    const deals = res.data?.deals || res.data || [];
    return {
      title: 'Deals Export',
      headers: ['Title', 'Stage', 'Value', 'Client', 'Created'],
      rows: deals.map((d) => [d.title, d.stage, d.value, d.client?.name || '', d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '']),
    };
  },
  '/agent/sales': async () => {
    const res = await salesAPI.getAll({ limit: 1000 });
    const sales = res.data?.sales || [];
    return {
      title: 'Sales Export',
      headers: ['Customer', 'Amount', 'Date', 'Notes'],
      rows: sales.map((s) => [s.customerName || s.client?.name, s.finalAmount ?? s.totalAmount, s.saleDate || s.createdAt, s.notes]),
    };
  },
  '/admin/users': async () => {
    const res = await usersAPI.getAll();
    const users = res.data?.users || res.data || [];
    return {
      title: 'Users Export',
      headers: ['Name', 'Email', 'Role', 'Status', 'Joined'],
      rows: users.map((u) => [u.name, u.email, u.role, u.isActive === false ? 'Inactive' : 'Active', u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '']),
    };
  },
  '/superadmin/tenants': async () => {
    const res = await tenantsAPI.getAll();
    const tenants = res.data?.tenants || [];
    return {
      title: 'Tenants Export',
      headers: ['Name', 'Email', 'Status', 'Users', 'Clients', 'Created'],
      rows: tenants.map((t) => [t.name, t.email, t.status, t.usage?.totalUsers, t.usage?.totalClients, t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '']),
    };
  },
};

export const exportCurrentPage = async (format, { pathname, role }) => {
  const handler = routeExportMap[pathname];
  let payload;

  if (handler) {
    payload = await handler();
  } else if (['/agent', '/admin', '/superadmin', '/dashboard'].includes(pathname)) {
    if (role === 'agent') payload = await routeExportMap['/agent/clients']();
    else if (role === 'superadmin') payload = await routeExportMap['/superadmin/tenants']();
    else payload = await routeExportMap['/admin/users']();
  } else {
    payload = {
      title: 'CRM Export',
      headers: ['Info'],
      rows: [[`Export for ${pathname} — ${new Date().toLocaleString()}`]],
    };
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const base = payload.title.toLowerCase().replace(/\s+/g, '-');

  if (format === 'csv') {
    downloadCSV(payload.headers, payload.rows, `${base}-${stamp}.csv`);
  } else {
    downloadPDF(payload.title, payload.headers, payload.rows);
  }

  return payload.rows.length;
};
