/**
 * utils/docxGenerator.js
 * Generates .docx matching the 92-ATS-score reference format.
 * Times New Roman, section titles with underline, project sub-headings bold uppercase.
 */

const docx = require('docx');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, TabStopPosition, TabStopType,
  convertInchesToTwip,
} = docx;

const FONT = 'Times New Roman';
const BODY_SIZE = 21;     // 10.5pt
const SMALL_SIZE = 20;    // 10pt
const HEADING_SIZE = 22;  // 11pt
const NAME_SIZE = 40;     // 20pt

async function generateDocx(data, info) {
  const r = data.resume || data;

  const contactParts = [];
  if (info.email)    contactParts.push(`Email: ${info.email}`);
  if (info.phone)    contactParts.push(`Phone: ${info.phone}`);
  if (info.city)     contactParts.push(info.city);
  if (info.linkedin) {
    const display = info.linkedin.replace(/^https?:\/\//, '').replace(/^www\./, '');
    contactParts.push(`LinkedIn: ${display}`);
  }
  const contactStr = contactParts.join(' | ');

  const children = [];

  // ── Name ────────────────────────────────────────────────────────────────────
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 20 },
    children: [
      new TextRun({ text: (info.name || '').trim(), bold: true, size: NAME_SIZE, font: FONT }),
    ],
  }));

  // ── Contact ─────────────────────────────────────────────────────────────────
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [
      new TextRun({ text: contactStr, size: 19, font: FONT }),
    ],
  }));

  // ── Profile Summary ─────────────────────────────────────────────────────────
  if (r.summary) {
    children.push(sectionTitle('SUMMARY'));
    children.push(new Paragraph({
      spacing: { after: 60 },
      alignment: AlignmentType.JUSTIFIED,
      children: [
        new TextRun({ text: r.summary, size: BODY_SIZE, font: FONT }),
      ],
    }));
  }

  // ── Work Experience ─────────────────────────────────────────────────────────
  if (r.experience && r.experience.length > 0) {
    children.push(sectionTitle('WORK EXPERIENCE'));
    for (const job of r.experience) {
      children.push(jobHeader(job.title, job.company, job.location, job.dates));
      for (const bullet of (job.bullets || [])) {
        children.push(bulletPoint(bullet));
      }
    }
  }

  // ── Project Experience ──────────────────────────────────────────────────────
  if (r.projects && r.projects.length > 0) {
    children.push(sectionTitle('PROJECTS'));
    for (const proj of r.projects) {
      // Bold uppercase project name
      children.push(new Paragraph({
        spacing: { before: 40, after: 10 },
        children: [
          new TextRun({ text: (proj.name || '').toUpperCase(), bold: true, size: BODY_SIZE, font: FONT }),
        ],
      }));
      for (const bullet of (proj.bullets || [])) {
        children.push(bulletPoint(bullet));
      }
    }
  }

  // ── Technical Skills ────────────────────────────────────────────────────────
  if (r.skills && r.skills.length > 0) {
    children.push(sectionTitle('SKILLS'));
    for (const s of r.skills) {
      children.push(new Paragraph({
        spacing: { after: 10 },
        indent: { left: convertInchesToTwip(0.25) },
        bullet: { level: 0 },
        children: [
          new TextRun({ text: `${s.category || 'Skills'}: `, bold: true, size: SMALL_SIZE, font: FONT }),
          new TextRun({ text: s.items || '', size: SMALL_SIZE, font: FONT }),
        ],
      }));
    }
  }

  // ── Education ───────────────────────────────────────────────────────────────
  if (r.education && r.education.length > 0) {
    children.push(sectionTitle('EDUCATION'));
    for (const edu of r.education) {
      if (edu.degree) {
        children.push(new Paragraph({
          spacing: { after: 5 },
          children: [
            new TextRun({ text: edu.degree, bold: true, size: BODY_SIZE, font: FONT }),
          ],
        }));
      }
      const uniParts = [];
      if (edu.institution) uniParts.push(edu.institution);
      if (edu.dates) uniParts.push(`(${edu.dates})`);
      if (uniParts.length) {
        children.push(new Paragraph({
          spacing: { after: 5 },
          children: [
            new TextRun({ text: uniParts.join(' '), size: BODY_SIZE, font: FONT }),
          ],
        }));
      }
      if (edu.details) {
        children.push(new Paragraph({
          spacing: { after: 20 },
          children: [
            new TextRun({ text: edu.details, size: BODY_SIZE, font: FONT }),
          ],
        }));
      }
    }
  }

  // ── Certification ───────────────────────────────────────────────────────────
  const certs = r.certifications || [];
  if (certs.length > 0) {
    children.push(sectionTitle('CERTIFICATIONS'));
    for (const c of certs) {
      const text = typeof c === 'string' ? c : [c.name, c.issuer].filter(Boolean).join(' | ');
      children.push(new Paragraph({
        spacing: { after: 10 },
        indent: { left: convertInchesToTwip(0.25) },
        bullet: { level: 0 },
        children: [
          new TextRun({ text: text.split(' | ')[0] || text, bold: true, size: SMALL_SIZE, font: FONT }),
          new TextRun({ text: text.includes(' | ') ? ` | ${text.split(' | ').slice(1).join(' | ')}` : '', size: SMALL_SIZE, font: FONT }),
        ],
      }));
    }
  }

  // ── Build document ──────────────────────────────────────────────────────────
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(0.5),
            bottom: convertInchesToTwip(0.5),
            left: convertInchesToTwip(0.7),
            right: convertInchesToTwip(0.7),
          },
          size: {
            width: convertInchesToTwip(8.27),
            height: convertInchesToTwip(11.69),
          },
        },
      },
      children,
    }],
  });

  return Packer.toBuffer(doc);
}

function sectionTitle(text) {
  return new Paragraph({
    spacing: { before: 60, after: 30 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
    children: [
      new TextRun({ text, bold: true, size: HEADING_SIZE, font: FONT, allCaps: true }),
    ],
  });
}

function jobHeader(title, company, location, dates) {
  const parts = [];
  if (title) parts.push(new TextRun({ text: title, bold: true, size: BODY_SIZE, font: FONT }));
  if (company) parts.push(new TextRun({ text: `, ${company}`, italics: true, size: BODY_SIZE, font: FONT }));
  if (location) parts.push(new TextRun({ text: ` — ${location}`, size: SMALL_SIZE, font: FONT }));
  if (dates) {
    parts.push(new TextRun({ text: '\t' }));
    parts.push(new TextRun({ text: dates, bold: true, size: SMALL_SIZE, font: FONT }));
  }

  return new Paragraph({
    spacing: { before: 30, after: 10 },
    tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    children: parts,
  });
}

function bulletPoint(text) {
  return new Paragraph({
    spacing: { after: 10 },
    indent: { left: convertInchesToTwip(0.25) },
    bullet: { level: 0 },
    alignment: AlignmentType.JUSTIFIED,
    children: [
      new TextRun({ text: text || '', size: SMALL_SIZE, font: FONT }),
    ],
  });
}

module.exports = { generateDocx };
