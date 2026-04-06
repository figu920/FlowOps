import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileAvatarProps {
  user: {
    name: string;
    avatarUrl?: string | null; // Puede tener URL o no
  };
  className?: string;
  iconClassName?: string;
}

export default function ProfileAvatar({ user, className, iconClassName }: ProfileAvatarProps) {
  // Lógica: Si hay avatarUrl, úsala. Si no, no pongas nada en src (fallará al fallback)
  const imgSrc = user.avatarUrl ? user.avatarUrl : undefined;

  return (
    <Avatar className={cn("border-2 border-white/10 bg-[#2C2C2E]", className)}>
      {imgSrc && <AvatarImage src={imgSrc} alt={user.name} className="object-cover" />}
      
      {/* Esto se muestra si no hay imagen o si falla la carga */}
      <AvatarFallback className="bg-[#2C2C2E] flex items-center justify-center">
        {/* El "monigote gris típico" */}
        <UserIcon className={cn("text-muted-foreground opacity-50 w-1/2 h-1/2", iconClassName)} />
      </AvatarFallback>
    </Avatar>
  );
}