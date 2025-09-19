import { Button } from "@/components/ui/button";
import { Scale } from "lucide-react";

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  return (
    <header className="bg-primary shadow-sm border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white p-2 rounded-lg">
              <Scale className="text-primary text-2xl w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary-foreground">
                Ministério Público de Santa Catarina
              </h1>
              <p className="text-sm text-primary-foreground/80">
                Sistema de Consulta Processual
              </p>
            </div>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Button
              variant={currentPage === 'search' ? 'secondary' : 'ghost'}
              onClick={() => onNavigate('search')}
              className="text-primary-foreground/80 hover:text-primary-foreground transition-colors font-medium"
              data-testid="button-search-nav"
            >
              <i className="fas fa-search mr-2"></i>Consulta
            </Button>
            <Button
              variant={currentPage === 'admin' ? 'secondary' : 'ghost'}
              onClick={() => onNavigate('admin')}
              className="text-primary-foreground/80 hover:text-primary-foreground transition-colors font-medium"
              data-testid="button-admin-nav"
            >
              <i className="fas fa-cog mr-2"></i>Administrador
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
