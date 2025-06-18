import { calculateRoute } from './api';
import { initializeGoogleMaps, initializeAutocomplete } from './googleMaps';

const GOOGLE_MAPS_API_KEY = import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY;

if (!GOOGLE_MAPS_API_KEY) {
  console.error('Google Maps API key is not configured. Please add PUBLIC_GOOGLE_MAPS_API_KEY to your .env file');
}

export async function initializeRouteHandler() {
  if (!GOOGLE_MAPS_API_KEY) {
    alert('Google Maps API key is not configured. Please check your environment variables.');
    return;
  }

  try {
    await initializeGoogleMaps(GOOGLE_MAPS_API_KEY);

    const calculateButton = document.querySelector('button:not(#add-destination)');
    const startLocationInput = document.getElementById('start-location') as HTMLInputElement;
    const destinationsContainer = document.getElementById('destinations')?.querySelector('.space-y-2');

    if (startLocationInput) {
      initializeAutocomplete(startLocationInput);
    }

    const existingInputs = destinationsContainer?.querySelectorAll('input');
    existingInputs?.forEach((input) => {
      initializeAutocomplete(input as HTMLInputElement);
    });

    calculateButton?.addEventListener('click', async () => {
      try {
        const addresses: string[] = [];

        if (startLocationInput?.value) {
          addresses.push(startLocationInput.value);
        }

        const destinationInputs = destinationsContainer?.querySelectorAll('input');
        destinationInputs?.forEach((input) => {
          if (input.value) {
            addresses.push(input.value);
          }
        });

        if (addresses.length < 2) {
          throw new Error('Please enter at least a starting location and one destination');
        }

        calculateButton.textContent = 'Calculating...';
        calculateButton.setAttribute('disabled', 'true');

        const result = await calculateRoute(addresses);
        displayResults(result);
      } catch (error) {
        if (error instanceof Error) {
          alert(error.message);
        } else {
          alert('An unexpected error occurred');
        }
      } finally {
        calculateButton.textContent = 'Calculate Route';
        calculateButton.removeAttribute('disabled');
      }
    });
  } catch (error) {
    console.error('Failed to initialize Google Maps:', error);
  }
}

function displayResults(result: { route: string[]; totalDistance: string; addresses: string[] }) {
  let resultsContainer = document.getElementById('route-results');
  if (!resultsContainer) {
    resultsContainer = document.createElement('div');
    resultsContainer.id = 'route-results';
    resultsContainer.className = 'mt-6 p-4 rounded-lg bg-muted space-y-4';
    document.querySelector('.bg-card')?.appendChild(resultsContainer);
  }

  resultsContainer.innerHTML = `
    <h3 class="font-medium text-lg">Optimized Route</h3>
    <div class="space-y-2">
      <p class="text-sm text-muted-foreground">Total Distance: ${result.totalDistance}</p>
      <div class="space-y-1">
        ${result.route
          .map(
            (address, index) => `
          <div class="flex items-center gap-2 text-sm">
            <span class="text-muted-foreground">${index + 1}.</span>
            <span>${address}</span>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}
