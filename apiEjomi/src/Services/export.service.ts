import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, AlignmentType, WidthType, BorderStyle,
  ShadingType, ImageRun,
} from 'docx';

const prisma = new PrismaClient();

const UPLOADS_DIR = '/app/uploads';

const CATEGORIE_LABELS: Record<string, string> = {
  LIQUIDE: 'Boissons / Liquides',
  SNACK: 'Snacks',
  REPAS: 'Repas',
};

const IMG_W_PDF = 45;
const IMG_H_PDF = 45;
const IMG_GAP = 16;
const IMG_W_WORD = 55;
const IMG_H_WORD = 55;

function getImagePath(filename: string | null): string | null {
  if (!filename) return null;
  const p = path.join(UPLOADS_DIR, filename);
  return fs.existsSync(p) ? p : null;
}

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

      const nomE = entreprise?.nom || 'Mon Établissement';

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

        if (doc.y > 700) { doc.addPage(); }

        doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000').text(label.toUpperCase(), 40);
        doc.moveDown(0.3);

        for (const plat of items) {
          const rowH = IMG_H_PDF + 8;
          if (doc.y > 750) { doc.addPage(); }
          const rowY = doc.y;
          const imgPath = getImagePath(plat.image);

          // Image à gauche
          if (imgPath) {
            try {
              doc.image(imgPath, 40, rowY, { width: IMG_W_PDF, height: IMG_H_PDF, fit: [IMG_W_PDF, IMG_H_PDF] });
            } catch (_) {}
          } else {
            // Placeholder gris
            doc.rect(40, rowY, IMG_W_PDF, IMG_H_PDF).fillColor('#eeeeee').fill();
            doc.fillColor('#000000');
          }

          // Libellé et prix à droite de l'image
          const textX = 40 + IMG_W_PDF + IMG_GAP;
          const prix = `${Number(plat.prixVenteUnitaire).toLocaleString('fr-FR')} FCFA`;
          doc.fontSize(10).font('Helvetica').fillColor('#000000');
          doc.text(plat.libelle.toUpperCase(), textX, rowY + (IMG_H_PDF / 2) - 6, { width: 515 - textX });
          doc.text(prix, textX, rowY + (IMG_H_PDF / 2) - 6, { width: 515 - textX + (515 - textX - (515 - 40)), align: 'right' });
          doc.text(prix, 40, rowY + (IMG_H_PDF / 2) - 6, { width: 515, align: 'right' });

          doc.y = rowY + rowH;
          doc.moveDown(0.3);
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

  const BORDERS = {
    top: { style: BorderStyle.SINGLE, size: 1 },
    bottom: { style: BorderStyle.SINGLE, size: 1 },
    left: { style: BorderStyle.SINGLE, size: 1 },
    right: { style: BorderStyle.SINGLE, size: 1 },
    insideH: { style: BorderStyle.SINGLE, size: 1 },
    insideV: { style: BorderStyle.SINGLE, size: 1 },
  };

  const children: any[] = [
    new Paragraph({ text: nomE.toUpperCase(), heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
    new Paragraph({ children: [new TextRun({ text: 'LISTE DES PLATS ET BOISSONS', bold: true, size: 28 })], alignment: AlignmentType.CENTER }),
    new Paragraph({ children: [new TextRun({ text: `Édité le ${new Date().toLocaleDateString('fr-FR')}`, size: 18, color: '888888' })], alignment: AlignmentType.CENTER }),
    new Paragraph({ text: '' }),
  ];

  const cats = Object.keys(grouped).sort();
  for (const cat of cats) {
    const items = grouped[cat];
    const label = CATEGORIE_LABELS[cat] || cat;

    children.push(new Paragraph({
      children: [new TextRun({ text: label.toUpperCase(), bold: true, size: 24 })],
      spacing: { before: 300, after: 100 },
    }));

    // Tableau avec 3 colonnes : Image | Libellé | Prix
    const headerRow = new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Image', bold: true })] })], shading: { type: ShadingType.CLEAR, fill: 'E8E8E8' }, width: { size: 15, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Libellé', bold: true })] })], shading: { type: ShadingType.CLEAR, fill: 'E8E8E8' }, width: { size: 60, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Prix de vente', bold: true })] })], shading: { type: ShadingType.CLEAR, fill: 'E8E8E8' }, width: { size: 25, type: WidthType.PERCENTAGE } }),
      ],
    });

    const rows = [headerRow, ...items.map((plat, i) => {
      const shade = i % 2 === 1 ? { type: ShadingType.CLEAR, fill: 'F5F5F5' } : undefined;
      const imgPath = getImagePath(plat.image);
      let imgCell: any;

      if (imgPath) {
        try {
          const imgBuffer = fs.readFileSync(imgPath);
          const ext = path.extname(imgPath).toLowerCase().replace('.', '');
          const type = ext === 'png' ? 'png' : 'jpg';
          imgCell = new TableCell({
            children: [new Paragraph({ children: [new ImageRun({ data: imgBuffer, transformation: { width: IMG_W_WORD, height: IMG_H_WORD }, type } as any)] })],
            shading: shade,
            width: { size: 15, type: WidthType.PERCENTAGE },
          });
        } catch (_) {
          imgCell = new TableCell({ children: [new Paragraph('')], shading: shade, width: { size: 15, type: WidthType.PERCENTAGE }, margins: { top: 80, bottom: 80, left: 80, right: 120 } });
        }
      } else {
        imgCell = new TableCell({ children: [new Paragraph('')], shading: shade, width: { size: 15, type: WidthType.PERCENTAGE }, margins: { top: 80, bottom: 80, left: 80, right: 120 } });
      }

      return new TableRow({
        children: [
          imgCell,
          new TableCell({ children: [new Paragraph(plat.libelle.toUpperCase())], shading: shade, width: { size: 60, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${Number(plat.prixVenteUnitaire).toLocaleString('fr-FR')} FCFA` })], alignment: AlignmentType.RIGHT })], shading: shade, width: { size: 25, type: WidthType.PERCENTAGE } }),
        ],
      });
    })];

    children.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE }, borders: BORDERS }));
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

      const nomE = entreprise?.nom || 'Mon Établissement';

      doc.fontSize(18).font('Helvetica-Bold').text(nomE.toUpperCase(), { align: 'center' });
      if (entreprise?.adresse) doc.fontSize(10).font('Helvetica').text(entreprise.adresse, { align: 'center' });
      if (entreprise?.tel) doc.fontSize(10).text(`Tél: ${entreprise.tel}`, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(16).font('Helvetica-Bold').text('LISTE DES PRODUITS', { align: 'center' });
      doc.fontSize(9).font('Helvetica').text(`Édité le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, { align: 'center' });
      doc.moveDown(0.8);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.5);

      // En-têtes : Image | Désignation | Prix
      const colImg = 40;
      const colLib = 40 + IMG_W_PDF + IMG_GAP;
      const colPrix = 460;
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#555555');
      const yH = doc.y;
      doc.text('Image', colImg, yH, { width: IMG_W_PDF });
      doc.text('Désignation', colLib, yH, { width: 300 });
      doc.text('Prix de vente (FCFA)', colPrix, yH, { width: 95, align: 'right' });
      doc.moveDown(0.3);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#cccccc').stroke();
      doc.moveDown(0.2);

      let alt = false;
      for (const produit of produits) {
        const rowH = IMG_H_PDF + 8;
        if (doc.y > 740) { doc.addPage(); }
        const rowY = doc.y;

        if (alt) {
          doc.rect(40, rowY - 2, 515, rowH).fillColor('#f7f7f7').fill();
        }

        const imgPath = getImagePath(produit.image);
        if (imgPath) {
          try {
            doc.image(imgPath, colImg, rowY, { width: IMG_W_PDF, height: IMG_H_PDF, fit: [IMG_W_PDF, IMG_H_PDF] });
          } catch (_) {
            doc.rect(colImg, rowY, IMG_W_PDF, IMG_H_PDF).fillColor('#eeeeee').fill();
          }
        } else {
          doc.rect(colImg, rowY, IMG_W_PDF, IMG_H_PDF).fillColor('#eeeeee').fill();
        }

        const textY = rowY + (IMG_H_PDF / 2) - 6;
        doc.fontSize(9).font('Helvetica').fillColor('#000000');
        doc.text(produit.libelle, colLib, textY, { width: colPrix - colLib - 10 });
        doc.text(`${Number(produit.prixDeVenteUnitaire).toLocaleString('fr-FR')}`, colPrix, textY, { width: 95, align: 'right' });

        doc.y = rowY + rowH;
        doc.moveDown(0.2);
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
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Image', bold: true })] })], shading: { type: ShadingType.CLEAR, fill: 'E8E8E8' }, width: { size: 15, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Désignation', bold: true })] })], shading: { type: ShadingType.CLEAR, fill: 'E8E8E8' }, width: { size: 60, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Prix de vente (FCFA)', bold: true })] })], shading: { type: ShadingType.CLEAR, fill: 'E8E8E8' }, width: { size: 25, type: WidthType.PERCENTAGE } }),
    ],
  });

  const rows = [headerRow, ...produits.map((produit, i) => {
    const shade = i % 2 === 1 ? { type: ShadingType.CLEAR, fill: 'F5F5F5' } : undefined;
    const imgPath = getImagePath(produit.image);
    let imgCell: any;

    if (imgPath) {
      try {
        const imgBuffer = fs.readFileSync(imgPath);
        const ext = path.extname(imgPath).toLowerCase().replace('.', '');
        const type = ext === 'png' ? 'png' : 'jpg';
        imgCell = new TableCell({
          children: [new Paragraph({ children: [new ImageRun({ data: imgBuffer, transformation: { width: IMG_W_WORD, height: IMG_H_WORD }, type } as any)] })],
          shading: shade,
          width: { size: 15, type: WidthType.PERCENTAGE },
          margins: { top: 80, bottom: 80, left: 80, right: 120 },
        });
      } catch (_) {
        imgCell = new TableCell({ children: [new Paragraph('')], shading: shade, width: { size: 15, type: WidthType.PERCENTAGE }, margins: { top: 80, bottom: 80, left: 80, right: 120 } });
      }
    } else {
      imgCell = new TableCell({ children: [new Paragraph('')], shading: shade, width: { size: 15, type: WidthType.PERCENTAGE } });
    }

    return new TableRow({
      children: [
        imgCell,
        new TableCell({ children: [new Paragraph(produit.libelle)], shading: shade, width: { size: 60, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${Number(produit.prixDeVenteUnitaire).toLocaleString('fr-FR')} FCFA` })], alignment: AlignmentType.RIGHT })], shading: shade, width: { size: 25, type: WidthType.PERCENTAGE } }),
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
