var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  cpfRelations: () => cpfRelations,
  cpfs: () => cpfs,
  fichaRelations: () => fichaRelations,
  fichas: () => fichas,
  insertCpfSchema: () => insertCpfSchema,
  insertFichaSchema: () => insertFichaSchema,
  insertPayoutRequestSchema: () => insertPayoutRequestSchema,
  insertProcessSchema: () => insertProcessSchema,
  payoutRequestRelations: () => payoutRequestRelations,
  payoutRequests: () => payoutRequests,
  processRelations: () => processRelations,
  processes: () => processes
});
import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var cpfs = pgTable("cpfs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cpf: text("cpf").notNull().unique(),
  name: text("name"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`)
});
var processes = pgTable("processes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cpfId: varchar("cpf_id").notNull().references(() => cpfs.id),
  processNumber: text("process_number").notNull(),
  value: decimal("value", { precision: 12, scale: 2 }).notNull(),
  startYear: integer("start_year").notNull(),
  nature: text("nature").notNull(),
  subject: text("subject").notNull(),
  judge: text("judge").notNull(),
  court: text("court").notNull(),
  activePoleMain: text("active_pole_main").notNull(),
  activePoleRole: text("active_pole_role").notNull(),
  activePolleLawyers: text("active_pole_lawyers").array().notNull(),
  passivePoleMain: text("passive_pole_main").notNull(),
  passivePoleRole: text("passive_pole_role").notNull(),
  passivePolleLawyers: text("passive_pole_lawyers").array().notNull(),
  otherParties: text("other_parties").array().default([]),
  status: text("status").default("Ativo"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`)
});
var payoutRequests = pgTable("payout_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  processId: varchar("process_id").notNull().references(() => processes.id, { onDelete: "cascade" }),
  cpf: text("cpf").notNull(),
  phone: text("phone").notNull(),
  bankName: text("bank_name").notNull(),
  agency: text("agency").notNull(),
  account: text("account").notNull(),
  status: text("status").default("Novo"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`)
});
var fichas = pgTable("fichas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cpfId: varchar("cpf_id").notNull().references(() => cpfs.id),
  processId: varchar("process_id").references(() => processes.id, { onDelete: "set null" }),
  assignedStaffId: text("assigned_staff_id").notNull(),
  message: text("message"),
  status: text("status").default("Ativo"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`)
});
var cpfRelations = relations(cpfs, ({ many }) => ({
  processes: many(processes),
  fichas: many(fichas)
}));
var processRelations = relations(processes, ({ one, many }) => ({
  cpf: one(cpfs, {
    fields: [processes.cpfId],
    references: [cpfs.id]
  }),
  payoutRequests: many(payoutRequests),
  fichas: many(fichas)
}));
var payoutRequestRelations = relations(payoutRequests, ({ one }) => ({
  process: one(processes, {
    fields: [payoutRequests.processId],
    references: [processes.id]
  })
}));
var fichaRelations = relations(fichas, ({ one }) => ({
  cpf: one(cpfs, {
    fields: [fichas.cpfId],
    references: [cpfs.id]
  }),
  process: one(processes, {
    fields: [fichas.processId],
    references: [processes.id]
  })
}));
var insertCpfSchema = createInsertSchema(cpfs).omit({
  id: true,
  createdAt: true
});
var insertProcessSchema = createInsertSchema(processes).omit({
  id: true,
  createdAt: true
});
var insertPayoutRequestSchema = createInsertSchema(payoutRequests).omit({
  id: true,
  createdAt: true
});
var insertFichaSchema = createInsertSchema(fichas).omit({
  id: true,
  createdAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, sql as sql2 } from "drizzle-orm";
var DatabaseStorage = class {
  async getCpfByNumber(cpfNumber) {
    const [cpf] = await db.select().from(cpfs).where(eq(cpfs.cpf, cpfNumber));
    return cpf || void 0;
  }
  async getCpfById(id) {
    const [cpf] = await db.select().from(cpfs).where(eq(cpfs.id, id));
    return cpf || void 0;
  }
  async createCpf(insertCpf) {
    const [cpf] = await db.insert(cpfs).values(insertCpf).returning();
    return cpf;
  }
  async getProcessesByCpfId(cpfId) {
    return await db.select().from(processes).where(eq(processes.cpfId, cpfId));
  }
  async getProcessesByCpf(cpfNumber) {
    const cpf = await this.getCpfByNumber(cpfNumber);
    if (!cpf) return [];
    return await this.getProcessesByCpfId(cpf.id);
  }
  async getProcessById(id) {
    const [process2] = await db.select().from(processes).where(eq(processes.id, id));
    return process2 || void 0;
  }
  async createProcess(insertProcess) {
    const [process2] = await db.insert(processes).values(insertProcess).returning();
    return process2;
  }
  async getAllProcesses() {
    return await db.select().from(processes);
  }
  async updateProcess(id, updateData) {
    const [process2] = await db.update(processes).set(updateData).where(eq(processes.id, id)).returning();
    if (!process2) {
      throw new Error("Process not found");
    }
    return process2;
  }
  async deleteProcess(id) {
    await db.delete(processes).where(eq(processes.id, id));
  }
  async createPayoutRequest(insertRequest) {
    const [payoutRequest] = await db.insert(payoutRequests).values(insertRequest).returning();
    return payoutRequest;
  }
  async getPayoutRequestsByCpf(cpfNumber) {
    return await db.select().from(payoutRequests).where(eq(payoutRequests.cpf, cpfNumber));
  }
  async hasActivePayoutRequest(processId) {
    const [request] = await db.select().from(payoutRequests).where(eq(payoutRequests.processId, processId));
    return !!request;
  }
  async getAllPayoutRequests() {
    return await db.select().from(payoutRequests);
  }
  async createFicha(insertFicha) {
    const [ficha] = await db.insert(fichas).values(insertFicha).returning();
    return ficha;
  }
  async getFichasByStaffId(staffId) {
    return await db.select().from(fichas).where(eq(fichas.assignedStaffId, staffId));
  }
  async getAllFichas() {
    return await db.select().from(fichas);
  }
  async updateFicha(id, updateData) {
    const [ficha] = await db.update(fichas).set(updateData).where(eq(fichas.id, id)).returning();
    if (!ficha) {
      throw new Error("Ficha not found");
    }
    return ficha;
  }
  async deleteFicha(id) {
    await db.delete(fichas).where(eq(fichas.id, id));
  }
  async getStatistics() {
    const [cpfCount] = await db.select({ count: sql2`count(*)` }).from(cpfs);
    const [processCount] = await db.select({ count: sql2`count(*)` }).from(processes);
    const [activeProcessCount] = await db.select({ count: sql2`count(*)` }).from(processes).where(eq(processes.status, "Ativo"));
    return {
      totalCPFs: cpfCount.count,
      totalProcesses: processCount.count,
      activeProcesses: activeProcessCount.count
    };
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { z } from "zod";
async function registerRoutes(app2) {
  const cpfSearchSchema = z.object({
    cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF deve estar no formato 000.000.000-00")
  });
  app2.post("/api/search", async (req, res) => {
    try {
      const { cpf } = cpfSearchSchema.parse(req.body);
      const processes2 = await storage.getProcessesByCpf(cpf);
      res.json({ processes: processes2, cpf });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "CPF inv\xE1lido", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    }
  });
  app2.post("/api/admin/process", async (req, res) => {
    try {
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
      const process2 = await storage.createProcess(processData);
      res.json(process2);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inv\xE1lidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    }
  });
  app2.get("/api/admin/statistics", async (req, res) => {
    try {
      const stats = await storage.getStatistics();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  app2.get("/api/admin/processes", async (req, res) => {
    try {
      const processes2 = await storage.getAllProcesses();
      const sorted = processes2.sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime());
      res.json(sorted);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  app2.get("/api/admin/recent-processes", async (req, res) => {
    try {
      const processes2 = await storage.getAllProcesses();
      const recent = processes2.sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()).slice(0, 5);
      res.json(recent);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  app2.put("/api/admin/process/:id", async (req, res) => {
    try {
      const processId = req.params.id;
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
      const processUpdateData = insertProcessSchema.partial().parse({
        ...req.body,
        activePolleLawyers: req.body.activePolleLawyers || [],
        passivePolleLawyers: req.body.passivePolleLawyers || []
      });
      const updatedProcess = await storage.updateProcess(processId, processUpdateData);
      res.json(updatedProcess);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inv\xE1lidos", errors: error.errors });
      } else if (error instanceof Error && error.message === "Process not found") {
        res.status(404).json({ message: "Processo n\xE3o encontrado" });
      } else {
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    }
  });
  app2.delete("/api/admin/process/:id", async (req, res) => {
    try {
      const processId = req.params.id;
      await storage.deleteProcess(processId);
      res.json({ message: "Processo apagado com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  app2.get("/api/process/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const processId = z.string().min(1).parse(id);
      const process2 = await storage.getProcessById(processId);
      if (!process2) {
        return res.status(404).json({ message: "Processo n\xE3o encontrado" });
      }
      res.json(process2);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "ID inv\xE1lido" });
      } else {
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    }
  });
  app2.post("/api/payout-request", async (req, res) => {
    try {
      const payoutRequestData = z.object({
        processId: z.string().min(1, "ID do processo \xE9 obrigat\xF3rio"),
        phone: z.string().min(1, "Telefone \xE9 obrigat\xF3rio"),
        bankDetails: z.object({
          bankName: z.string().min(1, "Nome do banco \xE9 obrigat\xF3rio"),
          agency: z.string().min(1, "Ag\xEAncia \xE9 obrigat\xF3ria"),
          account: z.string().min(1, "Conta \xE9 obrigat\xF3ria")
        })
      }).parse(req.body);
      const process2 = await storage.getProcessById(payoutRequestData.processId);
      if (!process2) {
        return res.status(404).json({ message: "Processo n\xE3o encontrado" });
      }
      const cpfRecord = await storage.getCpfById(process2.cpfId);
      if (!cpfRecord) {
        return res.status(404).json({ message: "CPF n\xE3o encontrado" });
      }
      const subject = (process2.subject ?? "").toLowerCase();
      const isWonCase = subject.includes("procedente") || subject.includes("ganho") || process2.status === "Ganho";
      if (!isWonCase) {
        return res.status(400).json({ message: "Processo n\xE3o procedente - n\xE3o \xE9 poss\xEDvel solicitar recebimento" });
      }
      const hasExisting = await storage.hasActivePayoutRequest(payoutRequestData.processId);
      if (hasExisting) {
        return res.status(409).json({ message: "J\xE1 existe uma solicita\xE7\xE3o de recebimento para este processo" });
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
        res.status(400).json({ message: "Dados inv\xE1lidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    }
  });
  app2.get("/api/admin/payout-requests", async (req, res) => {
    try {
      const payoutRequests2 = await storage.getAllPayoutRequests();
      res.json(payoutRequests2);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  app2.patch("/api/admin/process/:id/status", async (req, res) => {
    try {
      const processId = req.params.id;
      const { isWon } = req.body;
      const process2 = await storage.getProcessById(processId);
      if (!process2) {
        return res.status(404).json({ message: "Processo n\xE3o encontrado" });
      }
      const currentSubject = process2.subject || "";
      let newSubject = currentSubject;
      if (isWon) {
        if (!currentSubject.toLowerCase().includes("procedente") && !currentSubject.toLowerCase().includes("ganho")) {
          newSubject = currentSubject + " - julgada procedente em favor do requerente";
        }
      } else {
        newSubject = currentSubject.replace(/\s*-?\s*julgada procedente.*$/i, "").replace(/\s*-?\s*procedente.*$/i, "").replace(/\s*-?\s*ganho.*$/i, "").trim();
        if (!newSubject.toLowerCase().includes("improcedente")) {
          newSubject = newSubject + " - julgada improcedente";
        }
      }
      const updatedProcess = await storage.updateProcess(processId, { subject: newSubject });
      res.json(updatedProcess);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
