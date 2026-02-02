export const getProducts = async ({ baseUrl }: { baseUrl?: string }): Promise<any> => {
  try {
    const apiBase = baseUrl || process.env.NEXT_PUBLIC_API_URL || ''
    const response = await fetch(`${apiBase}/api/billing/products`)

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching products:', error)
    throw error
  }
}

export const getProduct = async ({ baseUrl, product_id }: { baseUrl?: string, product_id: string }): Promise<any> => {
  try {
    const apiBase = baseUrl || process.env.NEXT_PUBLIC_API_URL || ''
    const response = await fetch(`${apiBase}/api/billing/product?product_id=${product_id}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching product:', error)
    throw error
  }
}

export const getCustomer = async ({ baseUrl, customer_id }: { baseUrl?: string, customer_id: string }): Promise<any> => {
  try {
    const apiBase = baseUrl || process.env.NEXT_PUBLIC_API_URL || ''
    const response = await fetch(`${apiBase}/api/billing/customer?customer_id=${customer_id}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch customer: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching customer:', error)
    throw error
  }
}

export const getCustomerSubscriptions = async ({ baseUrl, customer_id }: { baseUrl?: string, customer_id: string }): Promise<any> => {
  try {
    const apiBase = baseUrl || process.env.NEXT_PUBLIC_API_URL || ''
    const response = await fetch(`${apiBase}/api/billing/customer/subscriptions?customer_id=${customer_id}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch customer subscriptions: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching customer subscriptions:', error)
    throw error
  }
}

export const getCustomerPayments = async ({ baseUrl, customer_id }: { baseUrl?: string, customer_id: string }): Promise<any> => {
  try {
    const apiBase = baseUrl || process.env.NEXT_PUBLIC_API_URL || ''
    const response = await fetch(`${apiBase}/api/billing/customer/payments?customer_id=${customer_id}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch customer payments: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching customer payments:', error)
    throw error
  }
}

export const createCustomer = async ({ baseUrl, customer }: { baseUrl?: string, customer: { email: string; name: string; phone_number?: string | null } }): Promise<any> => {
  try {
    const apiBase = baseUrl || process.env.NEXT_PUBLIC_API_URL || ''
    const response = await fetch(`${apiBase}/api/billing/customer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customer),
    })

    if (!response.ok) {
      throw new Error(`Failed to create customer: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error creating customer:', error)
    throw error
  }
}

export const updateCustomer = async ({ baseUrl, customer_id, customer }: { baseUrl?: string, customer_id: string, customer: { name?: string | null; phone_number?: string | null } }): Promise<any> => {
  try {
    const apiBase = baseUrl || process.env.NEXT_PUBLIC_API_URL || ''
    const response = await fetch(`${apiBase}/api/billing/customer?customer_id=${customer_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customer),
    })

    if (!response.ok) {
      throw new Error(`Failed to update customer: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating customer:', error)
    throw error
  }
}

export const checkout = async ({ baseUrl, productCart, customer, return_url, metadata }: { baseUrl?: string, productCart: Array<{ name: string; quantity: number; amount: number }>, customer: { email: string; name: string }, return_url: string, metadata?: Record<string, string> }): Promise<any> => {
  try {
    const apiBase = baseUrl || process.env.NEXT_PUBLIC_API_URL || ''
    const response = await fetch(`${apiBase}/api/billing/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productCart, customer, return_url, metadata }),
    })

    if (!response.ok) {
      throw new Error(`Failed to checkout: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error checking out:', error)
    throw error
  }
}