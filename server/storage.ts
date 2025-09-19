import { cpfs, processes, payoutRequests, fichas, searchGroups, systemSettings, type Cpf, type Process, type PayoutRequest, type Ficha, type SearchGroup, type SystemSetting, type InsertCpf, type InsertProcess, type InsertPayoutRequest, type InsertFicha, type InsertSearchGroup, type InsertSystemSetting } from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  // CPF operations
  getCpfByNumber(cpf: string): Promise<Cpf | undefined>;
  getCpfById(id: string): Promise<Cpf | undefined>;
  createCpf(cpf: InsertCpf): Promise<Cpf>;
  
  // Process operations
  getProcessesByCpfId(cpfId: string): Promise<Process[]>;
  getProcessesByCpf(cpf: string): Promise<Process[]>;
  getProcessById(id: string): Promise<Process | undefined>;
  getProcessByNumber(processNumber: string): Promise<Process | undefined>;
  createProcess(process: InsertProcess): Promise<Process>;
  getAllProcesses(): Promise<Process[]>;
  updateProcess(id: string, process: Partial<InsertProcess>): Promise<Process>;
  deleteProcess(id: string): Promise<void>;
  
  // Payout request operations
  createPayoutRequest(request: InsertPayoutRequest): Promise<PayoutRequest>;
  getPayoutRequestsByCpf(cpf: string): Promise<PayoutRequest[]>;
  hasActivePayoutRequest(processId: string): Promise<boolean>;
  getAllPayoutRequests(): Promise<PayoutRequest[]>;
  deletePayoutRequest(id: string): Promise<void>;
  
  // Search Group operations
  createSearchGroup(searchGroup: InsertSearchGroup): Promise<SearchGroup>;
  getSearchGroupBySearchId(searchId: string): Promise<SearchGroup | undefined>;
  getSearchGroupById(id: string): Promise<SearchGroup | undefined>;
  getAllSearchGroups(): Promise<SearchGroup[]>;
  updateSearchGroup(id: string, searchGroup: Partial<InsertSearchGroup>): Promise<SearchGroup>;
  deleteSearchGroup(id: string): Promise<void>;
  getProcessesBySearchId(searchId: string): Promise<Process[]>;
  getProcessesWithFichasBySearchId(searchId: string): Promise<Array<Process & { fichas: Ficha[] }>>;
  
  // Ficha operations
  createFicha(ficha: InsertFicha): Promise<Ficha>;
  getFichasByStaffId(staffId: string): Promise<Ficha[]>;
  getAllFichas(): Promise<Ficha[]>;
  updateFicha(id: string, ficha: Partial<InsertFicha>): Promise<Ficha>;
  deleteFicha(id: string): Promise<void>;
  
  // System Settings operations
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  setSystemSetting(key: string, value: string, description?: string): Promise<SystemSetting>;
  
  // Statistics
  getStatistics(): Promise<{
    totalCPFs: number;
    totalProcesses: number;
    activeProcesses: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getCpfByNumber(cpfNumber: string): Promise<Cpf | undefined> {
    const [cpf] = await db.select().from(cpfs).where(eq(cpfs.cpf, cpfNumber));
    return cpf || undefined;
  }

  async getCpfById(id: string): Promise<Cpf | undefined> {
    const [cpf] = await db.select().from(cpfs).where(eq(cpfs.id, id));
    return cpf || undefined;
  }

  async createCpf(insertCpf: InsertCpf): Promise<Cpf> {
    const [cpf] = await db
      .insert(cpfs)
      .values(insertCpf)
      .returning();
    return cpf;
  }

  async getProcessesByCpfId(cpfId: string): Promise<Process[]> {
    return await db.select().from(processes).where(eq(processes.cpfId, cpfId));
  }

  async getProcessesByCpf(cpfNumber: string): Promise<Process[]> {
    const cpf = await this.getCpfByNumber(cpfNumber);
    if (!cpf) return [];
    return await this.getProcessesByCpfId(cpf.id);
  }

  async getProcessById(id: string): Promise<Process | undefined> {
    const [process] = await db.select().from(processes).where(eq(processes.id, id));
    return process || undefined;
  }

  async getProcessByNumber(processNumber: string): Promise<Process | undefined> {
    const [process] = await db.select().from(processes).where(eq(processes.processNumber, processNumber));
    return process || undefined;
  }

  async createProcess(insertProcess: InsertProcess): Promise<Process> {
    const [process] = await db
      .insert(processes)
      .values(insertProcess)
      .returning();
    return process;
  }

  async getAllProcesses(): Promise<Process[]> {
    return await db.select().from(processes);
  }

  async updateProcess(id: string, updateData: Partial<InsertProcess>): Promise<Process> {
    const [process] = await db
      .update(processes)
      .set(updateData)
      .where(eq(processes.id, id))
      .returning();
    
    if (!process) {
      throw new Error('Process not found');
    }
    
    return process;
  }

  async deleteProcess(id: string): Promise<void> {
    await db.delete(processes).where(eq(processes.id, id));
  }

  async createPayoutRequest(insertRequest: InsertPayoutRequest): Promise<PayoutRequest> {
    const [payoutRequest] = await db
      .insert(payoutRequests)
      .values(insertRequest)
      .returning();
    return payoutRequest;
  }

  async getPayoutRequestsByCpf(cpfNumber: string): Promise<PayoutRequest[]> {
    return await db
      .select()
      .from(payoutRequests)
      .where(eq(payoutRequests.cpf, cpfNumber));
  }

  async hasActivePayoutRequest(processId: string): Promise<boolean> {
    const [request] = await db
      .select()
      .from(payoutRequests)
      .where(eq(payoutRequests.processId, processId));
    return !!request;
  }

  async getAllPayoutRequests(): Promise<PayoutRequest[]> {
    return await db.select().from(payoutRequests);
  }

  async deletePayoutRequest(id: string): Promise<void> {
    await db.delete(payoutRequests).where(eq(payoutRequests.id, id));
  }

  async createFicha(insertFicha: InsertFicha): Promise<Ficha> {
    const [ficha] = await db
      .insert(fichas)
      .values(insertFicha)
      .returning();
    return ficha;
  }

  async getFichasByStaffId(staffId: string): Promise<Ficha[]> {
    return await db
      .select()
      .from(fichas)
      .where(eq(fichas.assignedStaffId, staffId));
  }

  async getAllFichas(): Promise<Ficha[]> {
    return await db.select().from(fichas);
  }

  async updateFicha(id: string, updateData: Partial<InsertFicha>): Promise<Ficha> {
    const [ficha] = await db
      .update(fichas)
      .set(updateData)
      .where(eq(fichas.id, id))
      .returning();
    
    if (!ficha) {
      throw new Error('Ficha not found');
    }
    
    return ficha;
  }

  async deleteFicha(id: string): Promise<void> {
    await db.delete(fichas).where(eq(fichas.id, id));
  }

  // Search Group operations
  async createSearchGroup(insertSearchGroup: InsertSearchGroup): Promise<SearchGroup> {
    const [searchGroup] = await db
      .insert(searchGroups)
      .values(insertSearchGroup)
      .returning();
    return searchGroup;
  }

  async getSearchGroupBySearchId(searchId: string): Promise<SearchGroup | undefined> {
    const [searchGroup] = await db.select().from(searchGroups).where(eq(searchGroups.searchId, searchId));
    return searchGroup || undefined;
  }

  async getSearchGroupById(id: string): Promise<SearchGroup | undefined> {
    const [searchGroup] = await db.select().from(searchGroups).where(eq(searchGroups.id, id));
    return searchGroup || undefined;
  }

  async getAllSearchGroups(): Promise<SearchGroup[]> {
    return await db.select().from(searchGroups);
  }

  async updateSearchGroup(id: string, updateData: Partial<InsertSearchGroup>): Promise<SearchGroup> {
    const [searchGroup] = await db
      .update(searchGroups)
      .set(updateData)
      .where(eq(searchGroups.id, id))
      .returning();
    
    if (!searchGroup) {
      throw new Error('Search Group not found');
    }
    
    return searchGroup;
  }

  async deleteSearchGroup(id: string): Promise<void> {
    await db.delete(searchGroups).where(eq(searchGroups.id, id));
  }

  async getProcessesBySearchId(searchId: string): Promise<Process[]> {
    const searchGroup = await this.getSearchGroupBySearchId(searchId);
    if (!searchGroup) return [];
    
    return await db.select().from(processes).where(eq(processes.searchGroupId, searchGroup.id));
  }

  async getProcessesWithFichasBySearchId(searchId: string): Promise<Array<Process & { fichas: Ficha[] }>> {
    const searchGroup = await this.getSearchGroupBySearchId(searchId);
    if (!searchGroup) return [];
    
    const processesInGroup = await db.select().from(processes).where(eq(processes.searchGroupId, searchGroup.id));
    
    const result = [];
    for (const process of processesInGroup) {
      const processeFichas = await db.select().from(fichas).where(eq(fichas.processId, process.id));
      result.push({
        ...process,
        fichas: processeFichas
      });
    }
    
    return result;
  }

  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    return setting || undefined;
  }

  async setSystemSetting(key: string, value: string, description?: string): Promise<SystemSetting> {
    // Check if setting exists
    const existing = await this.getSystemSetting(key);
    
    if (existing) {
      // Update existing setting
      const [updated] = await db
        .update(systemSettings)
        .set({
          value,
          description,
          updatedAt: sql`CURRENT_TIMESTAMP`
        })
        .where(eq(systemSettings.key, key))
        .returning();
      return updated;
    } else {
      // Create new setting
      const [created] = await db
        .insert(systemSettings)
        .values({
          key,
          value,
          description
        })
        .returning();
      return created;
    }
  }

  async getStatistics() {
    const [cpfCount] = await db.select({ count: sql<number>`count(*)` }).from(cpfs);
    const [processCount] = await db.select({ count: sql<number>`count(*)` }).from(processes);
    const [activeProcessCount] = await db.select({ count: sql<number>`count(*)` }).from(processes).where(eq(processes.status, 'Ativo'));
    
    return {
      totalCPFs: cpfCount.count,
      totalProcesses: processCount.count,
      activeProcesses: activeProcessCount.count,
    };
  }
}

import { FileStorage } from "./file-storage";

class HybridStorage implements IStorage {
  private dbStorage = new DatabaseStorage();
  private fileStorage = new FileStorage();

  private async tryDatabase<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.warn("Database operation failed, falling back to file storage:", error);
      throw error; // Re-throw to let caller handle fallback
    }
  }

  // CPF operations
  async getCpfByNumber(cpf: string): Promise<Cpf | undefined> {
    try {
      return await this.tryDatabase(() => this.dbStorage.getCpfByNumber(cpf));
    } catch {
      return await this.fileStorage.getCpfByNumber(cpf);
    }
  }

  async getCpfById(id: string): Promise<Cpf | undefined> {
    try {
      return await this.tryDatabase(() => this.dbStorage.getCpfById(id));
    } catch {
      return await this.fileStorage.getCpfById(id);
    }
  }

  async createCpf(cpf: InsertCpf): Promise<Cpf> {
    try {
      return await this.tryDatabase(() => this.dbStorage.createCpf(cpf));
    } catch {
      return await this.fileStorage.createCpf(cpf);
    }
  }

  // Process operations
  async getProcessesByCpfId(cpfId: string): Promise<Process[]> {
    try {
      return await this.tryDatabase(() => this.dbStorage.getProcessesByCpfId(cpfId));
    } catch {
      return await this.fileStorage.getProcessesByCpfId(cpfId);
    }
  }

  async getProcessesByCpf(cpf: string): Promise<Process[]> {
    try {
      return await this.tryDatabase(() => this.dbStorage.getProcessesByCpf(cpf));
    } catch {
      return await this.fileStorage.getProcessesByCpf(cpf);
    }
  }

  async getProcessById(id: string): Promise<Process | undefined> {
    try {
      return await this.tryDatabase(() => this.dbStorage.getProcessById(id));
    } catch {
      return await this.fileStorage.getProcessById(id);
    }
  }

  async getProcessByNumber(processNumber: string): Promise<Process | undefined> {
    try {
      return await this.tryDatabase(() => this.dbStorage.getProcessByNumber(processNumber));
    } catch {
      return await this.fileStorage.getProcessByNumber(processNumber);
    }
  }

  async createProcess(process: InsertProcess): Promise<Process> {
    try {
      return await this.tryDatabase(() => this.dbStorage.createProcess(process));
    } catch {
      return await this.fileStorage.createProcess(process);
    }
  }

  async getAllProcesses(): Promise<Process[]> {
    try {
      return await this.tryDatabase(() => this.dbStorage.getAllProcesses());
    } catch {
      return await this.fileStorage.getAllProcesses();
    }
  }

  async updateProcess(id: string, process: Partial<InsertProcess>): Promise<Process> {
    try {
      return await this.tryDatabase(() => this.dbStorage.updateProcess(id, process));
    } catch {
      return await this.fileStorage.updateProcess(id, process);
    }
  }

  async deleteProcess(id: string): Promise<void> {
    try {
      await this.tryDatabase(() => this.dbStorage.deleteProcess(id));
    } catch {
      await this.fileStorage.deleteProcess(id);
    }
  }

  // Payout request operations
  async createPayoutRequest(request: InsertPayoutRequest): Promise<PayoutRequest> {
    try {
      return await this.tryDatabase(() => this.dbStorage.createPayoutRequest(request));
    } catch {
      return await this.fileStorage.createPayoutRequest(request);
    }
  }

  async getPayoutRequestsByCpf(cpf: string): Promise<PayoutRequest[]> {
    try {
      return await this.tryDatabase(() => this.dbStorage.getPayoutRequestsByCpf(cpf));
    } catch {
      return await this.fileStorage.getPayoutRequestsByCpf(cpf);
    }
  }

  async hasActivePayoutRequest(processId: string): Promise<boolean> {
    try {
      return await this.tryDatabase(() => this.dbStorage.hasActivePayoutRequest(processId));
    } catch {
      return await this.fileStorage.hasActivePayoutRequest(processId);
    }
  }

  async getAllPayoutRequests(): Promise<PayoutRequest[]> {
    try {
      return await this.tryDatabase(() => this.dbStorage.getAllPayoutRequests());
    } catch {
      return await this.fileStorage.getAllPayoutRequests();
    }
  }

  async deletePayoutRequest(id: string): Promise<void> {
    try {
      await this.tryDatabase(() => this.dbStorage.deletePayoutRequest(id));
    } catch {
      await this.fileStorage.deletePayoutRequest(id);
    }
  }

  // Search Group operations
  async createSearchGroup(searchGroup: InsertSearchGroup): Promise<SearchGroup> {
    try {
      return await this.tryDatabase(() => this.dbStorage.createSearchGroup(searchGroup));
    } catch {
      return await this.fileStorage.createSearchGroup(searchGroup);
    }
  }

  async getSearchGroupBySearchId(searchId: string): Promise<SearchGroup | undefined> {
    try {
      return await this.tryDatabase(() => this.dbStorage.getSearchGroupBySearchId(searchId));
    } catch {
      return await this.fileStorage.getSearchGroupBySearchId(searchId);
    }
  }

  async getSearchGroupById(id: string): Promise<SearchGroup | undefined> {
    try {
      return await this.tryDatabase(() => this.dbStorage.getSearchGroupById(id));
    } catch {
      return await this.fileStorage.getSearchGroupById(id);
    }
  }

  async getAllSearchGroups(): Promise<SearchGroup[]> {
    try {
      return await this.tryDatabase(() => this.dbStorage.getAllSearchGroups());
    } catch {
      return await this.fileStorage.getAllSearchGroups();
    }
  }

  async updateSearchGroup(id: string, searchGroup: Partial<InsertSearchGroup>): Promise<SearchGroup> {
    try {
      return await this.tryDatabase(() => this.dbStorage.updateSearchGroup(id, searchGroup));
    } catch {
      return await this.fileStorage.updateSearchGroup(id, searchGroup);
    }
  }

  async deleteSearchGroup(id: string): Promise<void> {
    try {
      await this.tryDatabase(() => this.dbStorage.deleteSearchGroup(id));
    } catch {
      await this.fileStorage.deleteSearchGroup(id);
    }
  }

  async getProcessesBySearchId(searchId: string): Promise<Process[]> {
    try {
      return await this.tryDatabase(() => this.dbStorage.getProcessesBySearchId(searchId));
    } catch {
      return await this.fileStorage.getProcessesBySearchId(searchId);
    }
  }

  async getProcessesWithFichasBySearchId(searchId: string): Promise<Array<Process & { fichas: Ficha[] }>> {
    try {
      return await this.tryDatabase(() => this.dbStorage.getProcessesWithFichasBySearchId(searchId));
    } catch {
      return await this.fileStorage.getProcessesWithFichasBySearchId(searchId);
    }
  }

  // Ficha operations
  async createFicha(ficha: InsertFicha): Promise<Ficha> {
    try {
      return await this.tryDatabase(() => this.dbStorage.createFicha(ficha));
    } catch {
      return await this.fileStorage.createFicha(ficha);
    }
  }

  async getFichasByStaffId(staffId: string): Promise<Ficha[]> {
    try {
      return await this.tryDatabase(() => this.dbStorage.getFichasByStaffId(staffId));
    } catch {
      return await this.fileStorage.getFichasByStaffId(staffId);
    }
  }

  async getAllFichas(): Promise<Ficha[]> {
    try {
      return await this.tryDatabase(() => this.dbStorage.getAllFichas());
    } catch {
      return await this.fileStorage.getAllFichas();
    }
  }

  async updateFicha(id: string, ficha: Partial<InsertFicha>): Promise<Ficha> {
    try {
      return await this.tryDatabase(() => this.dbStorage.updateFicha(id, ficha));
    } catch {
      return await this.fileStorage.updateFicha(id, ficha);
    }
  }

  async deleteFicha(id: string): Promise<void> {
    try {
      await this.tryDatabase(() => this.dbStorage.deleteFicha(id));
    } catch {
      await this.fileStorage.deleteFicha(id);
    }
  }

  // System Settings operations
  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    try {
      return await this.tryDatabase(() => this.dbStorage.getSystemSetting(key));
    } catch {
      return await this.fileStorage.getSystemSetting(key);
    }
  }

  async setSystemSetting(key: string, value: string, description?: string): Promise<SystemSetting> {
    try {
      return await this.tryDatabase(() => this.dbStorage.setSystemSetting(key, value, description));
    } catch {
      return await this.fileStorage.setSystemSetting(key, value, description);
    }
  }

  // Statistics
  async getStatistics(): Promise<{
    totalCPFs: number;
    totalProcesses: number;
    activeProcesses: number;
  }> {
    try {
      return await this.tryDatabase(() => this.dbStorage.getStatistics());
    } catch {
      return await this.fileStorage.getStatistics();
    }
  }
}

export const storage = new HybridStorage();
