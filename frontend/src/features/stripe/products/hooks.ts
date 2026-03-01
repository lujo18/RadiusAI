import { useQuery } from "@tanstack/react-query";
import { productApi } from "./surface";

export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: () => productApi.getAll(),
  });
};

export const useProduct = (productId: string) => {
  return useQuery({
    queryKey: ["product", productId],
    queryFn: () => productApi.get(productId),
    enabled: !!productId,
  });
};
