// src/pages/CategoryDetail.tsx
import { ArrowLeft, Plus } from 'lucide-react'; // Asumo que usas lucide-react o similar para iconos

interface CategoryDetailProps {
  category: { id: string; name: string; color: string };
  onBack: () => void;
}

export function CategoryDetail({ category, onBack }: CategoryDetailProps) {
  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* HEADER DINÁMICO */}
      <header 
        className="flex items-center justify-between p-4"
        style={{ 
          // Aquí ocurre la magia: el color del texto/iconos depende de la categoría
          color: category.color,
          backgroundColor: '#1E1E1E' // Fondo oscuro de la barra
        }}
      >
        {/* BOTÓN BACK (Hereda el color automáticamente) */}
        <button onClick={onBack} className="p-2 hover:opacity-80">
          <ArrowLeft size={24} color="currentColor" />
        </button>

        <h1 className="text-lg font-bold">{category.name}</h1>

        {/* BOTÓN "+" (Hereda el color automáticamente) */}
        <button className="p-2 hover:opacity-80">
          <Plus size={24} color="currentColor" />
        </button>
      </header>

      <div className="p-4">
        <p className="text-gray-400">Contenido de {category.name}...</p>
      </div>
    </div>
  );
}