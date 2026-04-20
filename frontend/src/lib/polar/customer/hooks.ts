import backendClient from "@/lib/api/clients/backendClient"
import { useQuery } from "@tanstack/react-query"

export const useCustomer = () => {
  return useQuery({
    queryKey: ['polar', 'customer'],
    queryFn: async () => {
      backendClient.get('/customer')
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
  