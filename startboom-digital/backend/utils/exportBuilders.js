import PDFDocument from 'pdfkit';
import Client from '../models/Client.js';
import Deal from '../models/Deal.js';
import Sale from '../models/Sale.js';
import AuditLog from '../models/AuditLog.js';

const escapeCsv = (value) => {
  const text = value === null || typeof value === 'undefined' ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

const toCsv = (headers, rows) => {
  return [
    headers.map(escapeCsv).join(','),
    ...rows.map(row => row.map(escapeCsv).join(','))
  ].join('\n');
};

export const buildExportData = async ({ tenantId, exportType = 'clients', format = 'csv', filters = {} }) => {
  const tenantFilter = { tenant: tenantId };

  if (exportType === 'deals') {
    const query = { ...tenantFilter };
    if (filters.stage) query.stage = filters.stage;
    const deals = await Deal.find(query)
      .populate('client', 'name email')
      .populate('agent', 'name email')
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean();

    const csv = toCsv(
      ['Title', 'Client', 'Agent', 'Value', 'Stage', 'Probability', 'Created'],
      deals.map(deal => [
        deal.title,
        deal.client?.name || '',
        deal.agent?.name || '',
        deal.value || 0,
        deal.stage || '',
        deal.probability || 0,
        deal.createdAt ? new Date(deal.createdAt).toLocaleDateString() : ''
      ])
    );

    return {
      filename: `deals-${new Date().toISOString().slice(0, 10)}.csv`,
      contentType: 'text/csv',
      content: Buffer.from(csv, 'utf8'),
      count: deals.length
    };
  }

  if (exportType === 'sales') {
    const sales = await Sale.find(tenantFilter)
      .populate('client', 'name email')
      .populate('agent', 'name email')
      .sort({ saleDate: -1, createdAt: -1 })
      .limit(5000)
      .lean();

    const csv = toCsv(
      ['Client', 'Agent', 'Final Amount', 'Payment Method', 'Status', 'Sale Date'],
      sales.map(sale => [
        sale.client?.name || sale.customerName || '',
        sale.agent?.name || '',
        sale.finalAmount || 0,
        sale.paymentMethod || '',
        sale.status || '',
        sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : ''
      ])
    );

    return {
      filename: `sales-${new Date().toISOString().slice(0, 10)}.csv`,
      contentType: 'text/csv',
      content: Buffer.from(csv, 'utf8'),
      count: sales.length
    };
  }

  if (exportType === 'auditLogs') {
    const query = { ...tenantFilter };
    if (filters.action) query.action = filters.action;
    if (filters.status) query.status = filters.status;

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean();

    const csv = toCsv(
      ['Created', 'Action', 'User', 'Email', 'Role', 'Status', 'Description', 'IP Address'],
      logs.map(log => [
        log.createdAt ? new Date(log.createdAt).toLocaleString() : '',
        log.action || '',
        log.userName || '',
        log.userEmail || '',
        log.userRole || '',
        log.status || '',
        log.description || '',
        log.ipAddress || ''
      ])
    );

    return {
      filename: `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`,
      contentType: 'text/csv',
      content: Buffer.from(csv, 'utf8'),
      count: logs.length
    };
  }

  const query = { ...tenantFilter };
  if (filters.status) query.status = filters.status;
  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { email: { $regex: filters.search, $options: 'i' } },
      { phone: { $regex: filters.search, $options: 'i' } },
      { company: { $regex: filters.search, $options: 'i' } }
    ];
  }

  const clients = await Client.find(query)
    .populate('agent', 'name email')
    .sort({ createdAt: -1 })
    .limit(5000)
    .lean();

  if (format === 'pdf') {
    const chunks = [];
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    doc.on('data', chunk => chunks.push(chunk));
    const done = new Promise(resolve => doc.on('end', resolve));

    doc.fontSize(18).font('Helvetica-Bold').text('Client Export', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(9).font('Helvetica').text(`Generated ${new Date().toLocaleString()} | ${clients.length} client(s)`, { align: 'center' });
    doc.moveDown();

    clients.forEach((client, index) => {
      if (doc.y > 735) doc.addPage();
      doc.fontSize(10).font('Helvetica-Bold').text(`${index + 1}. ${client.name || 'Unnamed client'}`);
      doc.fontSize(8).font('Helvetica').text([
        `Email: ${client.email || '-'}`,
        `Phone: ${client.phone || '-'}`,
        `Company: ${client.company || '-'}`,
        `Status: ${client.status || '-'}`,
        `Agent: ${client.agent?.name || 'Unassigned'}`
      ].join(' | '));
      doc.moveDown(0.5);
    });

    doc.end();
    await done;

    return {
      filename: `clients-${new Date().toISOString().slice(0, 10)}.pdf`,
      contentType: 'application/pdf',
      content: Buffer.concat(chunks),
      count: clients.length
    };
  }

  const csv = toCsv(
    ['Name', 'Email', 'Phone', 'Company', 'Status', 'Priority', 'Agent', 'Created'],
    clients.map(client => [
      client.name,
      client.email,
      client.phone,
      client.company || '',
      client.status || '',
      client.priority || '',
      client.agent?.name || '',
      client.createdAt ? new Date(client.createdAt).toLocaleDateString() : ''
    ])
  );

  return {
    filename: `clients-${new Date().toISOString().slice(0, 10)}.csv`,
    contentType: 'text/csv',
    content: Buffer.from(csv, 'utf8'),
    count: clients.length
  };
};

export const nextRunFromFrequency = (frequency, fromDate = new Date()) => {
  const next = new Date(fromDate);
  next.setSeconds(0, 0);

  if (frequency === 'daily') {
    next.setDate(next.getDate() + 1);
  } else if (frequency === 'monthly') {
    next.setMonth(next.getMonth() + 1);
  } else {
    next.setDate(next.getDate() + 7);
  }

  return next;
};
