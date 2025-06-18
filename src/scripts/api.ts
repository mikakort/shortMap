interface RouteResponse {
  route: string[];
  totalDistance: string;
  addresses: string[];
}

interface RouteError {
  error: string;
}

const API_URL = 'http://localhost:3000';

export async function calculateRoute(
  addresses: string[]
): Promise<{ route: string[]; totalDistance: string; addresses: string[] }> {
  try {
    const response = await fetch(`${API_URL}/calculate-route`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ addresses }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to calculate route' }));
      throw new Error(errorData.message || 'An unknown error occurred');
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred during the API request');
  }
}
