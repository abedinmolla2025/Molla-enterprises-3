import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generatePDF } from "@/lib/pdf-generator";
import InvoicePreview from "@/components/invoice/invoice-preview";
import type { InvoiceWithClient } from "@shared/schema";

interface InvoiceModalProps {
  invoice: InvoiceWithClient | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function InvoiceModal({ invoice, isOpen, onClose }: InvoiceModalProps) {
  const { toast } = useToast();

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    
    try {
      await generatePDF(invoice);
      toast({
        title: "Success",
        description: "PDF downloaded successfully",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-screen overflow-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle data-testid="modal-title">Invoice Preview</DialogTitle>
            <div className="flex space-x-2">
              <Button
                onClick={handleDownloadPDF}
                className="gradient-bg hover:opacity-90"
                data-testid="button-download-pdf"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
                data-testid="button-close-modal"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="pt-6">
          <InvoicePreview invoice={invoice} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
