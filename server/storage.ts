import { 
  clients, 
  invoices, 
  invoiceItems, 
  settings,
  users,
  type Client, 
  type InsertClient,
  type Invoice,
  type InsertInvoice,
  type InvoiceItem,
  type InsertInvoiceItem,
  type Settings,
  type InsertSettings,
  type InvoiceWithClient,
  type ClientWithInvoices,
  type User,
  type UpsertUser
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations (Required for Replit Auth - blueprint:javascript_log_in_with_replit)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;
  searchClients(query: string): Promise<Client[]>;

  // Invoices
  getInvoices(): Promise<InvoiceWithClient[]>;
  getInvoice(id: string): Promise<InvoiceWithClient | undefined>;
  getInvoiceByNumber(invoiceNumber: string): Promise<InvoiceWithClient | undefined>;
  createInvoice(invoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<InvoiceWithClient>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>, items?: InsertInvoiceItem[]): Promise<InvoiceWithClient | undefined>;
  deleteInvoice(id: string): Promise<boolean>;
  getNextInvoiceNumber(): Promise<string>;

  // Invoice Items
  getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]>;
  
  // Settings
  getSetting(key: string): Promise<string | undefined>;
  setSetting(key: string, value: string): Promise<void>;
  getSettings(): Promise<Settings[]>;

  // Dashboard Stats
  getDashboardStats(): Promise<{
    totalInvoices: number;
    paidInvoices: number;
    pendingInvoices: number;
    totalClients: number;
    totalRevenue: string;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (Required for Replit Auth - blueprint:javascript_log_in_with_replit)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Clients
  async getClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(desc(clients.createdAt));
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db
      .insert(clients)
      .values(insertClient)
      .returning();
    return client;
  }

  async updateClient(id: string, updateClient: Partial<InsertClient>): Promise<Client | undefined> {
    const [client] = await db
      .update(clients)
      .set(updateClient)
      .where(eq(clients.id, id))
      .returning();
    return client || undefined;
  }

  async deleteClient(id: string): Promise<boolean> {
    const result = await db.delete(clients).where(eq(clients.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async searchClients(query: string): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .where(
        ilike(clients.companyName, `%${query}%`)
      )
      .orderBy(desc(clients.createdAt));
  }

  // Invoices
  async getInvoices(): Promise<InvoiceWithClient[]> {
    const result = await db
      .select()
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .orderBy(desc(invoices.createdAt));

    const invoicesWithItems = await Promise.all(
      result.map(async (row) => {
        const items = await this.getInvoiceItems(row.invoices.id);
        return {
          ...row.invoices,
          client: row.clients!,
          items,
        };
      })
    );

    return invoicesWithItems;
  }

  async getInvoice(id: string): Promise<InvoiceWithClient | undefined> {
    const [result] = await db
      .select()
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(invoices.id, id));

    if (!result) return undefined;

    const items = await this.getInvoiceItems(id);

    return {
      ...result.invoices,
      client: result.clients!,
      items,
    };
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<InvoiceWithClient | undefined> {
    const [result] = await db
      .select()
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(invoices.invoiceNumber, invoiceNumber));

    if (!result) return undefined;

    const items = await this.getInvoiceItems(result.invoices.id);

    return {
      ...result.invoices,
      client: result.clients!,
      items,
    };
  }

  async createInvoice(insertInvoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<InvoiceWithClient> {
    // Create invoice
    const [invoice] = await db
      .insert(invoices)
      .values(insertInvoice)
      .returning();

    // Create invoice items
    const itemsWithInvoiceId = items.map(item => ({
      ...item,
      invoiceId: invoice.id,
    }));

    await db.insert(invoiceItems).values(itemsWithInvoiceId);

    // Return invoice with client and items
    return await this.getInvoice(invoice.id) as InvoiceWithClient;
  }

  async updateInvoice(id: string, updateInvoice: Partial<InsertInvoice>, items?: InsertInvoiceItem[]): Promise<InvoiceWithClient | undefined> {
    // Update invoice
    const [invoice] = await db
      .update(invoices)
      .set(updateInvoice)
      .where(eq(invoices.id, id))
      .returning();

    if (!invoice) return undefined;

    // Update items if provided
    if (items) {
      // Delete existing items
      await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
      
      // Insert new items
      const itemsWithInvoiceId = items.map(item => ({
        ...item,
        invoiceId: id,
      }));
      
      await db.insert(invoiceItems).values(itemsWithInvoiceId);
    }

    // Return updated invoice with client and items
    return await this.getInvoice(id);
  }

  async deleteInvoice(id: string): Promise<boolean> {
    const result = await db.delete(invoices).where(eq(invoices.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getNextInvoiceNumber(): Promise<string> {
    const prefix = await this.getSetting('invoice_prefix') || 'INV-';
    const lastInvoice = await db
      .select()
      .from(invoices)
      .orderBy(desc(invoices.createdAt))
      .limit(1);

    if (lastInvoice.length === 0) {
      return `${prefix}0001`;
    }

    const lastNumber = lastInvoice[0].invoiceNumber.replace(prefix, '');
    const nextNumber = (parseInt(lastNumber) + 1).toString().padStart(4, '0');
    return `${prefix}${nextNumber}`;
  }

  // Invoice Items
  async getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
    return await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId));
  }

  // Settings
  async getSetting(key: string): Promise<string | undefined> {
    const [setting] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key));
    return setting?.value;
  }

  async setSetting(key: string, value: string): Promise<void> {
    const existing = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key));

    if (existing.length > 0) {
      await db
        .update(settings)
        .set({ value })
        .where(eq(settings.key, key));
    } else {
      await db
        .insert(settings)
        .values({ key, value });
    }
  }

  async getSettings(): Promise<Settings[]> {
    return await db.select().from(settings);
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<{
    totalInvoices: number;
    paidInvoices: number;
    pendingInvoices: number;
    totalClients: number;
    totalRevenue: string;
  }> {
    const [totalInvoicesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(invoices);

    const [paidInvoicesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(eq(invoices.status, 'paid'));

    const [pendingInvoicesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(and(
        eq(invoices.status, 'sent'),
      ));

    const [totalClientsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(clients);

    const [revenueResult] = await db
      .select({ sum: sql<string>`COALESCE(sum(total), 0)` })
      .from(invoices)
      .where(eq(invoices.status, 'paid'));

    return {
      totalInvoices: totalInvoicesResult.count,
      paidInvoices: paidInvoicesResult.count,
      pendingInvoices: pendingInvoicesResult.count,
      totalClients: totalClientsResult.count,
      totalRevenue: revenueResult.sum || '0',
    };
  }
}

export const storage = new DatabaseStorage();
