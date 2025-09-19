import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Save, RotateCcw, UserPlus, UserMinus, FileText, Edit, Trash2, CheckCircle, XCircle, CreditCard, Phone, Building2, MessageCircle, Search, Tags, Link, Plus, Download, Eye, Copy } from "lucide-react";
import type { Process, PayoutRequest, SearchGroup } from "@shared/schema";

export default function Admin() {
  const [, navigate] = useLocation();
  const [rawText, setRawText] = useState("");
  const [cpf, setCpf] = useState("");
  const [processNumber, setProcessNumber] = useState("");
  const [parsedData, setParsedData] = useState<any>(null);
  const [editingProcess, setEditingProcess] = useState<Process | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [newSearchGroup, setNewSearchGroup] = useState({ searchId: "", name: "", description: "" });
  const [linkingProcess, setLinkingProcess] = useState<string | null>(null);
  const [viewingPayoutRequest, setViewingPayoutRequest] = useState<PayoutRequest | null>(null);
  const [messageTemplate, setMessageTemplate] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch statistics
  const { data: statistics } = useQuery<{
    totalCPFs: number;
    totalProcesses: number;
    activeProcesses: number;
  }>({
    queryKey: ["/api/admin/statistics"],
  });

  // Fetch recent processes
  const { data: recentProcesses } = useQuery<Process[]>({
    queryKey: ["/api/admin/recent-processes"],
  });

  // Fetch payout requests
  const { data: payoutRequests } = useQuery<PayoutRequest[]>({
    queryKey: ["/api/admin/payout-requests"],
  });

  // Fetch search groups
  const { data: searchGroups } = useQuery<SearchGroup[]>({
    queryKey: ["/api/admin/search-groups"],
  });

  // Fetch message template
  const { data: templateData } = useQuery<{
    template: string;
    isDefault: boolean;
  }>({
    queryKey: ["/api/admin/message-template"],
  });

  // Update messageTemplate state when templateData changes
  useEffect(() => {
    if (templateData) {
      setMessageTemplate(templateData.template);
    }
  }, [templateData]);

  const createProcessMutation = useMutation({
    mutationFn: async (processData: any) => {
      const response = await apiRequest("POST", "/api/admin/process", processData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Processo cadastrado",
        description: "Processo foi cadastrado com sucesso!",
      });
      handleReset();
      // Invalidate and refetch statistics and processes
      queryClient.invalidateQueries({ queryKey: ["/api/admin/statistics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/recent-processes"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cadastrar processo",
        description: error.message || "Não foi possível cadastrar o processo",
        variant: "destructive",
      });
    },
  });

  const createMultipleProcessesMutation = useMutation({
    mutationFn: async (processes: any[]) => {
      const results = [];
      for (const processData of processes) {
        const response = await apiRequest("POST", "/api/admin/process", processData);
        const result = await response.json();
        results.push(result);
      }
      return results;
    },
    onSuccess: (results) => {
      toast({
        title: `${results.length} processos cadastrados`,
        description: "Todos os processos foram cadastrados com sucesso!",
      });
      handleReset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/statistics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/recent-processes"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cadastrar processos",
        description: error.message || "Não foi possível cadastrar alguns processos",
        variant: "destructive",
      });
    },
  });

  const updateProcessMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/admin/process/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Processo atualizado",
        description: "Processo foi atualizado com sucesso!",
      });
      setEditingProcess(null);
      setEditFormData(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/statistics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/recent-processes"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar processo",
        description: error.message || "Não foi possível atualizar o processo",
        variant: "destructive",
      });
    },
  });

  const deleteProcessMutation = useMutation({
    mutationFn: async (processId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/process/${processId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Processo apagado",
        description: "Processo foi apagado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/statistics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/recent-processes"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao apagar processo",
        description: error.message || "Não foi possível apagar o processo",
        variant: "destructive",
      });
    },
  });

  const updateProcessStatusMutation = useMutation({
    mutationFn: async ({ processId, isWon }: { processId: string; isWon: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/process/${processId}/status`, { isWon });
      return response.json();
    },
    onSuccess: (_, { isWon }) => {
      toast({
        title: "Status atualizado",
        description: `Processo marcado como ${isWon ? 'procedente (ganho)' : 'não procedente (perdido)'}!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/statistics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/recent-processes"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message || "Não foi possível atualizar o status do processo",
        variant: "destructive",
      });
    },
  });

  // Search Group mutations
  const createSearchGroupMutation = useMutation({
    mutationFn: async (searchGroupData: any) => {
      const response = await apiRequest("POST", "/api/admin/search-group", searchGroupData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Grupo de pesquisa criado",
        description: "Grupo de pesquisa foi criado com sucesso!",
      });
      setNewSearchGroup({ searchId: "", name: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/search-groups"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar grupo",
        description: error.message || "Não foi possível criar o grupo de pesquisa",
        variant: "destructive",
      });
    },
  });

  const linkProcessToSearchGroupMutation = useMutation({
    mutationFn: async ({ processId, searchGroupId }: { processId: string; searchGroupId: string | null }) => {
      const response = await apiRequest("PATCH", `/api/admin/process/${processId}/link-search-group`, { searchGroupId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Processo vinculado",
        description: "Processo vinculado ao grupo de pesquisa com sucesso!",
      });
      setLinkingProcess(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/recent-processes"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao vincular processo",
        description: error.message || "Não foi possível vincular o processo",
        variant: "destructive",
      });
    },
  });

  const updateMessageTemplateMutation = useMutation({
    mutationFn: async (template: string) => {
      const response = await apiRequest("PUT", "/api/admin/message-template", { template });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template atualizado",
        description: "Template da mensagem foi atualizado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/message-template"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar template",
        description: error.message || "Não foi possível atualizar o template",
        variant: "destructive",
      });
    },
  });

  const deletePayoutRequestMutation = useMutation({
    mutationFn: async (payoutRequestId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/payout-request/${payoutRequestId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Solicitação removida",
        description: "Solicitação de recebimento foi removida com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payout-requests"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover solicitação",
        description: error.message || "Não foi possível remover a solicitação",
        variant: "destructive",
      });
    },
  });

  // Parse multiple processes from new format
  const parseMultipleProcesses = (text: string) => {
    const processes: any[] = [];
    
    // Split by process headers (lines starting with 📁 Ficha do Processo)
    const sections = text.split(/(?=📁\s*Ficha do Processo)/g).filter(section => section.trim());
    
    for (const section of sections) {
      const process = parseSingleProcessData(section.trim());
      if (process.processNumber) {
        processes.push(process);
      }
    }
    
    return processes;
  };

  const parseSingleProcessData = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    
    const data: any = {
      processNumber: "",
      cpf: "",
      startYear: new Date().getFullYear(),
      nature: "",
      subject: "",
      court: "Justiça dos Estados e do Distrito Federal e Territórios",
      judge: "",
      activePoleMain: "",
      activePoleRole: "Requerente",
      activePolleLawyers: [],
      passivePoleMain: "",
      passivePoleRole: "Requerido", 
      passivePolleLawyers: [],
      otherParties: [],
      value: "",
      startDate: "",
      lastEvent: ""
    };

    // Extract process number using regex (more robust than line position)
    const processNumberMatch = text.match(/(\d{7}-\d{2}\.\d{4}\.\d{1}\.\d{2}\.\d{4})/);
    if (processNumberMatch) {
      data.processNumber = processNumberMatch[1];
    }

    // Extract CPF using regex across the entire text (more robust)
    const cpfMatch = text.match(/CPF:\s*(\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2})/);
    if (cpfMatch) {
      let extractedCpf = cpfMatch[1];
      // Format CPF if it's just numbers
      if (extractedCpf.length === 11) {
        extractedCpf = extractedCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      }
      data.cpf = extractedCpf;
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Extract requerente info
      if (line.includes('👤 Nome:')) {
        data.activePoleMain = line.replace('👤 Nome:', '').trim();
        continue;
      }

      // Extract requerido info
      if (line.includes('🏢 Nome:')) {
        data.passivePoleMain = line.replace('🏢 Nome:', '').trim();
        continue;
      }

      // Extract nature
      if (line.includes('⚖ Natureza:')) {
        data.nature = line.replace('⚖ Natureza:', '').trim();
        continue;
      }

      // Extract value
      if (line.includes('💰 Valor da Causa:')) {
        const valueMatch = line.match(/R\$\s*([\d.,]+)/);
        if (valueMatch) {
          data.value = valueMatch[1].replace(/\./g, '').replace(',', '.');
        }
        continue;
      }

      // Extract start date
      if (line.includes('🗓 Data de Início:')) {
        const dateStr = line.replace('🗓 Data de Início:', '').trim();
        if (dateStr !== 'N/A') {
          data.startDate = dateStr;
          // Try to extract year from date
          const yearMatch = dateStr.match(/\d{4}/);
          if (yearMatch) {
            data.startYear = parseInt(yearMatch[0]);
          }
        }
        continue;
      }

      // Extract last event
      if (line.includes('⏳ Último Evento Registrado:')) {
        data.lastEvent = line.replace('⏳ Último Evento Registrado:', '').trim();
        continue;
      }
    }

    return data;
  };

  // Legacy function for backward compatibility with old format
  const parseProcessData = (text: string) => {
    // Check if it's the new format (contains emoji headers)
    if (text.includes('📁 Ficha do Processo') || text.includes('👤 Nome:') || text.includes('🏢 Nome:')) {
      const processes = parseMultipleProcesses(text);
      return processes.length > 0 ? processes[0] : null;
    }

    // Old format parsing logic
    const lines = text.split('\n').filter(line => line.trim());
    
    const data: any = {
      startYear: new Date().getFullYear(),
      nature: "",
      subject: "",
      court: "Justiça dos Estados e do Distrito Federal e Territórios",
      judge: "",
      activePoleMain: "",
      activePoleRole: "Requerente",
      activePolleLawyers: [],
      passivePoleMain: "",
      passivePoleRole: "Requerido",
      passivePolleLawyers: [],
      otherParties: [],
      value: ""
    };

    let currentSection = "";
    let currentPole = "";
    let expectingNextLine = "";
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Handle expected next line values
      if (expectingNextLine) {
        if (expectingNextLine === "startYear") {
          const year = parseInt(line);
          if (!isNaN(year)) data.startYear = year;
        } else if (expectingNextLine === "nature") {
          data.nature = line;
        } else if (expectingNextLine === "subject") {
          data.subject = line;
        } else if (expectingNextLine === "court") {
          data.court = line;
        } else if (expectingNextLine === "judge") {
          data.judge = line;
        }
        expectingNextLine = "";
        continue;
      }
      
      // Detect sections
      if (line === "Envolvidos") {
        currentSection = "involved";
        continue;
      } else if (line === "Polo Ativo") {
        currentPole = "active";
        continue;
      } else if (line === "Polo Passivo") {
        currentPole = "passive";
        continue;
      } else if (line === "Outras Partes") {
        currentPole = "other";
        continue;
      }

      // Parse field headers that expect next line
      if (line === "Início do processo") {
        expectingNextLine = "startYear";
        continue;
      } else if (line === "Natureza") {
        expectingNextLine = "nature";
        continue;
      } else if (line === "Assunto") {
        expectingNextLine = "subject";
        continue;
      } else if (line === "Poder Judiciário") {
        expectingNextLine = "court";
        continue;
      } else if (line === "Juiz") {
        expectingNextLine = "judge";
        continue;
      } else if (line.startsWith("Valor da causa:")) {
        const valueMatch = line.match(/R\$\s*([\d.,]+)/);
        if (valueMatch) {
          data.value = valueMatch[1].replace(/\./g, '').replace(',', '.');
        }
      }

      // Parse involved parties
      if (currentSection === "involved" && currentPole) {
        if (currentPole === "active") {
          if (line === "Advogado(a)") {
            // Get the lawyer name from the previous line
            const prevLine = lines[i - 1]?.trim();
            if (prevLine && 
                !["Requerente", "Exequente", "Autor", "Polo Ativo", "Requerido", "Executado", "Réu", "Polo Passivo"].includes(prevLine) && 
                prevLine !== data.activePoleMain && 
                prevLine !== "Envolvidos") {
              data.activePolleLawyers.push(prevLine);
            }
          } else if (["Requerente", "Exequente", "Autor", "Polo Ativo"].includes(line)) {
            data.activePoleRole = line === "Polo Ativo" ? "Requerente" : line;
          } else if (!data.activePoleMain && line && 
                     !line.includes("Polo") && 
                     !["Requerente", "Exequente", "Autor", "Advogado(a)", "Envolvidos"].includes(line)) {
            // Check if this could be a main party name
            const nextLine = lines[i + 1]?.trim();
            const nextNextLine = lines[i + 2]?.trim();
            // Look for patterns where a name is followed by role or lawyer designation
            if (nextLine && (
              ["Requerente", "Exequente", "Autor", "Polo Ativo", "Advogado(a)"].includes(nextLine) ||
              (nextLine === "" && nextNextLine === "Advogado(a)")
            )) {
              if (!["Advogado(a)"].includes(nextLine)) {
                data.activePoleMain = line;
              }
            }
          }
        } else if (currentPole === "passive") {
          if (line === "Advogado(a)") {
            // Get the lawyer name from the previous line
            const prevLine = lines[i - 1]?.trim();
            if (prevLine && 
                !["Requerido", "Executado", "Réu", "Polo Passivo", "Parte Passiva", "Polo Ativo", "Requerente"].includes(prevLine) && 
                prevLine !== data.passivePoleMain && 
                prevLine !== "Envolvidos") {
              data.passivePolleLawyers.push(prevLine);
            }
          } else if (["Requerido", "Executado", "Réu", "Polo Passivo", "Parte Passiva"].includes(line)) {
            data.passivePoleRole = ["Polo Passivo", "Parte Passiva"].includes(line) ? "Requerido" : line;
          } else if (!data.passivePoleMain && line && 
                     !line.includes("Polo") && 
                     !["Requerido", "Executado", "Réu", "Parte Passiva", "Advogado(a)", "Envolvidos"].includes(line)) {
            // Check if this could be a main party name
            const nextLine = lines[i + 1]?.trim();
            const nextNextLine = lines[i + 2]?.trim();
            // Look for patterns where a name is followed by role or lawyer designation
            if (nextLine && (
              ["Requerido", "Executado", "Réu", "Polo Passivo", "Parte Passiva", "Advogado(a)"].includes(nextLine) ||
              (nextLine === "" && nextNextLine === "Advogado(a)")
            )) {
              if (!["Advogado(a)"].includes(nextLine)) {
                data.passivePoleMain = line;
              }
            }
          }
        } else if (currentPole === "other") {
          if (line === "Envolvido(a)") {
            // Get the party name from the previous line
            const prevLine = lines[i - 1]?.trim();
            if (prevLine && !prevLine.includes("Outras Partes")) {
              data.otherParties.push(`${prevLine} - ${line}`);
            }
          }
        }
      }
    }

    return data;
  };

  const [multipleProcesses, setMultipleProcesses] = useState<any[]>([]);
  
  const handleTextChange = (text: string) => {
    setRawText(text);
    if (text.trim()) {
      // Check if it's the new format with multiple processes
      if (text.includes('📁 Ficha do Processo') || text.includes('👤 Nome:') || text.includes('🏢 Nome:')) {
        const processes = parseMultipleProcesses(text);
        if (processes.length > 1) {
          // Multiple processes detected
          setMultipleProcesses(processes);
          setParsedData(null);
          setCpf(""); // Clear single process fields
          setProcessNumber("");
          toast({
            title: `${processes.length} processos detectados`,
            description: "Clique em 'Cadastrar Múltiplos Processos' para salvá-los todos de uma vez",
          });
        } else if (processes.length === 1) {
          // Single process - auto-fill fields
          const process = processes[0];
          setParsedData(process);
          setMultipleProcesses([]);
          
          // Auto-fill CPF and process number from extracted data
          if (process.cpf) {
            setCpf(process.cpf);
          }
          if (process.processNumber) {
            setProcessNumber(process.processNumber);
          }
          
          toast({
            title: "Processo extraído com sucesso",
            description: "CPF e número do processo foram preenchidos automaticamente",
          });
        }
      } else {
        // Old format
        const parsed = parseProcessData(text);
        setParsedData(parsed);
        setMultipleProcesses([]);
      }
    } else {
      setParsedData(null);
      setMultipleProcesses([]);
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const handleCpfChange = (value: string) => {
    setCpf(formatCPF(value));
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!cpf || !processNumber || !parsedData) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha CPF, número do processo e cole os dados do processo",
        variant: "destructive",
      });
      return;
    }

    const processData = {
      cpf: cpf,
      processNumber: processNumber,
      value: parsedData.value || "0",
      startYear: parsedData.startYear,
      nature: parsedData.nature || "Não informado",
      subject: parsedData.subject || "Não informado",
      judge: parsedData.judge || "Não informado",
      court: parsedData.court,
      activePoleMain: parsedData.activePoleMain || "Não informado",
      activePoleRole: parsedData.activePoleRole,
      activePolleLawyers: parsedData.activePolleLawyers || [],
      passivePoleMain: parsedData.passivePoleMain || "Não informado",
      passivePoleRole: parsedData.passivePoleRole,
      passivePolleLawyers: parsedData.passivePolleLawyers || [],
      otherParties: parsedData.otherParties || []
    };

    createProcessMutation.mutate(processData);
  };

  const handleMultipleSubmit = () => {
    if (multipleProcesses.length === 0) {
      toast({
        title: "Nenhum processo detectado",
        description: "Por favor, cole as fichas dos processos no formato correto",
        variant: "destructive",
      });
      return;
    }

    // Filter processes that have at least processNumber and cpf (essential fields)
    const validProcesses = multipleProcesses.filter(process => 
      process.processNumber && process.cpf
    );

    if (validProcesses.length === 0) {
      toast({
        title: "Processos inválidos",
        description: "Nenhum processo possui os dados essenciais (número do processo e CPF)",
        variant: "destructive",
      });
      return;
    }

    if (validProcesses.length < multipleProcesses.length) {
      toast({
        title: "Alguns processos ignorados",
        description: `${validProcesses.length} de ${multipleProcesses.length} processos serão cadastrados. Os outros não possuem dados essenciais.`,
      });
    }

    // Format processes for submission with default values for missing fields
    const formattedProcesses = validProcesses.map(process => ({
      cpf: process.cpf,
      processNumber: process.processNumber,
      value: process.value || "0",
      startYear: process.startYear || new Date().getFullYear(),
      nature: process.nature || "Não informado",
      subject: process.nature || "Não informado", // Use nature as subject if no specific subject
      judge: process.judge || "Não informado",
      court: process.court || "Justiça dos Estados e do Distrito Federal e Territórios",
      activePoleMain: process.activePoleMain || "Não informado",
      activePoleRole: process.activePoleRole || "Requerente",
      activePolleLawyers: process.activePolleLawyers || [],
      passivePoleMain: process.passivePoleMain || "Não informado",
      passivePoleRole: process.passivePoleRole || "Requerido",
      passivePolleLawyers: process.passivePolleLawyers || [],
      otherParties: process.otherParties || []
    }));

    createMultipleProcessesMutation.mutate(formattedProcesses);
  };

  const handleReset = () => {
    setRawText("");
    setCpf("");
    setProcessNumber("");
    setParsedData(null);
    setMultipleProcesses([]);
  };

  const handleEditClick = (process: Process) => {
    setEditingProcess(process);
    setEditFormData({
      cpf: "",
      processNumber: process.processNumber || "",
      value: process.value || "",
      startYear: process.startYear || new Date().getFullYear(),
      nature: process.nature || "",
      subject: process.subject || "",
      judge: process.judge || "",
      court: process.court || "Justiça dos Estados e do Distrito Federal e Territórios",
      activePoleMain: process.activePoleMain || "",
      activePoleRole: process.activePoleRole || "",
      activePolleLawyers: process.activePolleLawyers || [],
      passivePoleMain: process.passivePoleMain || "",
      passivePoleRole: process.passivePoleRole || "",
      passivePolleLawyers: process.passivePolleLawyers || [],
      otherParties: process.otherParties || []
    });
  };

  const handleEditSave = () => {
    if (!editingProcess || !editFormData) return;

    updateProcessMutation.mutate({
      id: editingProcess.id,
      data: editFormData
    });
  };

  const handleDeleteClick = (processId: string) => {
    deleteProcessMutation.mutate(processId);
  };

  const handleStatusUpdate = (processId: string, isWon: boolean) => {
    updateProcessStatusMutation.mutate({ processId, isWon });
  };

  const isProcessWon = (process: Process) => {
    const subject = (process.subject ?? "").toLowerCase();
    return subject.includes('procedente') || 
           subject.includes('ganho') || 
           process.status === 'Ganho';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Não informado";
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };

  const formatBankData = (request: PayoutRequest) => {
    if (request.bankName && request.agency && request.account) {
      return `${request.bankName} - Ag: ${request.agency} - Conta: ${request.account}`;
    }
    return 'Dados não disponíveis';
  };

  const generateWhatsAppMessage = async (request: PayoutRequest) => {
    try {
      // Buscar dados do processo
      if (!request.processId) {
        throw new Error('ID do processo não disponível');
      }
      const response = await fetch(`/api/process/${request.processId}`);
      if (!response.ok) throw new Error('Processo não encontrado');
      
      const process = await response.json();
      const processUrl = `${window.location.origin}/payout?processId=${request.processId!}`;
      const value = formatCurrency(process.value);
      
      return `🏛️ *Ministério Público de Santa Catarina*

✅ *PROCESSO EM RECEBIMENTO*

📋 *Dados do Processo:*
• Número: ${process.processNumber}
• Assunto: ${process.subject}
• Valor da Causa: ${value}
• Status: Procedente (Ganho)

💰 *Seu processo está em processo de recebimento!*
O valor da causa está sendo processado para pagamento.

🔗 *Link do Processo:*
${processUrl}

📞 *Em caso de dúvidas, entre em contato conosco.*

_Mensagem automática do Sistema MPSC_`;
    } catch (error) {
      console.error('Erro ao gerar mensagem:', error);
      return 'Erro ao gerar mensagem automática.';
    }
  };

  const handleWhatsAppClick = async (request: PayoutRequest) => {
    const message = await generateWhatsAppMessage(request);
    const phone = request.phone.replace(/\D/g, ''); // Remove caracteres não numéricos
    const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const exportPayoutRequestsToTxt = () => {
    if (!payoutRequests || payoutRequests.length === 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nenhuma solicitação de recebimento encontrada para exportar.",
      });
      return;
    }

    const now = new Date();
    const timestamp = now.toLocaleString('pt-BR');
    
    let content = `SOLICITAÇÕES DE RECEBIMENTO - MINISTÉRIO PÚBLICO DE SANTA CATARINA\n`;
    content += `Exportado em: ${timestamp}\n`;
    content += `Total de solicitações: ${payoutRequests.length}\n`;
    content += `${'='.repeat(80)}\n\n`;

    payoutRequests.forEach((request, index) => {
      const createdAt = request.createdAt ? new Date(request.createdAt).toLocaleString('pt-BR') : 'N/A';
      const bankData = formatBankData(request);
      
      content += `SOLICITAÇÃO #${index + 1}\n`;
      content += `${'-'.repeat(40)}\n`;
      content += `ID do Processo: ${request.processId}\n`;
      content += `CPF: ${request.cpf}\n`;
      content += `Telefone: ${request.phone}\n`;
      content += `Dados Bancários: ${bankData}\n`;
      content += `Status: ${request.status}\n`;
      content += `Data da Solicitação: ${createdAt}\n`;
      content += `\n`;
    });

    content += `${'='.repeat(80)}\n`;
    content += `Fim do arquivo - ${payoutRequests.length} solicitações exportadas\n`;

    // Create and download file
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = `solicitacoes_recebimento_${now.toISOString().slice(0, 10)}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}.txt`;
    
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Exportação concluída",
      description: `Arquivo ${fileName} foi baixado com sucesso.`,
    });
  };

  const handleCreateSearchGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSearchGroup.searchId || !newSearchGroup.name) {
      toast({
        title: "Campos obrigatórios",
        description: "ID de pesquisa e nome são obrigatórios",
        variant: "destructive",
      });
      return;
    }
    createSearchGroupMutation.mutate(newSearchGroup);
  };

  const handleLinkProcess = (processId: string, searchGroupId: string | null) => {
    linkProcessToSearchGroupMutation.mutate({ processId, searchGroupId });
  };

  const handleSaveMessageTemplate = () => {
    if (!messageTemplate.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Template não pode estar vazio.",
      });
      return;
    }
    updateMessageTemplateMutation.mutate(messageTemplate);
  };

  const handleDeletePayoutRequest = (payoutRequestId: string) => {
    deletePayoutRequestMutation.mutate(payoutRequestId);
  };

  const handleViewPayoutRequest = (request: PayoutRequest) => {
    setViewingPayoutRequest(request);
  };

  const handleCopyPayoutRequest = async (request: PayoutRequest) => {
    const requestText = `Solicitação de Recebimento
ID: ${request.id}
CPF: ${request.cpf}
Telefone: ${request.phone}
Banco: ${request.bankName || 'N/A'}
Agência: ${request.agency || 'N/A'}
Conta: ${request.account || 'N/A'}
Status: ${request.status}
Data de Criação: ${request.createdAt ? formatDate(request.createdAt) : 'N/A'}`;

    try {
      await navigator.clipboard.writeText(requestText);
      toast({
        title: "Solicitação copiada",
        description: "Os detalhes da solicitação foram copiados para a área de transferência!",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar a solicitação para a área de transferência",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header gov.br */}
      <header className="bg-[#1f4c96] text-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-lg font-bold">gov.br</div>
              <span className="text-sm opacity-90">Portal do Governo Federal</span>
            </div>
            <div className="text-sm opacity-90">Transparência e Eficiência</div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-[#2d5aa0] text-white">
        <div className="container mx-auto px-4 py-2">
          <div className="flex space-x-6 text-sm">
            <a href="#" className="hover:text-blue-200 transition-colors">Início</a>
            <a href="#" className="hover:text-blue-200 transition-colors">Serviços</a>
            <span className="text-blue-200 font-medium">Administração</span>
          </div>
        </div>
      </nav>

      <div className="bg-gray-50 p-6">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
              <div>
            <h2 className="text-2xl font-bold text-foreground">Painel Administrativo</h2>
            <p className="text-muted-foreground">Gerencie CPFs e processos do sistema</p>
          </div>
          <Button
            onClick={() => navigate && navigate("/search")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="button-search-page"
          >
            <Search className="w-4 h-4 mr-2" />
            Pesquisar Processos
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Process Registration Form */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Input Form */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 w-5 h-5" />
                    Cadastrar Novo Processo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cpf">CPF *</Label>
                        <Input
                          id="cpf"
                          value={cpf}
                          onChange={(e) => handleCpfChange(e.target.value)}
                          placeholder="000.000.000-00"
                          maxLength={14}
                          data-testid="input-admin-cpf"
                        />
                      </div>
                      <div>
                        <Label htmlFor="processNumber">Número do Processo *</Label>
                        <Input
                          id="processNumber"
                          value={processNumber}
                          onChange={(e) => setProcessNumber(e.target.value)}
                          placeholder="0000000-00.0000.0.00.0000"
                          data-testid="input-process-number"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="processData">Dados do Processo *</Label>
                      <Textarea
                        id="processData"
                        value={rawText}
                        onChange={(e) => handleTextChange(e.target.value)}
                        placeholder={`Cole aqui as fichas dos processos no NOVO formato:

📁 Ficha do Processo 99 de 514 📁
4010991-84.2025.8.26.0100

Requerente (Polo Ativo):
👤 Nome: ROGER DIAS FERNANDES
💳 Doc.: CPF: 09507675655

Requerido (Polo Passivo):
🏢 Nome: FACEBOOK SERVICOS ONLINE DO BRASIL LTDA.
💳 Doc.: CNPJ: 13347016000117

Dados da Ação:
⚖ Natureza: Indenização por Dano Moral
💰 Valor da Causa: R$ 10.000,00
🗓 Data de Início: N/A
⏳ Último Evento Registrado: 02/09/2025, 08:19:11

📁 Ficha do Processo 98 de 514 📁
1048585-23.2024.8.26.0100

Requerente (Polo Ativo):
👤 Nome: DOMINIC FONSECA TEIXEIRA LARRUBIA
💳 Doc.: CPF: 15488935797

Requerido (Polo Passivo):
🏢 Nome: TRANSPORTES AEREOS PORTUGUESES S.A. - TAP AIR PORTUGAL
💳 Doc.: CNPJ: 33136896000190

Dados da Ação:
⚖ Natureza: Indenização por Dano Moral
💰 Valor da Causa: R$ 18.691,77
🗓 Data de Início: 02/04/2024
⏳ Último Evento Registrado: 02/09/2025, 08:39:44

[Os campos CPF e Número do Processo serão preenchidos automaticamente]`}
                        rows={15}
                        className="resize-none font-mono text-sm"
                        data-testid="textarea-process-data"
                      />
                    </div>

                    <div className="flex gap-4 pt-4 flex-wrap">
                      <Button
                        type="submit"
                        disabled={createProcessMutation.isPending || (!parsedData && multipleProcesses.length === 0)}
                        data-testid="button-save-process"
                        className={multipleProcesses.length > 0 ? "hidden" : ""}
                      >
                        <Save className="mr-2 w-4 h-4" />
                        {createProcessMutation.isPending ? "Salvando..." : "Salvar Processo"}
                      </Button>
                      
                      {multipleProcesses.length > 0 && (
                        <Button
                          type="button"
                          onClick={handleMultipleSubmit}
                          disabled={createMultipleProcessesMutation.isPending}
                          data-testid="button-save-multiple-processes"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Save className="mr-2 w-4 h-4" />
                          {createMultipleProcessesMutation.isPending ? "Salvando..." : `Cadastrar ${multipleProcesses.length} Processos`}
                        </Button>
                      )}
                      
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleReset}
                        data-testid="button-reset-form"
                      >
                        <RotateCcw className="mr-2 w-4 h-4" />
                        Limpar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Preview */}
              {parsedData && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Prévia da Ficha</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Value */}
                      {parsedData.value && (
                        <div className="text-2xl font-bold text-green-600">
                          Valor da causa: {formatCurrency(parsedData.value)}
                        </div>
                      )}

                      {/* General Information */}
                      <div>
                        <h4 className="text-lg font-semibold text-foreground mb-4">Informações Gerais</h4>
                        <p className="text-sm text-muted-foreground mb-4">Detalhes gerais do processo.</p>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Início do processo</label>
                              <p className="text-foreground">{parsedData.startYear}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Natureza</label>
                              <p className="text-foreground">{parsedData.nature}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Poder Judiciário</label>
                              <p className="text-foreground">{parsedData.court}</p>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Juiz</label>
                              <p className="text-foreground">{parsedData.judge}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Assunto</label>
                              <p className="text-foreground text-sm leading-relaxed">{parsedData.subject}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Involved Parties */}
                      <div>
                        <h4 className="text-lg font-semibold text-foreground mb-4">Envolvidos</h4>
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Active Pole */}
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                            <h5 className="font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center">
                              <UserPlus className="mr-2 w-4 h-4" />
                              Polo Ativo
                            </h5>
                            <div className="space-y-3">
                              <div>
                                <p className="font-medium text-foreground">{parsedData.activePoleMain}</p>
                                <p className="text-sm text-muted-foreground">{parsedData.activePoleRole}</p>
                              </div>
                              {parsedData.activePolleLawyers.length > 0 && (
                                <div className="border-t border-green-200 dark:border-green-700 pt-3">
                                  <p className="text-sm font-medium text-foreground mb-2">Advogados:</p>
                                  <div className="space-y-1 text-sm text-muted-foreground">
                                    {parsedData.activePolleLawyers.map((lawyer: string, index: number) => (
                                      <p key={index}>• {lawyer}</p>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Passive Pole */}
                          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                            <h5 className="font-semibold text-red-800 dark:text-red-200 mb-3 flex items-center">
                              <UserMinus className="mr-2 w-4 h-4" />
                              Polo Passivo
                            </h5>
                            <div className="space-y-3">
                              <div>
                                <p className="font-medium text-foreground">{parsedData.passivePoleMain}</p>
                                <p className="text-sm text-muted-foreground">{parsedData.passivePoleRole}</p>
                              </div>
                              {parsedData.passivePolleLawyers.length > 0 && (
                                <div className="border-t border-red-200 dark:border-red-700 pt-3">
                                  <p className="text-sm font-medium text-foreground mb-2">Advogados:</p>
                                  <div className="space-y-1 text-sm text-muted-foreground">
                                    {parsedData.passivePolleLawyers.map((lawyer: string, index: number) => (
                                      <p key={index}>• {lawyer}</p>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Other Parties */}
                      {parsedData.otherParties.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold text-foreground mb-4">Outras Partes</h4>
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                            <div className="space-y-2">
                              {parsedData.otherParties.map((party: string, index: number) => (
                                <div key={index} className="text-sm">
                                  <p className="font-medium text-foreground">{party}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Quick Stats & Recent Processes */}
          <div className="space-y-6">
            {/* Statistics */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total de CPFs</span>
                    <span className="font-semibold text-foreground" data-testid="text-total-cpfs">
                      {statistics?.totalCPFs || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total de Processos</span>
                    <span className="font-semibold text-foreground" data-testid="text-total-processes">
                      {statistics?.totalProcesses || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Processos Ativos</span>
                    <span className="font-semibold text-green-600" data-testid="text-active-processes">
                      {statistics?.activeProcesses || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Grupos de Pesquisa</span>
                    <span className="font-semibold text-foreground" data-testid="text-search-groups">
                      {searchGroups?.length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Última Atualização</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date().toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search Groups Management */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Tags className="mr-2 w-5 h-5" />
                  Grupos de Pesquisa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateSearchGroup} className="space-y-4 mb-6">
                  <div>
                    <Label htmlFor="searchId">ID de Pesquisa *</Label>
                    <Input
                      id="searchId"
                      value={newSearchGroup.searchId}
                      onChange={(e) => setNewSearchGroup({ ...newSearchGroup, searchId: e.target.value })}
                      placeholder="Ex: FUNC2024001"
                      data-testid="input-search-id"
                    />
                  </div>
                  <div>
                    <Label htmlFor="groupName">Nome do Grupo *</Label>
                    <Input
                      id="groupName"
                      value={newSearchGroup.name}
                      onChange={(e) => setNewSearchGroup({ ...newSearchGroup, name: e.target.value })}
                      placeholder="Ex: Funcionários Demitidos 2024"
                      data-testid="input-group-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="groupDescription">Descrição</Label>
                    <Textarea
                      id="groupDescription"
                      value={newSearchGroup.description}
                      onChange={(e) => setNewSearchGroup({ ...newSearchGroup, description: e.target.value })}
                      placeholder="Descrição opcional do grupo"
                      rows={2}
                      data-testid="textarea-group-description"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={createSearchGroupMutation.isPending}
                    className="w-full"
                    data-testid="button-create-search-group"
                  >
                    <Plus className="mr-2 w-4 h-4" />
                    {createSearchGroupMutation.isPending ? "Criando..." : "Criar Grupo"}
                  </Button>
                </form>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Grupos Existentes:</h4>
                  {searchGroups && searchGroups.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {searchGroups.map((group: SearchGroup) => (
                        <div key={group.id} className="p-3 border rounded-lg bg-muted/50" data-testid={`search-group-${group.id}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{group.searchId}</p>
                              <p className="text-xs text-muted-foreground">{group.name}</p>
                              {group.description && (
                                <p className="text-xs text-muted-foreground mt-1">{group.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground text-sm py-4">Nenhum grupo criado ainda</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Processes Table */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Lista de Processos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  {recentProcesses && recentProcesses.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Processo</TableHead>
                          <TableHead>CPF</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Grupo</TableHead>
                          <TableHead>Vitória</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentProcesses.map((process: Process) => (
                          <TableRow key={process.id} data-testid={`process-row-${process.id}`}>
                            <TableCell className="font-mono text-xs">
                              {process.processNumber}
                            </TableCell>
                            <TableCell className="text-sm">
                              {process.cpfId}
                            </TableCell>
                            <TableCell>
                              <span className={`inline-block px-2 py-1 rounded text-xs ${
                                process.status === 'Ativo' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {process.status}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                {process.searchGroupId ? (
                                  <div className="flex items-center space-x-1">
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      {searchGroups?.find(g => g.id === process.searchGroupId)?.searchId || 'N/A'}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleLinkProcess(process.id, null)}
                                      disabled={linkProcessToSearchGroupMutation.isPending}
                                      data-testid={`button-unlink-${process.id}`}
                                    >
                                      <XCircle className="w-3 h-3 text-red-500" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setLinkingProcess(process.id)}
                                        data-testid={`button-link-${process.id}`}
                                      >
                                        <Link className="w-3 h-3" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Vincular ao Grupo de Pesquisa</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4 py-4">
                                        <p className="text-sm text-muted-foreground">
                                          Processo: <span className="font-mono">{process.processNumber}</span>
                                        </p>
                                        {searchGroups && searchGroups.length > 0 ? (
                                          <div className="space-y-2">
                                            {searchGroups.map((group: SearchGroup) => (
                                              <Button
                                                key={group.id}
                                                variant="outline"
                                                className="w-full justify-start"
                                                onClick={() => handleLinkProcess(process.id, group.id)}
                                                disabled={linkProcessToSearchGroupMutation.isPending}
                                                data-testid={`button-select-group-${group.id}`}
                                              >
                                                <Tags className="w-4 h-4 mr-2" />
                                                <div className="text-left">
                                                  <div className="font-medium">{group.searchId}</div>
                                                  <div className="text-xs text-muted-foreground">{group.name}</div>
                                                </div>
                                              </Button>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-center text-muted-foreground py-4">
                                            Nenhum grupo de pesquisa disponível. Crie um grupo primeiro.
                                          </p>
                                        )}
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                <Button
                                  variant={isProcessWon(process) ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleStatusUpdate(process.id, true)}
                                  disabled={updateProcessStatusMutation.isPending}
                                  data-testid={`button-mark-won-${process.id}`}
                                >
                                  <CheckCircle className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant={!isProcessWon(process) ? "destructive" : "outline"}
                                  size="sm"
                                  onClick={() => handleStatusUpdate(process.id, false)}
                                  disabled={updateProcessStatusMutation.isPending}
                                  data-testid={`button-mark-lost-${process.id}`}
                                >
                                  <XCircle className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditClick(process)}
                                      data-testid={`button-edit-${process.id}`}
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl">
                                    <DialogHeader>
                                      <DialogTitle>Editar Processo</DialogTitle>
                                    </DialogHeader>
                                    {editFormData && (
                                      <div className="space-y-4 max-h-96 overflow-y-auto">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <Label htmlFor="editCpf">CPF</Label>
                                            <Input
                                              id="editCpf"
                                              value={editFormData.cpf}
                                              onChange={(e) => setEditFormData({...editFormData, cpf: e.target.value})}
                                              data-testid="input-edit-cpf"
                                            />
                                          </div>
                                          <div>
                                            <Label htmlFor="editProcessNumber">Número do Processo</Label>
                                            <Input
                                              id="editProcessNumber"
                                              value={editFormData.processNumber}
                                              onChange={(e) => setEditFormData({...editFormData, processNumber: e.target.value})}
                                              data-testid="input-edit-process-number"
                                            />
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <Label htmlFor="editValue">Valor da Causa</Label>
                                            <Input
                                              id="editValue"
                                              value={editFormData.value}
                                              onChange={(e) => setEditFormData({...editFormData, value: e.target.value})}
                                              data-testid="input-edit-value"
                                            />
                                          </div>
                                          <div>
                                            <Label htmlFor="editStartYear">Ano de Início</Label>
                                            <Input
                                              id="editStartYear"
                                              type="number"
                                              value={editFormData.startYear}
                                              onChange={(e) => setEditFormData({...editFormData, startYear: parseInt(e.target.value)})}
                                              data-testid="input-edit-start-year"
                                            />
                                          </div>
                                        </div>
                                        <div>
                                          <Label htmlFor="editNature">Natureza</Label>
                                          <Input
                                            id="editNature"
                                            value={editFormData.nature}
                                            onChange={(e) => setEditFormData({...editFormData, nature: e.target.value})}
                                            data-testid="input-edit-nature"
                                          />
                                        </div>
                                        <div>
                                          <Label htmlFor="editSubject">Assunto</Label>
                                          <Textarea
                                            id="editSubject"
                                            value={editFormData.subject}
                                            onChange={(e) => setEditFormData({...editFormData, subject: e.target.value})}
                                            data-testid="textarea-edit-subject"
                                          />
                                        </div>
                                        <div className="flex justify-end space-x-2">
                                          <Button
                                            variant="outline"
                                            onClick={() => setEditingProcess(null)}
                                          >
                                            Cancelar
                                          </Button>
                                          <Button
                                            onClick={handleEditSave}
                                            disabled={updateProcessMutation.isPending}
                                            data-testid="button-save-edit"
                                          >
                                            {updateProcessMutation.isPending ? "Salvando..." : "Salvar"}
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      data-testid={`button-delete-${process.id}`}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Apagar Processo</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza de que deseja apagar o processo {process.processNumber}?
                                        Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteClick(process.id)}
                                        data-testid={`button-confirm-delete-${process.id}`}
                                      >
                                        Apagar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum processo encontrado
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CreditCard className="mr-2 w-5 h-5" />
                    Solicitações de Recebimento
                  </div>
                  <Button
                    onClick={exportPayoutRequestsToTxt}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    disabled={!payoutRequests || payoutRequests.length === 0}
                  >
                    <Download className="w-4 h-4" />
                    Exportar .txt
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  {payoutRequests && payoutRequests.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Processo</TableHead>
                          <TableHead>CPF</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Dados Bancários</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payoutRequests.map((request: PayoutRequest) => (
                          <TableRow key={request.id} data-testid={`payout-row-${request.id}`}>
                            <TableCell className="font-mono text-xs">
                              {request.processId}
                            </TableCell>
                            <TableCell className="text-sm">
                              {request.cpf}
                            </TableCell>
                            <TableCell className="text-sm flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {request.phone}
                            </TableCell>
                            <TableCell className="text-sm">
                              <div className="flex items-center">
                                <Building2 className="w-3 h-3 mr-1" />
                                <span className="truncate min-w-0 flex-1">
                                  {formatBankData(request)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={`inline-block px-2 py-1 rounded text-xs ${
                                request.status === 'Novo' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {request.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {request.createdAt ? formatDate(request.createdAt) : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleViewPayoutRequest(request)}
                                      className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 hover:text-blue-800"
                                      data-testid={`button-view-payout-${request.id}`}
                                    >
                                      <Eye className="w-3 h-3 mr-1" />
                                      Ver
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>Detalhes da Solicitação de Recebimento</DialogTitle>
                                    </DialogHeader>
                                    {viewingPayoutRequest && (
                                      <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-gray-700">ID da Solicitação</Label>
                                            <p className="text-sm font-mono bg-gray-50 p-2 rounded border">{viewingPayoutRequest.id}</p>
                                          </div>
                                          <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-gray-700">ID do Processo</Label>
                                            <p className="text-sm font-mono bg-gray-50 p-2 rounded border">{viewingPayoutRequest.processId}</p>
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-gray-700">CPF</Label>
                                            <p className="text-sm bg-gray-50 p-2 rounded border">{viewingPayoutRequest.cpf}</p>
                                          </div>
                                          <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-gray-700">Telefone</Label>
                                            <p className="text-sm bg-gray-50 p-2 rounded border flex items-center">
                                              <Phone className="w-3 h-3 mr-1" />
                                              {viewingPayoutRequest.phone}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-sm font-semibold text-gray-700">Dados Bancários</Label>
                                          <div className="bg-gray-50 p-3 rounded border space-y-1">
                                            <div className="flex items-center text-sm">
                                              <Building2 className="w-3 h-3 mr-2" />
                                              <span className="font-medium">Banco:</span>
                                              <span className="ml-2">{viewingPayoutRequest.bankName || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center text-sm">
                                              <span className="font-medium ml-5">Agência:</span>
                                              <span className="ml-2">{viewingPayoutRequest.agency || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center text-sm">
                                              <span className="font-medium ml-5">Conta:</span>
                                              <span className="ml-2">{viewingPayoutRequest.account || 'N/A'}</span>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-gray-700">Status</Label>
                                            <div className={`inline-block px-3 py-1 rounded text-sm ${
                                              viewingPayoutRequest.status === 'Novo' 
                                                ? 'bg-blue-100 text-blue-800' 
                                                : 'bg-gray-100 text-gray-800'
                                            }`}>
                                              {viewingPayoutRequest.status}
                                            </div>
                                          </div>
                                          <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-gray-700">Data de Criação</Label>
                                            <p className="text-sm bg-gray-50 p-2 rounded border">
                                              {viewingPayoutRequest.createdAt ? formatDate(viewingPayoutRequest.createdAt) : 'N/A'}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleWhatsAppClick(request)}
                                  className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700 hover:text-green-800"
                                  data-testid={`button-whatsapp-${request.id}`}
                                >
                                  <MessageCircle className="w-3 h-3 mr-1" />
                                  WhatsApp
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCopyPayoutRequest(request)}
                                  className="bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700 hover:text-gray-800"
                                  data-testid={`button-copy-payout-${request.id}`}
                                >
                                  <Copy className="w-3 h-3 mr-1" />
                                  Copiar
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="bg-red-50 hover:bg-red-100 border-red-200 text-red-700 hover:text-red-800"
                                      data-testid={`button-delete-payout-${request.id}`}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja excluir esta solicitação de recebimento?
                                        Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeletePayoutRequest(request.id!)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <p>Nenhuma solicitação de recebimento encontrada</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Message Template Configuration */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="mr-2 w-5 h-5" />
                  Configuração da Mensagem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="messageTemplate">Template da Mensagem WhatsApp</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Use as seguintes variáveis no template:
                  </p>
                  <div className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-800 p-2 rounded mb-2">
                    <strong>Variáveis disponíveis:</strong><br />
                    {'{processNumber}'} - Número do processo<br />
                    {'{subject}'} - Assunto do processo<br />
                    {'{value}'} - Valor formatado da causa<br />
                    {'{processUrl}'} - Link do processo<br />
                    {'{clientName}'} - Nome do cliente<br />
                  </div>
                  <Textarea
                    id="messageTemplate"
                    value={messageTemplate}
                    onChange={(e) => setMessageTemplate(e.target.value)}
                    placeholder="Digite o template da mensagem..."
                    rows={12}
                    className="font-mono text-sm"
                    data-testid="textarea-message-template"
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {templateData?.isDefault ? (
                      <span className="text-amber-600">🟡 Usando template padrão</span>
                    ) : (
                      <span className="text-green-600">✅ Template personalizado ativo</span>
                    )}
                  </div>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (templateData) {
                          setMessageTemplate(templateData.template);
                        }
                      }}
                      data-testid="button-reset-template"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restaurar
                    </Button>
                    <Button
                      onClick={handleSaveMessageTemplate}
                      disabled={updateMessageTemplateMutation.isPending}
                      data-testid="button-save-template"
                    >
                      {updateMessageTemplateMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Salvar Template
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}