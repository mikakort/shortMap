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

    const calculateButton = document.getElementById('calculate-route') as HTMLButtonElement;
    const startLocationInput = document.getElementById('start-location') as HTMLInputElement;
    const destinationsContainer = document.getElementById('destinations') as HTMLDivElement;
    const addDestinationBtn = document.getElementById('add-destination') as HTMLButtonElement;

    if (startLocationInput) {
      initializeAutocomplete(startLocationInput);
    }

    const initialDestinationInput = destinationsContainer.querySelector('input') as HTMLInputElement;
    if (initialDestinationInput) {
      const initialId = `destination-0`;
      initialDestinationInput.id = initialId;
      initializeAutocomplete(initialDestinationInput);
    }

    let destinationCount = 1;
    addDestinationBtn.addEventListener('click', () => {
      const destinationList = destinationsContainer.querySelector('.space-y-2');
      if (!destinationList) return;

      const destinationId = `destination-${destinationCount++}`;
      const newInput = createDestinationInput(destinationId);
      destinationList.appendChild(newInput.wrapper);
      initializeAutocomplete(newInput.input);
    });

    calculateButton.addEventListener('click', async () => {
      try {
        const addresses: string[] = [];

        // Get start location from PlaceAutocompleteElement
        const startElement = document.getElementById('start-location') as any;
        if (startElement?.querySelector('input')?.value) {
          addresses.push(startElement.querySelector('input').value);
        }

        // Get all destination inputs from PlaceAutocompleteElements
        const destinationElements = destinationsContainer.querySelectorAll('gmp-place-autocomplete');
        destinationElements.forEach((element: any) => {
          const input = element.querySelector('input');
          if (input?.value) {
            addresses.push(input.value);
          }
        });

        console.log('Collected addresses:', addresses);

        if (addresses.length < 2) {
          throw new Error('Please enter at least a starting location and one destination');
        }

        calculateButton.textContent = 'Calculating...';
        calculateButton.disabled = true;

        const result = await calculateRoute(addresses);
        console.log('API Response:', result);
      } catch (error) {
        if (error instanceof Error) {
          alert(error.message);
        } else {
          alert('An unexpected error occurred');
        }
      } finally {
        calculateButton.textContent = 'Calculate Route';
        calculateButton.disabled = false;
      }
    });
  } catch (error) {
    console.error('Failed to initialize Google Maps:', error);
  }
}

function createDestinationInput(id: string): { wrapper: HTMLDivElement; input: HTMLInputElement } {
  const wrapper = document.createElement('div');
  wrapper.className = 'relative mt-2';
  wrapper.innerHTML = `
    <input
      type="text"
      id="${id}"
      class="w-full p-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      placeholder="Enter destination"
    />
    <div class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    </div>
  `;
  const input = wrapper.querySelector('input') as HTMLInputElement;
  return { wrapper, input };
}
