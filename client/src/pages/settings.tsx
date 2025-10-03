import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import type { Settings } from "@shared/schema";

interface SettingsForm {
  defaultCurrency: string;
  invoicePrefix: string;
  nextInvoiceNumber: string;
  defaultDueDays: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  upiId: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyWhatsapp: string;
  companyAddress: string;
}

const defaultSettings: SettingsForm = {
  defaultCurrency: "INR",
  invoicePrefix: "INV-",
  nextInvoiceNumber: "1",
  defaultDueDays: "30",
  bankName: "State Bank of India",
  accountNumber: "1234567890",
  ifscCode: "SBIN0001234",
  accountHolderName: "MOLLA ENTERPRISES",
  upiId: "abedinmolla1@paytm",
  companyName: "MOLLA ENTERPRISES",
  companyEmail: "abedinmolla1@gmail.com",
  companyPhone: "9681766016",
  companyWhatsapp: "9681766016",
  companyAddress: "BAGNAN, HOWRAH, WEST BENGAL 711303",
};

export default function Settings() {
  const [formData, setFormData] = useState<SettingsForm>(defaultSettings);
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<Settings[]>({
    queryKey: ["/api/settings"],
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (setting: { key: string; value: string }) => {
      await apiRequest("POST", "/api/settings", setting);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  // Load settings into form when data is available
  useEffect(() => {
    if (settings) {
      const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string>);

      setFormData(prev => ({
        ...prev,
        ...settingsMap,
      }));
    }
  }, [settings]);

  const handleInputChange = (key: keyof SettingsForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleGeneralSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const generalSettings = [
      { key: "defaultCurrency", value: formData.defaultCurrency },
      { key: "invoicePrefix", value: formData.invoicePrefix },
      { key: "nextInvoiceNumber", value: formData.nextInvoiceNumber },
      { key: "defaultDueDays", value: formData.defaultDueDays },
    ];

    for (const setting of generalSettings) {
      saveSettingsMutation.mutate(setting);
    }
  };

  const handlePaymentSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const paymentSettings = [
      { key: "bankName", value: formData.bankName },
      { key: "accountNumber", value: formData.accountNumber },
      { key: "ifscCode", value: formData.ifscCode },
      { key: "accountHolderName", value: formData.accountHolderName },
      { key: "upiId", value: formData.upiId },
    ];

    for (const setting of paymentSettings) {
      saveSettingsMutation.mutate(setting);
    }
  };

  const handleCompanyInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const companySettings = [
      { key: "companyName", value: formData.companyName },
      { key: "companyEmail", value: formData.companyEmail },
      { key: "companyPhone", value: formData.companyPhone },
      { key: "companyWhatsapp", value: formData.companyWhatsapp },
      { key: "companyAddress", value: formData.companyAddress },
    ];

    for (const setting of companySettings) {
      saveSettingsMutation.mutate(setting);
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="font-lora text-3xl font-bold text-gray-900 mb-2">Settings</h2>
          <p className="text-gray-600">Configure your invoice preferences and payment details</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-lora text-3xl font-bold text-gray-900 mb-2" data-testid="page-title">
          Settings
        </h2>
        <p className="text-gray-600">Configure your invoice preferences and payment details</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* General Settings */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
            
            <form onSubmit={handleGeneralSettingsSubmit} className="space-y-4">
              <div>
                <Label htmlFor="defaultCurrency">Default Currency</Label>
                <Select 
                  value={formData.defaultCurrency}
                  onValueChange={(value) => handleInputChange("defaultCurrency", value)}
                >
                  <SelectTrigger data-testid="select-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                    <SelectItem value="USD">US Dollar ($)</SelectItem>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                    <SelectItem value="GBP">British Pound (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="invoicePrefix">Invoice Number Prefix</Label>
                <Input
                  id="invoicePrefix"
                  value={formData.invoicePrefix}
                  onChange={(e) => handleInputChange("invoicePrefix", e.target.value)}
                  data-testid="input-invoice-prefix"
                />
              </div>
              
              <div>
                <Label htmlFor="nextInvoiceNumber">Next Invoice Number</Label>
                <Input
                  id="nextInvoiceNumber"
                  type="number"
                  value={formData.nextInvoiceNumber}
                  onChange={(e) => handleInputChange("nextInvoiceNumber", e.target.value)}
                  data-testid="input-next-invoice-number"
                />
              </div>
              
              <div>
                <Label htmlFor="defaultDueDays">Default Due Days</Label>
                <Input
                  id="defaultDueDays"
                  type="number"
                  value={formData.defaultDueDays}
                  onChange={(e) => handleInputChange("defaultDueDays", e.target.value)}
                  data-testid="input-default-due-days"
                />
                <p className="text-xs text-gray-500 mt-1">Number of days from invoice date</p>
              </div>
              
              <Button
                type="submit"
                className="gradient-bg hover:opacity-90 w-full"
                disabled={saveSettingsMutation.isPending}
                data-testid="button-save-general"
              >
                Save General Settings
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Payment Settings */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
            
            <form onSubmit={handlePaymentSettingsSubmit} className="space-y-4">
              <div className="border-b border-gray-200 pb-4">
                <h4 className="font-medium text-gray-900 mb-3">Bank Transfer Details</h4>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      value={formData.bankName}
                      onChange={(e) => handleInputChange("bankName", e.target.value)}
                      data-testid="input-bank-name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      value={formData.accountNumber}
                      onChange={(e) => handleInputChange("accountNumber", e.target.value)}
                      data-testid="input-account-number"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="ifscCode">IFSC Code</Label>
                    <Input
                      id="ifscCode"
                      value={formData.ifscCode}
                      onChange={(e) => handleInputChange("ifscCode", e.target.value)}
                      data-testid="input-ifsc-code"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="accountHolderName">Account Holder Name</Label>
                    <Input
                      id="accountHolderName"
                      value={formData.accountHolderName}
                      onChange={(e) => handleInputChange("accountHolderName", e.target.value)}
                      data-testid="input-account-holder"
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-4">
                <h4 className="font-medium text-gray-900 mb-3">UPI Details</h4>
                
                <div>
                  <Label htmlFor="upiId">UPI ID</Label>
                  <Input
                    id="upiId"
                    value={formData.upiId}
                    onChange={(e) => handleInputChange("upiId", e.target.value)}
                    data-testid="input-upi-id"
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                className="gradient-bg hover:opacity-90 w-full"
                disabled={saveSettingsMutation.isPending}
                data-testid="button-save-payment"
              >
                Save Payment Details
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      
      {/* Company Information */}
      <div className="mt-8">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
            
            <form onSubmit={handleCompanyInfoSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange("companyName", e.target.value)}
                  data-testid="input-company-name"
                />
              </div>
              
              <div>
                <Label htmlFor="companyEmail">Email</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={formData.companyEmail}
                  onChange={(e) => handleInputChange("companyEmail", e.target.value)}
                  data-testid="input-company-email"
                />
              </div>
              
              <div>
                <Label htmlFor="companyPhone">Phone</Label>
                <Input
                  id="companyPhone"
                  type="tel"
                  value={formData.companyPhone}
                  onChange={(e) => handleInputChange("companyPhone", e.target.value)}
                  data-testid="input-company-phone"
                />
              </div>
              
              <div>
                <Label htmlFor="companyWhatsapp">WhatsApp</Label>
                <Input
                  id="companyWhatsapp"
                  type="tel"
                  value={formData.companyWhatsapp}
                  onChange={(e) => handleInputChange("companyWhatsapp", e.target.value)}
                  data-testid="input-company-whatsapp"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="companyAddress">Address</Label>
                <Textarea
                  id="companyAddress"
                  rows={3}
                  value={formData.companyAddress}
                  onChange={(e) => handleInputChange("companyAddress", e.target.value)}
                  data-testid="textarea-company-address"
                />
              </div>
              
              <div className="md:col-span-2">
                <Button
                  type="submit"
                  className="gradient-bg hover:opacity-90"
                  disabled={saveSettingsMutation.isPending}
                  data-testid="button-save-company"
                >
                  Update Company Information
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
