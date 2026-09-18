import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const STORE = {
  name: "Shoe World",
  tagline: "Premium Footwear & Fashion",
  website: "softchappal.com",
  email: "kashanrana004@gmail.com",
  phone: "03036157070",
  address: "Multan, Punjab, Pakistan",
  easypaisa: "03181664079",
  owner: "Kashan",
  instagram: "https://www.instagram.com/softchappaloffical",
};

interface OrderItem {
  productName: string;
  productImageUrl?: string;
  color?: string;
  size?: string;
  quantity: number;
  price: number;
}

interface InvoiceOrder {
  id: number;
  createdAt: string | null | undefined;
  status: string;
  total: number;
  userEmail?: string;
  customerPhone?: string;
  paymentMethod?: string;
  shippingAddress: Record<string, string | undefined>;
  items: OrderItem[];
}

const pkr = (n: number) => `PKR ${n.toLocaleString("en-PK")}`;

function fmtDate(d: string | null | undefined): string {
  if (!d) return "N/A";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "N/A" : dt.toLocaleDateString("en-PK", { 
    year: "numeric", 
    month: "short", 
    day: "numeric" 
  });
}

export function downloadOrderInvoice(order: InvoiceOrder): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const mg = 15;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(36);
  doc.setTextColor(0, 0, 0);
  doc.text("INVOICE", mg, 25);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  
  const detailsY = 32;
  doc.text(`INVOICE NUMBER: #${String(order.id).padStart(5, "0")}`, mg, detailsY);
  doc.text(`INVOICE DATE: ${fmtDate(order.createdAt)}`, mg, detailsY + 4);
  doc.text(`DUE DATE: ${fmtDate(order.createdAt)}`, mg, detailsY + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(STORE.name.toUpperCase(), W - mg, 20, { align: "right" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  
  const companyLines = [
    STORE.address,
    `Phone: ${STORE.phone}`,
    `Email: ${STORE.email}`,
    STORE.website
  ];
  
  companyLines.forEach((line, i) => {
    doc.text(line, W - mg, 26 + (i * 4), { align: "right" });
  });

  const sectionY = 55;
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text("FROM:", mg, sectionY);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(70, 70, 70);
  
  const fromLines = [
    STORE.name,
    STORE.address,
    STORE.phone,
    STORE.email
  ];
  
  fromLines.forEach((line, i) => {
    doc.text(line, mg, sectionY + 5 + (i * 4));
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text("BILL TO:", W - mg, sectionY, { align: "right" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(70, 70, 70);
  
  const addr = order.shippingAddress;
  const billLines = [
    addr?.fullName || "Customer Name",
    addr?.line1 || "Address Line 1",
    addr?.line2 || "",
    [addr?.city, addr?.state, addr?.zip].filter(Boolean).join(", ") || "City, Postal Code",
    order.customerPhone || ""
  ].filter(line => line);
  
  billLines.forEach((line, i) => {
    doc.text(line, W - mg, sectionY + 5 + (i * 4), { align: "right" });
  });

  const shipY = sectionY + 30;
  
  doc.setFillColor(248, 248, 248);
  doc.rect(mg, shipY, W - (mg * 2), 10, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text("SHIPPING INFORMATION", mg + 3, shipY + 4);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  doc.text("Delivery: 5 to 6 working days | Shipping from all over Pakistan", mg + 3, shipY + 8);

  const tableY = shipY + 16;
  const items = Array.isArray(order.items) ? order.items : [];

  autoTable(doc, {
    startY: tableY,
    head: [["#", "ITEMS", "COLOR", "SIZE", "PRICE", "QTY", "TOTAL", "COLLECTION"]],
    body: items.map((it, index) => [
      `${index + 1}`,
      it.productName || "—",
      it.color || "—",
      it.size || "—",
      pkr(it.price),
      `${it.quantity}`,
      pkr(it.price * it.quantity),
      "S-Trend",
    ]),
    margin: { left: mg, right: mg },
     tableWidth: W - (mg * 2),
    styles: {
      font: "helvetica",
      fontSize: 8,
      textColor: [50, 50, 50],
      fillColor: [255, 255, 255],
      lineColor: [230, 230, 230],
      lineWidth: 0.3,
      cellPadding: { top: 4, bottom: 4, left: 2, right: 2 },
      halign: "left",
    },
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "left",
      cellPadding: { top: 4, bottom: 4, left: 2, right: 2 },
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 45 },
      2: { cellWidth: 22 },
      3: { cellWidth: 18 },
      4: { cellWidth: 23, halign: "right" },
      5: { cellWidth: 12, halign: "center" },
      6: { cellWidth: 28, halign: "right", fontStyle: "bold" },
      7: { cellWidth: 22 },
    },
  });

  const afterTbl = (doc as any).lastAutoTable.finalY + 10;

  const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
  const diff = order.total - subtotal;
  const ship = diff > 0 && diff < 2000 ? diff : 0;

  const totalX = W - mg - 60;
  let totalY = afterTbl + 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("SUBTOTAL", totalX, totalY);
  doc.setTextColor(0, 0, 0);
  doc.text(pkr(subtotal), W - mg, totalY, { align: "right" });

  totalY += 7;
  doc.setTextColor(100, 100, 100);
  doc.text("SHIPPING", totalX, totalY);
  doc.setTextColor(0, 0, 0);
  doc.text(ship === 0 ? "FREE" : pkr(ship), W - mg, totalY, { align: "right" });

  totalY += 7;
  doc.setTextColor(100, 100, 100);
  doc.text("TAX", totalX, totalY);
  doc.setTextColor(0, 0, 0);
  doc.text("NO TAX", W - mg, totalY, { align: "right" });

  totalY += 10;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
doc.line(totalX - 2, totalY - 1, W - mg + 2, totalY - 1);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text("TOTAL", totalX, totalY + 8);
  doc.text(pkr(order.total), W - mg, totalY + 8, { align: "right" });

  const payY = totalY + 22;
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text("PAYMENT INFORMATION", mg, payY);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  
  if (order.paymentMethod === "online") {
    doc.text(`EasyPaisa: ${STORE.easypaisa}`, mg, payY + 5);
    doc.text("Payment received via mobile wallet", mg, payY + 9);
  } else {
    doc.text("Cash on Delivery (COD)", mg, payY + 5);
    doc.text("Payment due upon delivery", mg, payY + 9);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text("ORDER STATUS:", W - mg, payY, { align: "right" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const statusColors: Record<string, [number, number, number]> = {
    pending: [180, 140, 0],
    processing: [0, 100, 180],
    shipped: [120, 50, 180],
    delivered: [0, 120, 80],
    cancelled: [180, 50, 50],
  };
  const statusColor = statusColors[order.status.toLowerCase()] || [80, 80, 80];
  doc.setTextColor(...statusColor);
  doc.text(order.status.toUpperCase(), W - mg, payY + 5, { align: "right" });

  const thankY = H - 65;
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  doc.text("THANK YOU FOR YOUR BUSINESS!", mg, thankY);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text("We appreciate your trust in Shoe World", mg, thankY + 4);

  const termsY = thankY + 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text("TERMS & CONDITIONS", mg, termsY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  const termsText = "Items will only be replaced if received broken or if the wrong order was delivered. Otherwise, no changes or replacements will be entertained.";
  doc.text(termsText, mg, termsY + 4, { maxWidth: W - mg * 2 });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  doc.text("FOLLOW US ON INSTAGRAM", mg, termsY + 12);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(200, 50, 100);
  doc.text(STORE.instagram, mg, termsY + 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `${STORE.website} · ${STORE.phone}`,
    W / 2,
    H - 10,
    { align: "center" }
  );

  doc.save(`SoftChappal-Invoice-${order.id}.pdf`);
}