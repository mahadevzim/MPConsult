import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const cpfs = pgTable("cpfs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cpf: text("cpf").notNull().unique(),
  name: text("name"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const processes = pgTable("processes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cpfId: varchar("cpf_id").notNull().references(() => cpfs.id),
  searchGroupId: varchar("search_group_id").references(() => searchGroups.id, { onDelete: 'set null' }),
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
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const payoutRequests = pgTable("payout_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  processId: varchar("process_id").notNull().references(() => processes.id, { onDelete: 'cascade' }),
  cpf: text("cpf").notNull(),
  phone: text("phone").notNull(),
  bankName: text("bank_name").notNull(),
  agency: text("agency").notNull(),
  account: text("account").notNull(),
  status: text("status").default("Novo"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const searchGroups = pgTable("search_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  searchId: text("search_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const fichas = pgTable("fichas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cpfId: varchar("cpf_id").notNull().references(() => cpfs.id),
  processId: varchar("process_id").references(() => processes.id, { onDelete: 'set null' }),
  assignedStaffId: text("assigned_staff_id").notNull(),
  message: text("message"),
  status: text("status").default("Ativo"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const cpfRelations = relations(cpfs, ({ many }) => ({
  processes: many(processes),
  fichas: many(fichas),
}));

export const processRelations = relations(processes, ({ one, many }) => ({
  cpf: one(cpfs, {
    fields: [processes.cpfId],
    references: [cpfs.id],
  }),
  searchGroup: one(searchGroups, {
    fields: [processes.searchGroupId],
    references: [searchGroups.id],
  }),
  payoutRequests: many(payoutRequests),
  fichas: many(fichas),
}));

export const searchGroupRelations = relations(searchGroups, ({ many }) => ({
  processes: many(processes),
}));

export const payoutRequestRelations = relations(payoutRequests, ({ one }) => ({
  process: one(processes, {
    fields: [payoutRequests.processId],
    references: [processes.id],
  }),
}));

export const fichaRelations = relations(fichas, ({ one }) => ({
  cpf: one(cpfs, {
    fields: [fichas.cpfId],
    references: [cpfs.id],
  }),
  process: one(processes, {
    fields: [fichas.processId],
    references: [processes.id],
  }),
}));

export const insertCpfSchema = createInsertSchema(cpfs).omit({
  id: true,
  createdAt: true,
});

export const insertProcessSchema = createInsertSchema(processes).omit({
  id: true,
  createdAt: true,
});

export const insertPayoutRequestSchema = createInsertSchema(payoutRequests).omit({
  id: true,
  createdAt: true,
});

export const insertSearchGroupSchema = createInsertSchema(searchGroups).omit({
  id: true,
  createdAt: true,
});

export const insertFichaSchema = createInsertSchema(fichas).omit({
  id: true,
  createdAt: true,
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertCpf = z.infer<typeof insertCpfSchema>;
export type InsertProcess = z.infer<typeof insertProcessSchema>;
export type InsertPayoutRequest = z.infer<typeof insertPayoutRequestSchema>;
export type InsertSearchGroup = z.infer<typeof insertSearchGroupSchema>;
export type InsertFicha = z.infer<typeof insertFichaSchema>;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type Cpf = typeof cpfs.$inferSelect;
export type Process = typeof processes.$inferSelect;
export type PayoutRequest = typeof payoutRequests.$inferSelect;
export type SearchGroup = typeof searchGroups.$inferSelect;
export type Ficha = typeof fichas.$inferSelect;
export type SystemSetting = typeof systemSettings.$inferSelect;
