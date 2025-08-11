
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Store, Check } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PublishToStoreButtonProps {
  avatarId: string;
  isPublished: boolean;
  onPublishChange: (published: boolean) => void;
}

const PublishToStoreButton = ({ avatarId, isPublished, onPublishChange }: PublishToStoreButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleTogglePublish = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('avatares')
        .update({ is_published_in_store: !isPublished })
        .eq('id', avatarId);

      if (error) throw error;

      onPublishChange(!isPublished);
      toast.success(
        !isPublished 
          ? 'Avatar publicado na loja com sucesso!' 
          : 'Avatar removido da loja'
      );
    } catch (error) {
      console.error('Erro ao alterar status de publicação:', error);
      toast.error('Erro ao alterar status de publicação');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleTogglePublish}
      disabled={isLoading}
      className={`${
        isPublished
          ? 'bg-green-100 hover:bg-green-200 text-green-700 border-2 border-green-300 hover:border-green-400'
          : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border-2 border-emerald-300 hover:border-emerald-400'
      } rounded-lg transition-all duration-200 flex items-center space-x-2`}
    >
      {isPublished ? (
        <>
          <Check className="h-4 w-4" />
          <span>Na Loja</span>
        </>
      ) : (
        <>
          <Store className="h-4 w-4" />
          <span>Publicar na Loja</span>
        </>
      )}
    </Button>
  );
};

export default PublishToStoreButton;
