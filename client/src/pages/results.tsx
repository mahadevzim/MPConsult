import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, UserPlus, UserMinus, CheckCircle, Banknote } from "lucide-react";
import type { Process } from "@shared/schema";
import { useLocation } from "wouter";

interface ResultsProps {
  processes: Process[];
  searchedCPF: string;
  onBackToSearch: () => void;
}

export default function Results({ processes, searchedCPF, onBackToSearch }: ResultsProps) {
  const [, navigate] = useLocation();
  
  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
  };

  const handlePayoutRequest = (process: Process) => {
    const searchParams = new URLSearchParams({
      processId: process.id
    });
    navigate(`/payout?${searchParams.toString()}`);
  };

  const isWonCase = (process: Process) => {
    const subject = (process.subject ?? "").toLowerCase();
    return subject.includes('procedente') || 
           subject.includes('ganho') || 
           process.status === 'Ganho';
  };

  if (processes.length === 0) {
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
              <button onClick={onBackToSearch} className="hover:text-blue-200 transition-colors">Início</button>
              <a href="#" className="hover:text-blue-200 transition-colors">Serviços</a>
              <span className="text-blue-200 font-medium">Consulta Processual - Resultados</span>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Resultados da Consulta</h2>
                <p className="text-gray-600">
                  CPF: <span data-testid="text-searched-cpf">{searchedCPF}</span>
                </p>
              </div>
              <Button
                onClick={onBackToSearch}
                className="bg-[#1f4c96] hover:bg-[#1a4285] text-white"
                data-testid="button-back-search"
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                Nova Consulta
              </Button>
            </div>

            <Card className="text-center p-12 shadow-lg">
              <CardContent>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Nenhum processo encontrado
                </h3>
                <p className="text-gray-600">
                  Não foram encontrados processos para o CPF informado.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

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
            <button onClick={onBackToSearch} className="hover:text-blue-200 transition-colors">Início</button>
            <a href="#" className="hover:text-blue-200 transition-colors">Serviços</a>
            <span className="text-blue-200 font-medium">Consulta Processual - Resultados</span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Resultados da Consulta</h2>
              <p className="text-gray-600">
                CPF: <span data-testid="text-searched-cpf">{searchedCPF}</span>
              </p>
            </div>
            <Button
              onClick={onBackToSearch}
              className="bg-[#1f4c96] hover:bg-[#1a4285] text-white"
              data-testid="button-back-search"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Nova Consulta
            </Button>
          </div>

        {/* Victory Notification - only show for won cases */}
        {processes.length > 0 && processes.some(process => {
          const subject = (process.subject ?? "").toLowerCase();
          return subject.includes('procedente') || 
                 subject.includes('ganho') || 
                 process.status === 'Ganho';
        }) && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-900/20">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700 dark:text-green-200">
              <strong>🎉 Parabéns!</strong> Sua(s) causa(s) foi(ram) julgada(s) procedente(s). 
              Clique em "Solicitar Recebimento" para informar seus dados bancários e receber o valor.
            </AlertDescription>
          </Alert>
        )}

        {processes.map((process, index) => (
          <Card key={process.id} className="shadow-lg mb-8" data-testid={`card-process-${index}`}>
            <CardContent className="p-6">
              {/* Process Header */}
              <div className="border-b border-border pb-4 mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2" data-testid={`text-process-number-${index}`}>
                      Processo nº {process.processNumber}
                    </h3>
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      Valor da causa: <span data-testid={`text-process-value-${index}`}>{formatCurrency(process.value)}</span>
                    </div>
                  </div>
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                    {process.status}
                  </div>
                </div>
              </div>

              {/* General Information */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-foreground mb-4">Informações Gerais</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Início do processo</label>
                        <p className="text-foreground" data-testid={`text-start-year-${index}`}>{process.startYear}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Natureza</label>
                        <p className="text-foreground" data-testid={`text-nature-${index}`}>{process.nature}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Poder Judiciário</label>
                        <p className="text-foreground" data-testid={`text-court-${index}`}>{process.court}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Assunto</label>
                        <p className="text-foreground text-sm leading-relaxed" data-testid={`text-subject-${index}`}>
                          {process.subject}
                        </p>
                      </div>
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
                        <p className="font-medium text-foreground" data-testid={`text-active-main-${index}`}>
                          {process.activePoleMain}
                        </p>
                        <p className="text-sm text-muted-foreground">{process.activePoleRole}</p>
                      </div>
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
                        <p className="font-medium text-foreground" data-testid={`text-passive-main-${index}`}>
                          {process.passivePoleMain}
                        </p>
                        <p className="text-sm text-muted-foreground">{process.passivePoleRole}</p>
                      </div>
                    </div>
                  </div>

                  {/* Other Parties */}
                  {process.otherParties && process.otherParties.length > 0 && (
                    <div className="mt-6">
                      <h5 className="font-semibold text-foreground mb-3">Outras Partes</h5>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <div className="space-y-2">
                          {process.otherParties.map((party, partyIndex) => (
                            <p key={partyIndex} className="text-sm font-medium text-foreground" data-testid={`text-other-party-${index}-${partyIndex}`}>
                              • {party}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payout Request Button */}
              <div className="mt-6 pt-4 border-t border-border">
                {isWonCase(process) ? (
                  <Button
                    onClick={() => handlePayoutRequest(process)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                    data-testid={`button-request-payout-${index}`}
                  >
                    <Banknote className="mr-2 w-5 h-5" />
                    Solicitar Recebimento do Valor da Causa
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="lg"
                    disabled
                    className="w-full text-muted-foreground"
                    data-testid={`button-payout-disabled-${index}`}
                  >
                    <Banknote className="mr-2 w-5 h-5" />
                    Processo não procedente
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      </div>
    </div>
  );
}
