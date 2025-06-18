interface RouteResponse {
  route: string[];
  totalDistance: string;
  addresses: string[];
}

interface RouteError {
  error: string;
}

export async function calculateRoute(addresses: string[]): Promise<RouteResponse> {
  try {
    const response = await fetch('/api/calculate-route', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ addresses }),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData: RouteError = await response.json();
      throw new Error(errorData.error || 'Failed to calculate route');
    }

    const data: RouteResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Route calculation failed: ${error.message}`);
    }
    throw new Error('An unexpected error occurred');
  }
}
