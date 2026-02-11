const getBackendUrl = (path: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  return `${baseUrl}${path}`;
};

const backendClient = {
  async get(path: string) {
    const res = await fetch(getBackendUrl(path), { method: 'GET' });
    return res.json();
  },
  async post(path: string, body?: any) {
    const res = await fetch(getBackendUrl(path), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    return res.json();
  },
  async put(path: string, body?: any) {
    const res = await fetch(getBackendUrl(path), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    return res.json();
  },
  async del(path: string) {
    const res = await fetch(getBackendUrl(path), { method: 'DELETE' });
    return res.json();
  }
  ,
  // alias using full name expected by some callers
  async delete(path: string) {
    return backendClient.del(path);
  }
};

export default backendClient;
