import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Search, Shield, Zap, Eye } from "lucide-react";
import { useLocation } from "wouter";
import Results from "./results";
import type { Process } from "@shared/schema";

interface HomeProps {
  onSearchResults: (results: any, cpf: string) => void;
  searchResults: Process[];
  searchedCPF: string;
  onBackToSearch: () => void;
}

export default function Home({ onSearchResults, searchResults, searchedCPF, onBackToSearch }: HomeProps) {
  const [searchValue, setSearchValue] = useState("");
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Function to automatically detect input type
  const detectInputType = (value: string): "cpf" | "process" | "invalid" => {
    const cleanValue = value.replace(/\s+/g, '');
    
    // Check if it matches CPF pattern (with or without formatting)
    const cpfPattern = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
    if (cpfPattern.test(cleanValue)) {
      return "cpf";
    }
    
    // Check if it matches process number pattern (with or without formatting)
    const processPattern = /^\d{7}-?\d{2}\.?\d{4}\.?\d{1}\.?\d{2}\.?\d{4}$/;
    if (processPattern.test(cleanValue)) {
      return "process";
    }
    
    return "invalid";
  };

  const searchMutation = useMutation({
    mutationFn: async ({ value, type }: { value: string, type: "cpf" | "process" }) => {
      if (type === "cpf") {
        const response = await apiRequest("POST", "/api/search", { cpf: value });
        return await response.json();
      } else {
        const response = await apiRequest("POST", "/api/search-by-process", { processNumber: value });
        return await response.json();
      }
    },
    onSuccess: (data) => {
      if (data.processes) {
        onSearchResults(data.processes, data.cpf || data.processNumber || searchValue);
      } else if (data.process) {
        // Single process result
        onSearchResults([data.process], searchValue);
      }
      navigate("/results");
    },
    onError: (error: any) => {
      toast({
        title: "Erro na consulta",
        description: error.message || "Não foi possível realizar a consulta",
        variant: "destructive",
      });
    },
  });

  const formatInput = (value: string) => {
    const inputType = detectInputType(value);
    
    if (inputType === "cpf") {
      const numbers = value.replace(/\D/g, '');
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else if (inputType === "process") {
      const numbers = value.replace(/[^\d.-]/g, '');
      return numbers;
    }
    
    // For invalid or partially typed inputs, allow basic formatting
    return value;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(formatInput(value));
  };

  const validateInput = () => {
    if (!searchValue.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, insira um CPF ou número de processo para consulta",
        variant: "destructive",
      });
      return { valid: false, type: "invalid" as const };
    }

    const inputType = detectInputType(searchValue);
    
    if (inputType === "invalid") {
      toast({
        title: "Formato inválido",
        description: "Por favor, insira um CPF no formato 000.000.000-00 ou número de processo no formato 0000000-00.0000.0.00.0000",
        variant: "destructive",
      });
      return { valid: false, type: "invalid" as const };
    }

    return { valid: true, type: inputType };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateInput();
    if (!validation.valid) {
      return;
    }

    // We know validation.type is either "cpf" or "process" because validation.valid is true
    searchMutation.mutate({ value: searchValue, type: validation.type as "cpf" | "process" });
  };

  // If there are search results, show the results page
  if (searchResults.length > 0 && searchedCPF) {
    return (
      <Results 
        processes={searchResults}
        searchedCPF={searchedCPF}
        onBackToSearch={onBackToSearch}
      />
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
            <a href="#" className="hover:text-blue-200 transition-colors">Início</a>
            <a href="#" className="hover:text-blue-200 transition-colors">Serviços</a>
            <span className="text-blue-200 font-medium">Consulta Processual</span>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12">
        {/* Title Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Consulta Processual
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Consulte processos por CPF, CNPJ, nome ou número do processo de forma rápida e segura através do portal oficial do Governo Federal
          </p>
        </div>

        {/* Main Search Form */}
        <div className="max-w-2xl mx-auto mb-16">
          <Card className="shadow-xl border-0">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="text-center mb-6">
                  <Label htmlFor="search" className="text-lg font-medium text-gray-700 block mb-2">
                    Digite um CPF (000.000.000-00)
                  </Label>
                  <p className="text-sm text-gray-500">
                    ou número de processo
                  </p>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    id="search"
                    name="search"
                    value={searchValue}
                    onChange={handleInputChange}
                    placeholder="Digite CPF ou número do processo"
                    className="pl-12 h-14 text-lg border-2 border-gray-200 focus:border-[#1f4c96] focus:ring-[#1f4c96] rounded-lg"
                    data-testid="input-search"
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full h-12 text-lg bg-[#1f4c96] hover:bg-[#1a4285] text-white font-semibold rounded-lg"
                  disabled={searchMutation.isPending}
                  data-testid="button-search"
                >
                  <Search className="mr-2 w-5 h-5" />
                  {searchMutation.isPending ? "Consultando..." : "Consultar CPF"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Trust Indicators */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">100% Seguro</h3>
            </div>
            <div className="flex flex-col items-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Consulta Instantânea</h3>
            </div>
            <div className="flex flex-col items-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Eye className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Totalmente Sigiloso</h3>
            </div>
          </div>
        </div>

        {/* How it Works Section */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Como funciona nossa consulta?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Busca Otimizada
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Encontre processos pelo CPF, nome ou número utilizando nossa plataforma integrada aos principais tribunais do país.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <div className="w-6 h-6 text-green-600">📋</div>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Informações Completas
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Acesse todas as movimentações, documentos e informações detalhadas do processo de forma organizada.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <div className="w-6 h-6 text-orange-600">🔔</div>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Atualizações em Tempo Real
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Receba notificações automáticas sobre qualquer movimentação ou atualização em seus processos.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
