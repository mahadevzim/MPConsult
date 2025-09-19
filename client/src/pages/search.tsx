import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Search, Copy, CheckCircle, FileText, Clock, User, Scale, Building2, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Process } from "@shared/schema";

export default function SearchPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [processId, setProcessId] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [searchGroupId, setSearchGroupId] = useState("");
  const [groupSearchTriggered, setGroupSearchTriggered] = useState(false);

  // Fetch process details by ID
  const { data: process, isLoading, error, refetch } = useQuery<Process>({
    queryKey: ["/api/process", processId],
    enabled: false, // Manual trigger
  });

  // Fetch processes by search group ID
  const { data: groupSearchResult, isLoading: groupIsLoading, error: groupError, refetch: groupRefetch } = useQuery<{
    searchId: string;
    processes: Array<Process & { fichas: any[] }>;
  }>({
    queryKey: ["/api/search-by-id", searchGroupId],
    enabled: false, // Manual trigger
  });

  // Fetch message template for generating WhatsApp messages
  const { data: templateData } = useQuery<{
    template: string;
    isDefault: boolean;
  }>({
    queryKey: ["/api/admin/message-template"],
  });

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const generateWhatsAppMessage = (process: Process) => {
    const processUrl = `${window.location.origin}/payout?processId=${process.id}`;
    const value = formatCurrency(process.value);
    
    // Use custom template if available, otherwise use default
    const template = templateData?.template || `🏛️ *Ministério Público de Santa Catarina*

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

    // Replace template variables with actual values
    return template
      .replace(/\{processNumber\}/g, process.processNumber)
      .replace(/\{subject\}/g, process.subject)
      .replace(/\{value\}/g, value)
      .replace(/\{processUrl\}/g, processUrl)
      .replace(/\{clientName\}/g, process.activePoleMain || 'Cliente');
  };

  const handleSearch = () => {
    if (!processId.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, informe o ID do processo.",
      });
      return;
    }
    
    setSearchTriggered(true);
    refetch();
  };

  const handleGroupSearch = () => {
    if (!searchGroupId.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, informe o ID de pesquisa do grupo.",
      });
      return;
    }
    
    setGroupSearchTriggered(true);
    groupRefetch();
  };

  const handleCopyMessage = (process: Process) => {
    const message = generateWhatsAppMessage(process);
    navigator.clipboard.writeText(message).then(() => {
      toast({
        title: "Mensagem copiada!",
        description: "A mensagem automática foi copiada para a área de transferência.",
      });
    }).catch(() => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível copiar a mensagem.",
      });
    });
  };

  const handleReset = () => {
    setProcessId("");
    setSearchTriggered(false);
  };

  const handleGroupReset = () => {
    setSearchGroupId("");
    setGroupSearchTriggered(false);
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
            <span className="text-blue-200 font-medium">Pesquisar Processo</span>
          </div>
        </div>
      </nav>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                onClick={() => navigate("/admin")}
                className="p-2"
                data-testid="button-back-admin"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Pesquisar Processos
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Busque processos por ID e copie mensagens automáticas
                </p>
              </div>
            </div>
          </div>

          {/* Search Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>Buscar Processo</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Label htmlFor="processId">ID do Processo</Label>
                  <Input
                    id="processId"
                    type="text"
                    placeholder="Digite o ID do processo..."
                    value={processId}
                    onChange={(e) => setProcessId(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    data-testid="input-process-id"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  onClick={handleSearch}
                  disabled={isLoading}
                  data-testid="button-search-process"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Buscar
                    </>
                  )}
                </Button>
                
                {(searchTriggered || process) && (
                  <Button 
                    variant="outline" 
                    onClick={handleReset}
                    data-testid="button-reset-search"
                  >
                    Limpar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Group Search Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>Buscar por Grupo</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Label htmlFor="searchGroupId">ID do Grupo de Pesquisa</Label>
                  <Input
                    id="searchGroupId"
                    type="text"
                    placeholder="Digite o ID do grupo..."
                    value={searchGroupId}
                    onChange={(e) => setSearchGroupId(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleGroupSearch()}
                    data-testid="input-search-group-id"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  onClick={handleGroupSearch}
                  disabled={groupIsLoading}
                  data-testid="button-search-group"
                >
                  {groupIsLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Buscando grupo...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Buscar Grupo
                    </>
                  )}
                </Button>
                
                {(groupSearchTriggered || groupSearchResult) && (
                  <Button 
                    variant="outline" 
                    onClick={handleGroupReset}
                    data-testid="button-reset-group-search"
                  >
                    Limpar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Group Search Results */}
          {groupSearchTriggered && (
            <Card>
              <CardHeader>
                <CardTitle>Resultados do Grupo</CardTitle>
              </CardHeader>
              <CardContent>
                {groupIsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Buscando processos do grupo...</p>
                  </div>
                ) : groupError ? (
                  <Alert variant="destructive" data-testid="alert-group-error">
                    <AlertDescription>
                      Grupo não encontrado ou erro na busca. Verifique o ID e tente novamente.
                    </AlertDescription>
                  </Alert>
                ) : groupSearchResult && groupSearchResult.processes.length > 0 ? (
                  <div className="space-y-4">
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Encontrados {groupSearchResult.processes.length} processos no grupo "{groupSearchResult.searchId}"
                      </p>
                    </div>
                    
                    {groupSearchResult.processes.map((process, index) => (
                      <Card key={process.id} className="border-l-4 border-l-green-500" data-testid={`card-process-${process.id}`}>
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-gray-900 dark:text-white">
                                  Processo #{index + 1}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Número:</span> {process.processNumber}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Assunto:</span> {process.subject}
                              </p>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-green-600" />
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {process.activePoleMain}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Parte Ativa:</span> {process.activePoleRole}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Valor:</span> {formatCurrency(process.value)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => handleCopyMessage(process)}
                              variant="outline"
                              className="flex-1"
                              data-testid={`button-copy-message-${process.id}`}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Copiar Mensagem
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : groupSearchResult ? (
                  <Alert data-testid="alert-no-processes">
                    <AlertDescription>
                      Nenhum processo encontrado neste grupo.
                    </AlertDescription>
                  </Alert>
                ) : null}
              </CardContent>
            </Card>
          )}

          {/* Search Results */}
          {searchTriggered && (
            <Card>
              <CardHeader>
                <CardTitle>Resultado da Pesquisa</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Buscando processo...</p>
                  </div>
                ) : error ? (
                  <Alert variant="destructive">
                    <AlertDescription>
                      Processo não encontrado ou erro na busca. Verifique o ID e tente novamente.
                    </AlertDescription>
                  </Alert>
                ) : process && typeof process === 'object' && 'processNumber' in process ? (
                  <div className="space-y-6">
                    {/* Process Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Número do Processo
                          </Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span className="font-mono text-sm" data-testid="text-process-number">
                              {process.processNumber || 'N/A'}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Valor da Causa
                          </Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-lg font-semibold text-green-600" data-testid="text-process-value">
                              {process.value ? formatCurrency(process.value) : 'N/A'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Ano de Início
                          </Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Calendar className="w-4 h-4 text-gray-600" />
                            <span data-testid="text-process-year">{process.startYear || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Natureza
                          </Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Scale className="w-4 h-4 text-purple-600" />
                            <span data-testid="text-process-nature">{process.nature || 'N/A'}</span>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Tribunal
                          </Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Building2 className="w-4 h-4 text-gray-600" />
                            <span data-testid="text-process-court">{process.court || 'N/A'}</span>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Juiz
                          </Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <User className="w-4 h-4 text-gray-600" />
                            <span data-testid="text-process-judge">{process.judge || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Assunto
                      </Label>
                      <p className="mt-1 text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-lg" data-testid="text-process-subject">
                        {process.subject || 'N/A'}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        onClick={() => process && handleCopyMessage(process)}
                        disabled={!process}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        data-testid="button-copy-message"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar Mensagem Automática
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/payout?processId=${process.id}`)}
                        data-testid="button-view-process"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Ver Processo
                      </Button>
                    </div>

                    {/* Process Status Badge */}
                    <div className="flex justify-end">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <CheckCircle className="w-3 h-3 mr-1 inline" />
                        Processo Procedente
                      </span>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}