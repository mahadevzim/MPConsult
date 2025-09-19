import { promises as fs } from 'fs';
import { join } from 'path';
import type { Cpf, Process, PayoutRequest, Ficha, SearchGroup, SystemSetting, InsertCpf, InsertProcess, InsertPayoutRequest, InsertFicha, InsertSearchGroup, InsertSystemSetting } from "@shared/schema";
import type { IStorage } from "./storage";

export class FileStorage implements IStorage {
  private dataDir = join(process.cwd(), 'data');
  private cpfsFile = join(this.dataDir, 'cpfs.txt');
  private processesFile = join(this.dataDir, 'processes.txt');
  private payoutRequestsFile = join(this.dataDir, 'payout-requests.txt');
  private fichasFile = join(this.dataDir, 'fichas.txt');
  private searchGroupsFile = join(this.dataDir, 'search-groups.txt');
  private systemSettingsFile = join(this.dataDir, 'system-settings.txt');

  constructor() {
    this.ensureDataDir();
  }

  private async ensureDataDir() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  private async readFile<T>(filename: string): Promise<T[]> {
    try {
      const data = await fs.readFile(filename, 'utf-8');
      return data.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
    } catch (error) {
      return [];
    }
  }

  private async writeFile<T>(filename: string, items: T[]): Promise<void> {
    await this.ensureDataDir();
    const data = items.map(item => JSON.stringify(item)).join('\n') + '\n';
    await fs.writeFile(filename, data, 'utf-8');
  }

  private async appendToFile<T>(filename: string, item: T): Promise<void> {
    await this.ensureDataDir();
    const data = JSON.stringify(item) + '\n';
    await fs.appendFile(filename, data, 'utf-8');
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // CPF operations
  async getCpfByNumber(cpf: string): Promise<Cpf | undefined> {
    const cpfs = await this.readFile<Cpf>(this.cpfsFile);
    return cpfs.find(c => c.cpf === cpf);
  }

  async getCpfById(id: string): Promise<Cpf | undefined> {
    const cpfs = await this.readFile<Cpf>(this.cpfsFile);
    return cpfs.find(c => c.id === id);
  }

  async createCpf(cpf: InsertCpf): Promise<Cpf> {
    const newCpf: Cpf = {
      ...cpf,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    };
    await this.appendToFile(this.cpfsFile, newCpf);
    return newCpf;
  }

  // Process operations
  async getProcessesByCpfId(cpfId: string): Promise<Process[]> {
    const processes = await this.readFile<Process>(this.processesFile);
    return processes.filter(p => p.cpfId === cpfId);
  }

  async getProcessesByCpf(cpf: string): Promise<Process[]> {
    const cpfRecord = await this.getCpfByNumber(cpf);
    if (!cpfRecord) return [];
    return await this.getProcessesByCpfId(cpfRecord.id);
  }

  async getProcessById(id: string): Promise<Process | undefined> {
    const processes = await this.readFile<Process>(this.processesFile);
    return processes.find(p => p.id === id);
  }

  async getProcessByNumber(processNumber: string): Promise<Process | undefined> {
    const processes = await this.readFile<Process>(this.processesFile);
    return processes.find(p => p.processNumber === processNumber);
  }

  async createProcess(process: InsertProcess): Promise<Process> {
    const newProcess: Process = {
      ...process,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    };
    await this.appendToFile(this.processesFile, newProcess);
    return newProcess;
  }

  async getAllProcesses(): Promise<Process[]> {
    return await this.readFile<Process>(this.processesFile);
  }

  async updateProcess(id: string, updateData: Partial<InsertProcess>): Promise<Process> {
    const processes = await this.readFile<Process>(this.processesFile);
    const index = processes.findIndex(p => p.id === id);
    
    if (index === -1) {
      throw new Error('Process not found');
    }

    processes[index] = {
      ...processes[index],
      ...updateData,
    };

    await this.writeFile(this.processesFile, processes);
    return processes[index];
  }

  async deleteProcess(id: string): Promise<void> {
    const processes = await this.readFile<Process>(this.processesFile);
    const filtered = processes.filter(p => p.id !== id);
    await this.writeFile(this.processesFile, filtered);
  }

  // Payout request operations
  async createPayoutRequest(request: InsertPayoutRequest): Promise<PayoutRequest> {
    const newRequest: PayoutRequest = {
      ...request,
      id: this.generateId(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    await this.appendToFile(this.payoutRequestsFile, newRequest);
    return newRequest;
  }

  async getPayoutRequestsByCpf(cpf: string): Promise<PayoutRequest[]> {
    const requests = await this.readFile<PayoutRequest>(this.payoutRequestsFile);
    return requests.filter(r => r.cpf === cpf);
  }

  async hasActivePayoutRequest(processId: string): Promise<boolean> {
    const requests = await this.readFile<PayoutRequest>(this.payoutRequestsFile);
    return requests.some(r => r.processId === processId && r.status === 'pending');
  }

  async getAllPayoutRequests(): Promise<PayoutRequest[]> {
    return await this.readFile<PayoutRequest>(this.payoutRequestsFile);
  }

  async deletePayoutRequest(id: string): Promise<void> {
    const requests = await this.readFile<PayoutRequest>(this.payoutRequestsFile);
    const filtered = requests.filter(r => r.id !== id);
    await this.writeFile(this.payoutRequestsFile, filtered);
  }

  // Search Group operations
  async createSearchGroup(searchGroup: InsertSearchGroup): Promise<SearchGroup> {
    const newSearchGroup: SearchGroup = {
      ...searchGroup,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    };
    await this.appendToFile(this.searchGroupsFile, newSearchGroup);
    return newSearchGroup;
  }

  async getSearchGroupBySearchId(searchId: string): Promise<SearchGroup | undefined> {
    const groups = await this.readFile<SearchGroup>(this.searchGroupsFile);
    return groups.find(g => g.searchId === searchId);
  }

  async getSearchGroupById(id: string): Promise<SearchGroup | undefined> {
    const groups = await this.readFile<SearchGroup>(this.searchGroupsFile);
    return groups.find(g => g.id === id);
  }

  async getAllSearchGroups(): Promise<SearchGroup[]> {
    return await this.readFile<SearchGroup>(this.searchGroupsFile);
  }

  async updateSearchGroup(id: string, updateData: Partial<InsertSearchGroup>): Promise<SearchGroup> {
    const groups = await this.readFile<SearchGroup>(this.searchGroupsFile);
    const index = groups.findIndex(g => g.id === id);
    
    if (index === -1) {
      throw new Error('Search Group not found');
    }

    groups[index] = {
      ...groups[index],
      ...updateData,
    };

    await this.writeFile(this.searchGroupsFile, groups);
    return groups[index];
  }

  async deleteSearchGroup(id: string): Promise<void> {
    const groups = await this.readFile<SearchGroup>(this.searchGroupsFile);
    const filtered = groups.filter(g => g.id !== id);
    await this.writeFile(this.searchGroupsFile, filtered);
  }

  async getProcessesBySearchId(searchId: string): Promise<Process[]> {
    const searchGroup = await this.getSearchGroupBySearchId(searchId);
    if (!searchGroup) return [];
    
    const processes = await this.readFile<Process>(this.processesFile);
    return processes.filter(p => p.searchGroupId === searchGroup.id);
  }

  async getProcessesWithFichasBySearchId(searchId: string): Promise<Array<Process & { fichas: Ficha[] }>> {
    const searchGroup = await this.getSearchGroupBySearchId(searchId);
    if (!searchGroup) return [];
    
    const processes = await this.readFile<Process>(this.processesFile);
    const fichas = await this.readFile<Ficha>(this.fichasFile);
    
    const processesInGroup = processes.filter(p => p.searchGroupId === searchGroup.id);
    
    return processesInGroup.map(process => ({
      ...process,
      fichas: fichas.filter(f => f.processId === process.id)
    }));
  }

  // Ficha operations
  async createFicha(ficha: InsertFicha): Promise<Ficha> {
    const newFicha: Ficha = {
      ...ficha,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    };
    await this.appendToFile(this.fichasFile, newFicha);
    return newFicha;
  }

  async getFichasByStaffId(staffId: string): Promise<Ficha[]> {
    const fichas = await this.readFile<Ficha>(this.fichasFile);
    return fichas.filter(f => f.assignedStaffId === staffId);
  }

  async getAllFichas(): Promise<Ficha[]> {
    return await this.readFile<Ficha>(this.fichasFile);
  }

  async updateFicha(id: string, updateData: Partial<InsertFicha>): Promise<Ficha> {
    const fichas = await this.readFile<Ficha>(this.fichasFile);
    const index = fichas.findIndex(f => f.id === id);
    
    if (index === -1) {
      throw new Error('Ficha not found');
    }

    fichas[index] = {
      ...fichas[index],
      ...updateData,
    };

    await this.writeFile(this.fichasFile, fichas);
    return fichas[index];
  }

  async deleteFicha(id: string): Promise<void> {
    const fichas = await this.readFile<Ficha>(this.fichasFile);
    const filtered = fichas.filter(f => f.id !== id);
    await this.writeFile(this.fichasFile, filtered);
  }

  // System Settings operations
  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const settings = await this.readFile<SystemSetting>(this.systemSettingsFile);
    return settings.find(s => s.key === key);
  }

  async setSystemSetting(key: string, value: string, description?: string): Promise<SystemSetting> {
    const settings = await this.readFile<SystemSetting>(this.systemSettingsFile);
    const existingIndex = settings.findIndex(s => s.key === key);
    
    const setting: SystemSetting = {
      id: existingIndex >= 0 ? settings[existingIndex].id : this.generateId(),
      key,
      value,
      description: description || null,
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      settings[existingIndex] = setting;
    } else {
      settings.push(setting);
    }

    await this.writeFile(this.systemSettingsFile, settings);
    return setting;
  }

  // Statistics
  async getStatistics(): Promise<{
    totalCPFs: number;
    totalProcesses: number;
    activeProcesses: number;
  }> {
    const cpfs = await this.readFile<Cpf>(this.cpfsFile);
    const processes = await this.readFile<Process>(this.processesFile);
    const activeProcesses = processes.filter(p => p.status === 'Ativo');
    
    return {
      totalCPFs: cpfs.length,
      totalProcesses: processes.length,
      activeProcesses: activeProcesses.length,
    };
  }
}