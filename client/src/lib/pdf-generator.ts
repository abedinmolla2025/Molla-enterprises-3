import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { InvoiceWithClient } from '@shared/schema';

declare global {
  interface Window {
    html2canvas: typeof html2canvas;
    jsPDF: typeof jsPDF;
  }
}

export async function generatePDF(invoice: InvoiceWithClient): Promise<void> {
  // Create a temporary container for the invoice
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.top = '0';
  tempContainer.style.width = '210mm'; // A4 width (794px at 96dpi)
  tempContainer.style.height = '297mm'; // A4 height (1123px at 96dpi)
  tempContainer.style.backgroundColor = 'white';
  tempContainer.style.fontFamily = 'Arial, sans-serif';
  tempContainer.style.boxSizing = 'border-box';
  document.body.appendChild(tempContainer);

  try {
    // Fetch settings for company details
    const settingsResponse = await fetch('/api/settings');
    const settings = settingsResponse.ok ? await settingsResponse.json() : [];
    
    const getSettingValue = (key: string, defaultValue: string = "") => {
      const setting = settings.find((s: any) => s.key === key);
      return setting?.value || defaultValue;
    };

    const formatCurrency = (amount: string) => {
      const currency = invoice.currency || 'INR';
      if (currency === 'INR') {
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(parseFloat(amount));
      }
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(parseFloat(amount));
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const companyName = getSettingValue("companyName", "MOLLA ENTERPRISES");
    const companyEmail = getSettingValue("companyEmail", "abedinmolla1@gmail.com");
    const companyPhone = getSettingValue("companyPhone", "9681766016");
    const companyWhatsapp = getSettingValue("companyWhatsapp", "9681766016");
    const companyAddress = getSettingValue("companyAddress", "BAGNAN, HOWRAH, WEST BENGAL 711303");

    const bankName = getSettingValue("bankName", "State Bank of India");
    const accountNumber = getSettingValue("accountNumber", "1234567890");
    const ifscCode = getSettingValue("ifscCode", "SBIN0001234");
    const accountHolderName = getSettingValue("accountHolderName", "MOLLA ENTERPRISES");
    const upiId = getSettingValue("upiId", "abedinmolla1@paytm");
    const defaultDueDays = getSettingValue("defaultDueDays", "30");

    // Create the invoice HTML
    tempContainer.innerHTML = `
      <div style="background: white; width: 210mm; height: 297mm; padding: 0; margin: 0; font-family: Arial, sans-serif; box-sizing: border-box; display: flex; flex-direction: column; overflow: hidden;">
        <!-- Header Blue Geometric Design -->
        <div style="position: relative; height: 50px; flex-shrink: 0;">
          <div style="position: absolute; top: 0; left: 0; width: 100%; height: 50px; background: linear-gradient(to right, #1e40af 0%, #1e3a8a 50%, #06b6d4 100%);"></div>
          <div style="position: absolute; top: 0; right: 0; width: 100px; height: 50px; background: linear-gradient(to left, #22d3ee, transparent); transform: skewX(12deg); transform-origin: top right;"></div>
        </div>
        
        <div style="padding: 12mm 15mm; flex: 1; display: flex; flex-direction: column;">
          <!-- Company Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8mm;">
            <div>
              <div style="margin: 6mm 0 5mm 0;">
                <div style="position: relative;">
                  <h1 style="font-family: Arial, sans-serif; font-size: 45px; font-weight: 900; margin: 0; line-height: 0.9; letter-spacing: -1px; text-transform: uppercase;">
                    <span style="color: #1e40af;">MOLLA</span><span style="color: #06b6d4;">ENTERPRISES</span>
                  </h1>
                  <div style="margin-top: 4px;">
                    <p style="font-family: Arial, sans-serif; font-size: 14px; font-weight: 500; color: #374151; margin: 0; letter-spacing: 0.3em; text-transform: uppercase;">I N D U S T R I E S</p>
                  </div>
                  <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #e5e7eb;">
                    <p style="font-family: Arial, sans-serif; font-size: 10px; font-weight: 500; color: #6b7280; margin: 0; font-style: italic;">Modular homes and kitchen decoration</p>
                  </div>
                </div>
              </div>
              <div style="font-size: 10px; color: #6b7280; line-height: 1.4;">
                <p style="margin: 2px 0;">${companyAddress}</p>
                <p style="margin: 2px 0;">☎ ${companyPhone} | ⚬ WhatsApp: ${companyWhatsapp}</p>
                <p style="margin: 2px 0;">✉ ${companyEmail}</p>
              </div>
            </div>
            <div style="text-align: right; margin-top: 6mm;">
              <h2 style="font-size: 24px; font-weight: bold; color: #374151; margin: 0 0 12px 0;">TAX INVOICE</h2>
              <div style="font-size: 10px; color: #6b7280; line-height: 1.6;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin: 6px 0;">
                  <span style="color: #9ca3af;">${formatDate(invoice.date.toString())}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin: 6px 0;">
                  <span style="font-weight: 600;">Invoice #</span>
                  <span style="font-weight: bold;">${invoice.invoiceNumber}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin: 6px 0;">
                  <span style="color: #9ca3af;">Customer PO Reference Field</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Client Information -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; margin-bottom: 8mm;">
            <div>
              <h3 style="font-weight: bold; color: #374151; margin: 0 0 16px 0; font-size: 12px; letter-spacing: 1px;">INVOICE TO</h3>
              <div style="font-size: 12px; color: #374151; line-height: 1.6;">
                <p style="font-weight: 500; margin: 4px 0;">${invoice.client.companyName}</p>
                <p style="margin: 4px 0;">${invoice.client.contactPerson}</p>
                <p style="margin: 4px 0;">${invoice.client.address}</p>
                <p style="margin: 4px 0;">${invoice.client.phone}</p>
                <p style="margin: 4px 0;">${invoice.client.email}</p>
              </div>
            </div>
            <div>
              <h3 style="font-weight: bold; color: #374151; margin: 0 0 16px 0; font-size: 12px; letter-spacing: 1px;">SHIP TO</h3>
              <div style="font-size: 12px; color: #374151; line-height: 1.6;">
                <p style="margin: 4px 0;">${invoice.client.address}</p>
                <p style="margin: 4px 0;">${invoice.client.companyName}</p>
              </div>
            </div>
          </div>
          
          <!-- Items Table -->
          <div style="margin-bottom: 6mm; flex: 1;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #1e40af; color: white;">
                  <th style="padding: 8px; text-align: center; font-size: 9px; font-weight: bold; letter-spacing: 0.5px;">ITEM NO.</th>
                  <th style="padding: 8px; text-align: left; font-size: 9px; font-weight: bold; letter-spacing: 0.5px;">DESCRIPTION</th>
                  <th style="padding: 8px; text-align: center; font-size: 9px; font-weight: bold; letter-spacing: 0.5px;">QTY</th>
                  <th style="padding: 8px; text-align: right; font-size: 9px; font-weight: bold; letter-spacing: 0.5px;">RATE</th>
                  <th style="padding: 8px; text-align: center; font-size: 9px; font-weight: bold; letter-spacing: 0.5px;">GST</th>
                  <th style="padding: 8px; text-align: right; font-size: 9px; font-weight: bold; letter-spacing: 0.5px;">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items.map((item, index) => `
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 8px; font-size: 10px; text-align: center;">Item${index + 1}</td>
                    <td style="padding: 8px; font-size: 10px;">
                      <div>
                        <p style="font-weight: 500; margin: 0;">${item.description}</p>
                      </div>
                    </td>
                    <td style="padding: 8px; font-size: 10px; text-align: center;">${item.quantity}</td>
                    <td style="padding: 8px; font-size: 10px; text-align: right;">${formatCurrency(item.rate)}</td>
                    <td style="padding: 8px; font-size: 10px; text-align: center;">${item.taxRate}%</td>
                    <td style="padding: 8px; font-size: 10px; text-align: right; font-weight: 500;">${formatCurrency(item.amount)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <!-- Thank you message -->
          <div style="text-align: center; margin: 5mm 0;">
            <p style="color: #6b7280; font-style: italic; font-weight: 500; margin: 0; font-size: 11px;">Thank you for your business.</p>
          </div>
          
          <!-- Totals -->
          <div style="display: flex; justify-content: flex-end; margin-bottom: 6mm;">
            <div style="width: 240px;">
              <div style="font-size: 10px; line-height: 1.4;">
                <div style="display: flex; justify-content: space-between; padding: 3px 0;">
                  <span style="color: #6b7280;">Subtotal</span>
                  <span style="text-align: right;">${formatCurrency(invoice.subtotal)}</span>
                </div>
                ${parseFloat(invoice.taxAmount) > 0 ? `
                  <div style="display: flex; justify-content: space-between; padding: 3px 0;">
                    <span style="color: #6b7280;">Total GST 10%</span>
                    <span style="text-align: right;">${formatCurrency(invoice.taxAmount)}</span>
                  </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; padding: 3px 0;">
                  <span style="color: #6b7280;">Invoice Total</span>
                  <span style="text-align: right; font-weight: 500;">${formatCurrency(invoice.total)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 3px 0;">
                  <span style="color: #6b7280;">Total Net Payment</span>
                  <span style="text-align: right;">$0.00</span>
                </div>
                <div style="border-top: 2px solid #1e40af; padding-top: 6px; margin-top: 6px;">
                  <div style="display: flex; justify-content: space-between; padding: 3px 0;">
                    <span style="font-weight: bold; font-size: 14px;">AMOUNT DUE</span>
                    <span style="font-weight: bold; font-size: 14px; color: #1e40af;">${formatCurrency(invoice.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Payment Details Footer -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 6mm; margin-top: auto;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; font-size: 10px;">
              <div>
                <h4 style="font-weight: 600; color: #374151; margin: 0 0 8px 0; font-size: 11px;">Payment Details:</h4>
                <div style="color: #6b7280; line-height: 1.4;">
                  <div style="margin-bottom: 4px;"><strong>Bank:</strong> ${bankName}</div>
                  <div style="margin-bottom: 4px;"><strong>Account Number:</strong> ${accountNumber}</div>
                  <div style="margin-bottom: 4px;"><strong>IFSC Code:</strong> ${ifscCode}</div>
                  <div style="margin-bottom: 4px;"><strong>Account Holder:</strong> ${accountHolderName}</div>
                  <div style="margin-bottom: 4px; padding-top: 4px;"><strong>UPI ID:</strong> ${upiId}</div>
                </div>
              </div>
              <div>
                <h4 style="font-weight: 600; color: #374151; margin: 0 0 8px 0; font-size: 11px;">Terms & Conditions:</h4>
                <div style="color: #6b7280; font-size: 9px; line-height: 1.3;">
                  <p style="margin: 3px 0;">• Payment is due within ${defaultDueDays} days from invoice date</p>
                  <p style="margin: 3px 0;">• Late payment may incur additional charges</p>
                  <p style="margin: 3px 0;">• All work completed as per agreed specifications</p>
                  <p style="margin: 3px 0;">• Please include invoice number with payment</p>
                </div>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 6mm; padding-top: 4mm; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 10px; margin: 0;">
                Due Date: <strong>${formatDate(invoice.dueDate.toString())}</strong>
              </p>
            </div>
          </div>
        </div>
        
        <!-- Footer Blue Geometric Design -->
        <div style="position: relative; height: 50px; margin-top: auto; flex-shrink: 0;">
          <div style="background: linear-gradient(to right, #22d3ee 0%, #1e3a8a 50%, #1e40af 100%); height: 50px;"></div>
          <div style="position: absolute; bottom: 0; left: 0; width: 100px; height: 50px; background: linear-gradient(to right, #1e40af, transparent); transform: skewX(-12deg); transform-origin: bottom left;"></div>
          <div style="position: absolute; bottom: 6px; right: 12px; color: white; font-size: 8px; font-weight: 500; text-align: right; line-height: 1.3;">
            <p style="margin: 1px 0;">${companyName} | ☎ ${companyPhone}</p>
            <p style="margin: 1px 0;">${companyAddress}</p>
            <p style="margin: 1px 0;">✉ ${companyEmail}</p>
          </div>
        </div>
      </div>
    `;

    // Generate canvas from HTML
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: tempContainer.offsetWidth,
      height: tempContainer.offsetHeight,
    });

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // Download the PDF
    pdf.save(`${invoice.invoiceNumber}.pdf`);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  } finally {
    // Clean up
    document.body.removeChild(tempContainer);
  }
}
