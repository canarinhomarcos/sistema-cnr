import { createEdgeSpark } from "@edgespark/client";

// URL do backend - O YouWare converte automaticamente para produção no Publish
export const client = createEdgeSpark({ 
  baseUrl: "https://staging--ucgcta84xinnibfgzm7u.youbase.cloud" 
});
