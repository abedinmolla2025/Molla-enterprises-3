import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import type { Client, InsertClient } from "@shared/schema";

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: Client | null;
}

export default function ClientModal({ isOpen, onClose, client }: ClientModalProps) {
  const [formData, setFormData] = useState<InsertClient>({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (client) {
      setFormData({
        companyName: client.companyName,
        contactPerson: client.contactPerson,
        email: client.email,
        phone: client.phone,
        address: client.address,
      });
    } else {
      setFormData({
        companyName: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
      });
    }
  }, [client]);

  const createClientMutation = useMutation({
    mutationFn: async (data: InsertClient) => {
      await apiRequest("POST", "/api/clients", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Client created successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create client",
        variant: "destructive",
      });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async (data: InsertClient) => {
      if (!client) throw new Error("No client to update");
      await apiRequest("PUT", `/api/clients/${client.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update client",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (client) {
      updateClientMutation.mutate(formData);
    } else {
      createClientMutation.mutate(formData);
    }
  };

  const handleInputChange = (field: keyof InsertClient, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const isLoading = createClientMutation.isPending || updateClientMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle data-testid="modal-title">
            {client ? "Edit Client" : "Add New Client"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="contactPerson">Client Name</Label>
            <Input
              id="contactPerson"
              value={formData.contactPerson}
              onChange={(e) => {
                handleInputChange("contactPerson", e.target.value);
                handleInputChange("companyName", e.target.value);
                handleInputChange("email", "client@example.com");
              }}
              placeholder="Enter client name"
              required
              data-testid="input-contact-person"
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="Enter phone number"
              required
              data-testid="input-phone"
            />
          </div>
          
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              rows={3}
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Enter complete address"
              required
              data-testid="textarea-address"
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button
              type="submit"
              className="gradient-bg hover:opacity-90 flex-1"
              disabled={isLoading}
              data-testid="button-save-client"
            >
              {client ? "Update Client" : "Add Client"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
