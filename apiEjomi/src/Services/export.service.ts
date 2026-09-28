import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, AlignmentType, WidthType, BorderStyle,
  ShadingType,
} from 'docx';

const prisma = new PrismaClient();

const CATEGORIE_LABELS: Record<string, string> = {
  LIQUIDE: 'Boissons / Liquides',
  SNACK: 'Snacks',
  REPAS: 'Repas',
};

// ─── PLATS PDF ────────────────────────────────────────────────────────────────

export const exportPlatsPdf = async (entrepriseId?: number): Promise<Buffer> => {
  const plats = await prisma.plat.findMany({
    where: entrepriseId ? { entrepriseId } : {},
    orderBy: [{ categorie: 'asc' }, { libelle: 'asc' }],
  });

  const entreprise = entrepriseId
    ? await prisma.entreprise.findUnique({ where: { id: entrepriseId } })
    : null;

  const grouped: Record<string, typeof plats> = {};
  for (const p of plats) {
    const cat = p.categorie as string;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margins: { top: 40, bottom: 40, left: 40, right: 40 } });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const W = 595 - 80;
      const nomE = entreprise?.nom || 'Mon Établissement';

      // En-tête
      doc.fontSize(18).font('Helvetica-Bold').text(nomE.toUpperCase(), { align: 'center' });
      if (entreprise?.adresse) doc.fontSize(10).font('Helvetica').text(entreprise.adresse, { align: 'center' });
      if (entreprise?.tel) doc.fontSize(10).text(`Tél: ${entreprise.tel}`, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(16).font('Helvetica-Bold').text('LISTE DES PLATS ET BOISSONS', { align: 'center' });
      doc.fontSize(9).font('Helvetica').text(`Édité le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, { align: 'center' });
      doc.moveDown(0.8);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.5);

      const cats = Object.keys(grouped).sort();
      for (const cat of cats) {
        const items = grouped[cat];
        const label = CATEGORIE_LABELS[cat] || cat;

        if (doc.y > 720) { doc.addPage(); }

        // Titre catégorie en gras
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000').text(label.toUpperCase(), 40);
        doc.moveDown(0.3);

        // Lignes : libellé à gauche, prix aligné à droite
        for (const plat of items) {
          if (doc.y > 750) { doc.addPage(); }
          const rowY = doc.y;
          const prix = `${Number(plat.prixVenteUnitaire).toLocaleString('fr-FR')}`;
          doc.fontSize(10).font('Helvetica').fillColor('#000000');
          doc.text(plat.libelle.toUpperCase(), 40, rowY, { width: 410 });
          doc.text(prix, 40, rowY, { width: 515, align: 'right' });
          doc.moveDown(0.5);
        }

        doc.moveDown(0.8);
      }

      doc.end();
    } catch (e) { reject(e); }
  });
};

// ─── PLATS WORD ───────────────────────────────────────────────────────────────

export const exportPlatsWord = async (entrepriseId?: number): Promise<Buffer> => {
  const plats = await prisma.plat.findMany({
    where: entrepriseId ? { entrepriseId } : {},
    orderBy: [{ categorie: 'asc' }, { libelle: 'asc' }],
  });

  const entreprise = entrepriseId
    ? await prisma.entreprise.findUnique({ where: { id: entrepriseId } })
    : null;

  const grouped: Record<string, typeof plats> = {};
  for (const p of plats) {
    const cat = p.categorie as string;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  }

  const nomE = entreprise?.nom || 'Mon Établissement';

  const children: any[] = [
    new Paragraph({ text: nomE.toUpperCase(), heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
    new Paragraph({ children: [new TextRun({ text: 'LISTE DES PLATS ET BOISSONS', bold: true, size: 28 })], alignment: AlignmentType.CENTER }),
    new Paragraph({ children: [new TextRun({ text: `Édité le ${new Date().toLocaleDateString('fr-FR')}`, size: 18, color: '888888' })], alignment: AlignmentType.CENTER }),
    new Paragraph({ text: '' }),
  ];

  const BORDERS = {
    top: { style: BorderStyle.SINGLE, size: 1 },
    bottom: { style: BorderStyle.SINGLE, size: 1 },
    left: { style: BorderStyle.SINGLE, size: 1 },
    right: { style: BorderStyle.SINGLE, size: 1 },
    insideH: { style: BorderStyle.SINGLE, size: 1 },
    insideV: { style: BorderStyle.SINGLE, size: 1 },
  };

  const cats = Object.keys(grouped).sort();
  for (const cat of cats) {
    const items = grouped[cat];
    const label = CATEGORIE_LABELS[cat] || cat;

    // Titre catégorie
    children.push(new Paragraph({
      children: [new TextRun({ text: label.toUpperCase(), bold: true, size: 24 })],
      spacing: { before: 300, after: 60 },
    }));

    // Une ligne par plat : libellé à gauche, prix à droite via tabulation
    for (const plat of items) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: plat.libelle.toUpperCase(), size: 22 }),
          new TextRun({ text: '\t' }),
          new TextRun({ text: `${Number(plat.prixVenteUnitaire).toLocaleString('fr-FR')}`, size: 22 }),
        ],
        tabStops: [{ type: 'right' as any, position: 9000 }],
        spacing: { after: 40 },
      }));
    }

    children.push(new Paragraph({ text: '', spacing: { after: 200 } } as any));
  }

  children.push(new Paragraph({ children: [new TextRun({ text: `Total : ${plats.length} article(s)`, bold: true })], alignment: AlignmentType.RIGHT }));

  return Packer.toBuffer(new Document({ sections: [{ children }] }));
};

// ─── PRODUITS PDF ─────────────────────────────────────────────────────────────

export const exportProduitsPdf = async (entrepriseId?: number): Promise<Buffer> => {
  const produits = await prisma.produit.findMany({
    where: entrepriseId ? { entrepriseId } : {},
    orderBy: { libelle: 'asc' },
  });

  const entreprise = entrepriseId
    ? await prisma.entreprise.findUnique({ where: { id: entrepriseId } })
    : null;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margins: { top: 40, bottom: 40, left: 40, right: 40 } });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const W = 595 - 80;
      const nomE = entreprise?.nom || 'Mon Établissement';

      // En-tête
      doc.fontSize(18).font('Helvetica-Bold').text(nomE.toUpperCase(), { align: 'center' });
      if (entreprise?.adresse) doc.fontSize(10).font('Helvetica').text(entreprise.adresse, { align: 'center' });
      if (entreprise?.tel) doc.fontSize(10).text(`Tél: ${entreprise.tel}`, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(16).font('Helvetica-Bold').text('LISTE DES PRODUITS', { align: 'center' });
      doc.fontSize(9).font('Helvetica').text(`Édité le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, { align: 'center' });
      doc.moveDown(0.8);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.5);

      // En-têtes colonnes : Libellé | Prix de vente
      const colDesignation = 40;
      const colPrix = 460;
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#555555');
      const yH = doc.y;
      doc.text('Désignation', colDesignation, yH, { width: 410 });
      doc.text('Prix de vente (FCFA)', colPrix, yH, { width: 95, align: 'right' });
      doc.moveDown(0.3);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#cccccc').stroke();
      doc.moveDown(0.2);

      let alt = false;
      for (const produit of produits) {
        if (doc.y > 750) { doc.addPage(); }
        const rowY = doc.y;
        if (alt) {
          doc.rect(40, rowY - 2, W, 18).fillColor('#f7f7f7').fill();
        }
        doc.fontSize(9).font('Helvetica').fillColor('#000000');
        doc.text(produit.libelle, colDesignation, rowY, { width: 410 });
        doc.text(`${Number(produit.prixDeVenteUnitaire).toLocaleString('fr-FR')}`, colPrix, rowY, { width: 95, align: 'right' });
        doc.moveDown(0.6);
        alt = !alt;
      }

      doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#333333').stroke();
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000').text(`Total : ${produits.length} produit(s)`, { align: 'right' });

      doc.end();
    } catch (e) { reject(e); }
  });
};

// ─── PRODUITS WORD ────────────────────────────────────────────────────────────

export const exportProduitsWord = async (entrepriseId?: number): Promise<Buffer> => {
  const produits = await prisma.produit.findMany({
    where: entrepriseId ? { entrepriseId } : {},
    orderBy: { libelle: 'asc' },
  });

  const entreprise = entrepriseId
    ? await prisma.entreprise.findUnique({ where: { id: entrepriseId } })
    : null;

  const nomE = entreprise?.nom || 'Mon Établissement';

  const BORDERS = {
    top: { style: BorderStyle.SINGLE, size: 1 },
    bottom: { style: BorderStyle.SINGLE, size: 1 },
    left: { style: BorderStyle.SINGLE, size: 1 },
    right: { style: BorderStyle.SINGLE, size: 1 },
    insideH: { style: BorderStyle.SINGLE, size: 1 },
    insideV: { style: BorderStyle.SINGLE, size: 1 },
  };

  const headerRow = new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Désignation', bold: true })] })], shading: { type: ShadingType.CLEAR, fill: 'E8E8E8' }, width: { size: 70, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Prix de vente (FCFA)', bold: true })] })], shading: { type: ShadingType.CLEAR, fill: 'E8E8E8' }, width: { size: 30, type: WidthType.PERCENTAGE } }),
    ],
  });

  const rows = [headerRow, ...produits.map((produit, i) => {
    const shade = i % 2 === 1 ? { type: ShadingType.CLEAR, fill: 'F5F5F5' } : undefined;
    return new TableRow({
      children: [
        new TableCell({ children: [new Paragraph(produit.libelle)], shading: shade }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${Number(produit.prixDeVenteUnitaire).toLocaleString('fr-FR')}` })], alignment: AlignmentType.RIGHT })], shading: shade }),
      ],
    });
  })];

  return Packer.toBuffer(new Document({
    sections: [{
      children: [
        new Paragraph({ text: nomE.toUpperCase(), heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [new TextRun({ text: 'LISTE DES PRODUITS', bold: true, size: 28 })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [new TextRun({ text: `Édité le ${new Date().toLocaleDateString('fr-FR')}`, size: 18, color: '888888' })], alignment: AlignmentType.CENTER }),
        new Paragraph({ text: '' }),
        new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE }, borders: BORDERS }),
        new Paragraph({ text: '' }),
        new Paragraph({ children: [new TextRun({ text: `Total : ${produits.length} produit(s)`, bold: true })], alignment: AlignmentType.RIGHT }),
      ],
    }],
  }));
};
