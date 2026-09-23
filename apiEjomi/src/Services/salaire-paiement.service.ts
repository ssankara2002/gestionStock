import { PrismaClient } from "@prisma/client"
import PDFDocument from 'pdfkit'

const prisma = new PrismaClient()

const getAll = async (entrepriseId?: number) => {
  const where: any = entrepriseId ? { employe: { user: { entrepriseId } } } : {};
  return await prisma.salairePaiement.findMany({
    where,
    include: {
      employe: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      datePaiement: "desc",
    },
  })
}

const getByEmployeId = async (employeId: number) => {
  return await prisma.salairePaiement.findMany({
    where: { employeId },
    orderBy: { updatedAt: "desc" },
  })
}

const create = async (data: any) => {
  const avantage = Number(data.avantage ?? 0)
  const indemnite = Number(data.indemnite ?? 0)
  const montantNet = Number(data.montant) + avantage + indemnite

  return await prisma.salairePaiement.create({
    data: {
      employeId: data.employeId,
      montant: montantNet,
      datePaiement: data.datePaiement,
      modePaiement: data.modePaiement,
      periode: data.periode ? new Date(data.periode) : null,
      avantage,
      indemnite,
    },
  })
}

const deletePaiement = async (id: number) => {
  return await prisma.salairePaiement.delete({
    where: { id },
  })
}

const getById = async (id: number) => {
  return await prisma.salairePaiement.findUnique({
    where: { id },
    include: {
      employe: {
        include: {
          user: true,
        },
      },
    },
  })
}

/**
 * Génère un bulletin de paie au format PDF A5
 */
const generateBulletinPaiePdf = async (paiementId: number): Promise<Buffer | null> => {
  const paiement = await getById(paiementId)

  if (!paiement) {
    return null
  }

  return new Promise((resolve, reject) => {
    try {
      // Créer un document PDF au format A5 (148 x 210 mm = 419.53 x 595.28 points)
      const doc = new PDFDocument({
        size: [419.53, 595.28],
        margins: { top: 30, bottom: 30, left: 30, right: 30 },
      })

      const chunks: Buffer[] = []

      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // En-tête
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('BULLETIN DE PAIE', { align: 'center' })
        .moveDown(0.3)

      doc
        .fontSize(9)
        .font('Helvetica')
        .text('GoldStore - Équipement de Détection d\'Or', { align: 'center' })
        .moveDown(0.2)
        .text(`Période: ${new Date(paiement.datePaiement).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`, { align: 'center' })
        .moveDown(0.8)

      // Ligne de séparation
      doc
        .moveTo(30, doc.y)
        .lineTo(419.53 - 30, doc.y)
        .stroke()
        .moveDown(0.5)

      // Informations employeur et employé (2 colonnes)
      const leftColumn = 40
      const rightColumn = 220
      const startY = doc.y

      // Colonne gauche - Employeur
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('EMPLOYEUR', leftColumn, startY, { underline: true })
        .moveDown(0.3)

      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('GoldStore', leftColumn, doc.y)
        .font('Helvetica')
        .text('123 Avenue de la République', leftColumn, doc.y + 12)
        .text('Lomé, Togo', leftColumn, doc.y + 12)
        .text('NINEA: 123456789', leftColumn, doc.y + 12)

      // Colonne droite - Employé
      doc.y = startY
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('EMPLOYÉ', rightColumn, doc.y, { underline: true })
        .moveDown(0.3)

      const employe = paiement.employe
      const employeNom = employe?.user ? `${employe.user.prenom} ${employe.user.nom}` : 'N/A'

      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(employeNom, rightColumn, doc.y)
        .font('Helvetica')
        .text(`Matricule: EMP-${paiement.employeId.toString().padStart(4, '0')}`, rightColumn, doc.y + 12)
        .text(`Date embauche: ${employe?.dateEmbauche ? new Date(employe.dateEmbauche).toLocaleDateString('fr-FR') : 'N/A'}`, rightColumn, doc.y + 12)
        .text(`Paiement: ${new Date(paiement.datePaiement).toLocaleDateString('fr-FR')}`, rightColumn, doc.y + 12)

      doc.y = Math.max(doc.y, startY + 70)
      doc.moveDown(0.8)

      // Ligne de séparation
      doc
        .moveTo(30, doc.y)
        .lineTo(419.53 - 30, doc.y)
        .stroke()
        .moveDown(0.5)

      // DÉTAILS DE LA RÉMUNÉRATION
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('DÉTAILS DE LA RÉMUNÉRATION', { underline: true })
        .moveDown(0.4)

      // Tableau des détails
      const tableTop = doc.y
      const col1X = 40
      const col2X = 300

      // En-tête du tableau
      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .rect(col1X, tableTop, 339.53, 18)
        .fillAndStroke('#f0f0f0', '#000000')
        .fillColor('#000000')
        .text('Libellé', col1X + 5, tableTop + 5)
        .text('Montant', col2X + 5, tableTop + 5)

      let currentY = tableTop + 18

      // Lignes du tableau
      const avantage = Number((paiement as any).avantage ?? 0)
      const indemnite = Number((paiement as any).indemnite ?? 0)
      const totalBrut = Number(paiement.montant)
      const salaireBase = totalBrut - avantage - indemnite
      const items = [
        { libelle: 'Salaire de base', montant: salaireBase },
        { libelle: 'Avantages', montant: avantage },
        { libelle: 'Indemnités', montant: indemnite },
      ]

      doc.font('Helvetica')
      items.forEach((item, index) => {
        const bgColor = index % 2 === 0 ? '#ffffff' : '#f9f9f9'
        doc
          .rect(col1X, currentY, 339.53, 15)
          .fillAndStroke(bgColor, '#cccccc')
          .fillColor('#000000')
          .text(item.libelle, col1X + 5, currentY + 3)
          .text(`${item.montant.toLocaleString()} FCFA`, col2X + 5, currentY + 3)
        currentY += 15
      })

      // Total brut
      doc
        .font('Helvetica-Bold')
        .rect(col1X, currentY, 339.53, 15)
        .fillAndStroke('#e0e0e0', '#000000')
        .fillColor('#000000')
        .text('TOTAL BRUT', col1X + 5, currentY + 3)
        .text(`${totalBrut.toLocaleString()} FCFA`, col2X + 5, currentY + 3)

      currentY += 25
      doc.y = currentY

      // COTISATIONS SOCIALES
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('COTISATIONS SOCIALES', { underline: true })
        .moveDown(0.4)

      const cotisTableTop = doc.y
      const cotCol1X = 40
      const cotCol2X = 220
      const cotCol3X = 300

      // En-tête
      doc
        .fontSize(8)
        .rect(cotCol1X, cotisTableTop, 339.53, 18)
        .fillAndStroke('#f0f0f0', '#000000')
        .fillColor('#000000')
        .text('Nature', cotCol1X + 5, cotisTableTop + 5)
        .text('Part sal.', cotCol2X + 5, cotisTableTop + 5)
        .text('Part patr.', cotCol3X + 5, cotisTableTop + 5)

      currentY = cotisTableTop + 18

      const cotisations = [
        { nature: 'Sécurité sociale', partSal: 0, partPatr: 0 },
        { nature: 'Retraite', partSal: 0, partPatr: 0 },
      ]

      doc.font('Helvetica')
      cotisations.forEach((coti, index) => {
        const bgColor = index % 2 === 0 ? '#ffffff' : '#f9f9f9'
        doc
          .rect(cotCol1X, currentY, 339.53, 15)
          .fillAndStroke(bgColor, '#cccccc')
          .fillColor('#000000')
          .text(coti.nature, cotCol1X + 5, currentY + 3)
          .text(`${coti.partSal} FCFA`, cotCol2X + 5, currentY + 3)
          .text(`${coti.partPatr} FCFA`, cotCol3X + 5, currentY + 3)
        currentY += 15
      })

      // Total cotisations
      doc
        .font('Helvetica-Bold')
        .rect(cotCol1X, currentY, 339.53, 15)
        .fillAndStroke('#e0e0e0', '#000000')
        .fillColor('#000000')
        .text('TOTAL COTISATIONS', cotCol1X + 5, currentY + 3)
        .text('0 FCFA', cotCol2X + 5, currentY + 3)
        .text('0 FCFA', cotCol3X + 5, currentY + 3)

      currentY += 25
      doc.y = currentY

      // NET À PAYER (encadré)
      doc
        .rect(40, doc.y, 339.53, 35)
        .fillAndStroke('#2c3e50', '#2c3e50')
        .fillColor('#ffffff')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('NET À PAYER', 50, doc.y + 8)
        .fontSize(14)
        .text(`${totalBrut.toLocaleString()} FCFA`, 250, doc.y + 8)
        .fontSize(7)
        .font('Helvetica')
        .text(`Mode: ${paiement.modePaiement}`, 50, doc.y + 24)

      doc.y += 45
      doc.fillColor('#000000')

      // Pied de page
      doc
        .fontSize(7)
        .font('Helvetica-Oblique')
        .text('Ce bulletin de paie est conforme à la législation en vigueur.', { align: 'center' })
        .moveDown(0.2)
        .fontSize(6)
        .text(`Document généré le ${new Date().toLocaleString('fr-FR')}`, { align: 'center' })

      // Finaliser le PDF
      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

export default {
  getAll,
  getById,
  getByEmployeId,
  create,
  delete: deletePaiement,
  generateBulletinPaiePdf,
}