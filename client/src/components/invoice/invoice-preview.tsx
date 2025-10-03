import { useQuery } from "@tanstack/react-query";
import type { InvoiceWithClient, Settings } from "@shared/schema";
import { Phone, MessageCircle, Mail } from "lucide-react";

interface InvoicePreviewProps {
  invoice: InvoiceWithClient;
  className?: string;
}

export default function InvoicePreview({ invoice, className = "" }: InvoicePreviewProps) {
  const { data: settings = [] } = useQuery<Settings[]>({
    queryKey: ["/api/settings"],
  });

  const getSettingValue = (key: string, defaultValue: string = "") => {
    const setting = settings.find(s => s.key === key);
    return setting?.value || defaultValue;
  };

  const formatCurrency = (amount: string) => {
    const currency = getSettingValue("defaultCurrency", "INR");
    if (currency === "INR") {
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

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm ${className}`} id="invoice-preview">
      {/* Header Blue Geometric Design */}
      <div className="relative h-16">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-800 via-blue-700 to-cyan-500"></div>
        <div className="absolute top-0 right-0 w-32 h-16 bg-gradient-to-l from-cyan-400 to-transparent transform skew-x-12"></div>
      </div>
      
      <div className="p-8">
        {/* Company Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="mb-8 mt-20" data-testid="company-name">
              <div className="relative">
                <h1 className="font-sans text-4xl md:text-5xl font-black mb-1 tracking-tight uppercase leading-none">
                  <span className="text-blue-800">MOLLA</span><span className="text-cyan-500">ENTERPRISES</span>
                </h1>
                <div className="mt-1">
                  <p className="font-sans text-sm font-medium text-gray-700 tracking-[0.3em] uppercase">I N D U S T R I E S</p>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-200">
                  <p className="font-sans text-sm font-medium text-gray-600 italic">Modular homes and kitchen decoration</p>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>{companyAddress}</p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4" /> {companyPhone} | <MessageCircle className="w-4 h-4" /> {companyWhatsapp}
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4" /> {companyEmail}
              </p>
            </div>
          </div>
          <div className="text-right mt-20">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">TAX INVOICE</h2>
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">{formatDate(invoice.date.toString())}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Invoice #</span>
                <span className="font-bold">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Customer PO Reference Field</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Client Information */}
        <div className="grid grid-cols-2 gap-16 mb-12">
          <div>
            <h3 className="font-bold text-gray-800 mb-4 text-sm tracking-wide">INVOICE TO</h3>
            <div className="text-sm text-gray-700 space-y-1 leading-relaxed">
              <p className="font-medium">{invoice.client.companyName}</p>
              <p>{invoice.client.contactPerson}</p>
              <p>{invoice.client.address}</p>
              <p>{invoice.client.phone}</p>
              <p>{invoice.client.email}</p>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-gray-800 mb-4 text-sm tracking-wide">SHIP TO</h3>
            <div className="text-sm text-gray-700 space-y-1 leading-relaxed">
              <p>{invoice.client.address}</p>
              <p>{invoice.client.companyName}</p>
            </div>
          </div>
        </div>
        
        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-800 text-white">
                <th className="px-3 py-3 text-center text-xs font-bold tracking-wide">QTY</th>
                <th className="px-3 py-3 text-center text-xs font-bold tracking-wide">ITEM NO.</th>
                <th className="px-3 py-3 text-left text-xs font-bold tracking-wide">DESCRIPTION</th>
                <th className="px-3 py-3 text-right text-xs font-bold tracking-wide">UNIT PRICE</th>
                <th className="px-3 py-3 text-center text-xs font-bold tracking-wide">GST</th>
                <th className="px-3 py-3 text-right text-xs font-bold tracking-wide">AMOUNT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoice.items.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-gray-50">
                  <td className="px-3 py-3 text-sm text-center">{item.quantity}</td>
                  <td className="px-3 py-3 text-sm text-center">Item{index + 1}</td>
                  <td className="px-3 py-3 text-sm">
                    <div>
                      <p className="font-medium">{item.description}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm text-right">{formatCurrency(item.rate)}</td>
                  <td className="px-3 py-3 text-sm text-center">{item.taxRate}%</td>
                  <td className="px-3 py-3 text-sm text-right font-medium">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Thank you message */}
        <div className="text-center mb-8 mt-8">
          <p className="text-gray-600 italic font-medium">Thank you for your business.</p>
        </div>
        
        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-72">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-right">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {parseFloat(invoice.taxAmount) > 0 && (
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Total GST 10%</span>
                  <span className="text-right">{formatCurrency(invoice.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Invoice Total</span>
                <span className="text-right font-medium">{formatCurrency(invoice.total)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Total Net Payment</span>
                <span className="text-right">$0.00</span>
              </div>
              <div className="border-t-2 border-blue-800 pt-2 mt-2">
                <div className="flex justify-between py-1">
                  <span className="font-bold text-lg">AMOUNT DUE</span>
                  <span className="font-bold text-lg text-blue-800">{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Payment Details Footer */}
        <div className="border-t pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Payment Details:</h4>
              <div className="text-gray-600 space-y-2">
                <div><strong>Bank:</strong> {bankName}</div>
                <div><strong>Account Number:</strong> {accountNumber}</div>
                <div><strong>IFSC Code:</strong> {ifscCode}</div>
                <div><strong>Account Holder:</strong> {accountHolderName}</div>
                <div className="pt-2"><strong>UPI ID:</strong> {upiId}</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Terms & Conditions:</h4>
              <div className="text-gray-600 space-y-1 text-xs">
                <p>• Payment is due within {getSettingValue("defaultDueDays", "30")} days from invoice date</p>
                <p>• Late payment may incur additional charges</p>
                <p>• All work completed as per agreed specifications</p>
                <p>• Please include invoice number with payment</p>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-8 pt-4 border-t">
            <p className="text-gray-500 text-sm">
              Due Date: <strong>{formatDate(invoice.dueDate.toString())}</strong>
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer Blue Geometric Design */}
      <div className="relative">
        <div className="bg-gradient-to-r from-cyan-400 via-blue-700 to-blue-800 h-16"></div>
        <div className="absolute bottom-0 left-0 w-32 h-16 bg-gradient-to-r from-blue-800 to-transparent transform -skew-x-12"></div>
        <div className="absolute bottom-2 right-4 text-white text-xs font-medium">
          <p className="flex items-center justify-end gap-1">{companyName} | <Phone className="w-3 h-3" /> {companyPhone}</p>
          <p className="text-right">{companyAddress}</p>
          <p className="text-right flex items-center justify-end gap-1"><Mail className="w-3 h-3" /> {companyEmail}</p>
        </div>
      </div>
    </div>
  );
}
