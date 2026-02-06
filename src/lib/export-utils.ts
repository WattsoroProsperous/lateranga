import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type {
  DailyProfitData,
  ProfitSummary,
  ItemProfitData,
  PeakHourData,
} from "@/actions/reports.actions";

interface ExportData {
  summary: ProfitSummary;
  dailyData: DailyProfitData[];
  topItems: ItemProfitData[];
  peakHours: PeakHourData[];
  trends: Array<{
    week: number;
    startDate: string;
    endDate: string;
    revenue: number;
    cost: number;
    profit: number;
    orders: number;
    avgOrderValue: number;
  }>;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-SN", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + " FCFA";
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ============================================
// PDF Export
// ============================================

export function exportToPDF(data: ExportData, title: string = "Rapport Financier") {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(title, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 10;

  // Subtitle with date
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Genere le ${new Date().toLocaleDateString("fr-FR")} a ${new Date().toLocaleTimeString("fr-FR")}`,
    pageWidth / 2,
    yPosition,
    { align: "center" }
  );
  yPosition += 15;

  // Summary Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Resume", 14, yPosition);
  yPosition += 8;

  autoTable(doc, {
    startY: yPosition,
    head: [["Indicateur", "Valeur"]],
    body: [
      ["Chiffre d'affaires", formatCurrency(data.summary.totalRevenue)],
      ["Couts totaux", formatCurrency(data.summary.totalCost)],
      ["Benefice net", formatCurrency(data.summary.totalProfit)],
      ["Marge beneficiaire", `${data.summary.profitMargin.toFixed(1)}%`],
      ["Nombre de commandes", data.summary.totalOrders.toString()],
      ["Panier moyen", formatCurrency(data.summary.averageOrderValue)],
      ["Benefice moyen/commande", formatCurrency(data.summary.averageProfit)],
    ],
    theme: "striped",
    headStyles: { fillColor: [0, 119, 182] },
    margin: { left: 14, right: 14 },
  });

  yPosition = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Daily Data Section
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Donnees journalieres", 14, yPosition);
  yPosition += 8;

  const dailyRows = data.dailyData.slice(-14).map((d) => [
    formatDate(d.date),
    formatCurrency(d.revenue),
    formatCurrency(d.cost),
    formatCurrency(d.profit),
    `${d.profitMargin.toFixed(1)}%`,
    d.orders.toString(),
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [["Date", "Revenu", "Cout", "Benefice", "Marge", "Commandes"]],
    body: dailyRows,
    theme: "striped",
    headStyles: { fillColor: [0, 119, 182] },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8 },
  });

  yPosition = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Top Items Section
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Top articles par rentabilite", 14, yPosition);
  yPosition += 8;

  const itemRows = data.topItems.slice(0, 15).map((item) => [
    item.itemName,
    item.categoryName,
    formatCurrency(item.salePrice),
    formatCurrency(item.costPrice),
    `${item.profitMargin.toFixed(1)}%`,
    item.totalSold.toString(),
    formatCurrency(item.totalProfit),
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [["Article", "Categorie", "Prix", "Cout", "Marge", "Vendus", "Benefice total"]],
    body: itemRows,
    theme: "striped",
    headStyles: { fillColor: [0, 119, 182] },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 7 },
  });

  yPosition = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Trends Section
  if (yPosition > 220) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Tendances hebdomadaires", 14, yPosition);
  yPosition += 8;

  const trendRows = data.trends.map((t) => [
    `Semaine ${t.week}`,
    `${formatDate(t.startDate)} - ${formatDate(t.endDate)}`,
    formatCurrency(t.revenue),
    formatCurrency(t.cost),
    formatCurrency(t.profit),
    t.orders.toString(),
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [["Semaine", "Periode", "Revenu", "Cout", "Benefice", "Commandes"]],
    body: trendRows,
    theme: "striped",
    headStyles: { fillColor: [0, 119, 182] },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8 },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `La Teranga - Page ${i} sur ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  // Download
  const filename = `rapport-benefices-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}

// ============================================
// Excel Export
// ============================================

export function exportToExcel(data: ExportData, title: string = "Rapport Financier") {
  const workbook = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    ["Rapport Financier - La Teranga"],
    [`Genere le: ${new Date().toLocaleDateString("fr-FR")}`],
    [],
    ["RESUME"],
    ["Indicateur", "Valeur"],
    ["Chiffre d'affaires", data.summary.totalRevenue],
    ["Couts totaux", data.summary.totalCost],
    ["Benefice net", data.summary.totalProfit],
    ["Marge beneficiaire (%)", data.summary.profitMargin],
    ["Nombre de commandes", data.summary.totalOrders],
    ["Panier moyen", data.summary.averageOrderValue],
    ["Benefice moyen/commande", data.summary.averageProfit],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet["!cols"] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Resume");

  // Daily Data Sheet
  const dailyHeaders = ["Date", "Revenu (FCFA)", "Cout (FCFA)", "Benefice (FCFA)", "Marge (%)", "Commandes"];
  const dailyRows = data.dailyData.map((d) => [
    d.date,
    d.revenue,
    d.cost,
    d.profit,
    d.profitMargin,
    d.orders,
  ]);

  const dailySheet = XLSX.utils.aoa_to_sheet([dailyHeaders, ...dailyRows]);
  dailySheet["!cols"] = [
    { wch: 12 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 10 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(workbook, dailySheet, "Donnees Journalieres");

  // Items Sheet
  const itemHeaders = [
    "Article",
    "Categorie",
    "Prix vente (FCFA)",
    "Cout (FCFA)",
    "Benefice/u (FCFA)",
    "Marge (%)",
    "Quantite vendue",
    "Revenu total (FCFA)",
    "Benefice total (FCFA)",
  ];
  const itemRows = data.topItems.map((item) => [
    item.itemName,
    item.categoryName,
    item.salePrice,
    item.costPrice,
    item.profit,
    item.profitMargin,
    item.totalSold,
    item.totalRevenue,
    item.totalProfit,
  ]);

  const itemsSheet = XLSX.utils.aoa_to_sheet([itemHeaders, ...itemRows]);
  itemsSheet["!cols"] = [
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 10 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(workbook, itemsSheet, "Marges Articles");

  // Trends Sheet
  const trendHeaders = [
    "Semaine",
    "Date debut",
    "Date fin",
    "Revenu (FCFA)",
    "Cout (FCFA)",
    "Benefice (FCFA)",
    "Commandes",
    "Panier moyen (FCFA)",
  ];
  const trendRows = data.trends.map((t) => [
    t.week,
    t.startDate,
    t.endDate,
    t.revenue,
    t.cost,
    t.profit,
    t.orders,
    t.avgOrderValue,
  ]);

  const trendsSheet = XLSX.utils.aoa_to_sheet([trendHeaders, ...trendRows]);
  trendsSheet["!cols"] = [
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(workbook, trendsSheet, "Tendances");

  // Peak Hours Sheet
  const peakHeaders = ["Heure", "Total commandes", "Moyenne/jour"];
  const peakRows = data.peakHours.map((p) => [
    `${p.hour}h`,
    p.totalOrders,
    p.avgOrdersPerDay,
  ]);

  const peakSheet = XLSX.utils.aoa_to_sheet([peakHeaders, ...peakRows]);
  peakSheet["!cols"] = [{ wch: 10 }, { wch: 18 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, peakSheet, "Heures de Pointe");

  // Download
  const filename = `rapport-benefices-${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

// ============================================
// Stock Report Export
// ============================================

interface StockReportData {
  lowStockItems: Array<{
    item_type: string;
    name: string;
    current_quantity: number;
    min_threshold: number;
    unit: string;
  }>;
  movements: Array<{
    created_at: string;
    movement_type: string;
    quantity: number;
    item_name: string;
    note?: string;
  }>;
}

export function exportStockReportToPDF(data: StockReportData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Rapport de Stock", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Genere le ${new Date().toLocaleDateString("fr-FR")}`,
    pageWidth / 2,
    yPosition,
    { align: "center" }
  );
  yPosition += 15;

  // Low Stock Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Articles en stock bas", 14, yPosition);
  yPosition += 8;

  if (data.lowStockItems.length > 0) {
    const lowStockRows = data.lowStockItems.map((item) => [
      item.item_type === "stock_item" ? "Boisson/Dessert" : "Ingredient",
      item.name,
      `${item.current_quantity} ${item.unit}`,
      `${item.min_threshold} ${item.unit}`,
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Type", "Nom", "Quantite actuelle", "Seuil minimum"]],
      body: lowStockRows,
      theme: "striped",
      headStyles: { fillColor: [239, 68, 68] },
      margin: { left: 14, right: 14 },
    });

    yPosition = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Aucun article en stock bas", 14, yPosition);
    yPosition += 15;
  }

  // Footer
  doc.setFontSize(8);
  doc.text(
    "La Teranga - Rapport de Stock",
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: "center" }
  );

  const filename = `rapport-stock-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}
