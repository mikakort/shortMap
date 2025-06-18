declare global {
  interface Window {
    google: any;
  }
}

export function initializeGoogleMaps(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) {
      return resolve();
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=beta&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Wait for the library to be fully loaded
      const checkLoaded = () => {
        if (window.google?.maps?.places) {
          resolve();
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
    };
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });
}

export function initializeAutocomplete(input: HTMLInputElement, onPlaceSelect?: (place: any) => void) {
  if (!window.google?.maps?.places?.PlaceAutocompleteElement) {
    throw new Error('Google Maps PlaceAutocompleteElement not loaded. Make sure you are using v=beta script.');
  }

  // Create the PlaceAutocompleteElement
  const autocompleteElement = new window.google.maps.places.PlaceAutocompleteElement();

  // Copy styling and attributes from the original input
  autocompleteElement.id = input.id;
  input.classList.forEach((c) => autocompleteElement.classList.add(c));
  autocompleteElement.placeholder = input.placeholder;
  autocompleteElement.setAttribute('style', input.getAttribute('style') || '');

  // Replace the input with the autocomplete element
  input.parentNode?.replaceChild(autocompleteElement, input);

  // Add event listener for place selection using the correct event
  autocompleteElement.addEventListener('gmp-select', async ({ placePrediction }: { placePrediction: any }) => {
    try {
      // Convert PlacePrediction to Place object and fetch fields
      const place = placePrediction.toPlace();
      await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location'] });

      console.log('Selected place:', place);
      console.log('Formatted address:', place.formattedAddress);

      if (onPlaceSelect && place) {
        onPlaceSelect(place);
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
  });

  // Request geolocation on first user interaction for proximity bias
  const requestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        // Set location bias for the autocomplete element using LatLngBounds
        const radius = 0.5; // 0.5 degrees ≈ 50km
        const bounds = new window.google.maps.LatLngBounds(
          new window.google.maps.LatLng(userLocation.lat - radius, userLocation.lng - radius),
          new window.google.maps.LatLng(userLocation.lat + radius, userLocation.lng + radius)
        );
        autocompleteElement.locationBias = bounds;
      },
      (error) => {
        console.warn('Could not get user location for proximity bias:', error);
      }
    );
  };

  // Request location on first user interaction
  autocompleteElement.addEventListener('focus', requestLocation, { once: true });
}

export function attachNativeAutocomplete(input: HTMLInputElement, onPlaceSelect?: (place: any) => void) {
  if (!window.google?.maps?.places?.Autocomplete) {
    throw new Error('Google Maps Places Autocomplete not loaded.');
  }
  let autocomplete: any;
  let locationSet = false;
  function setLocationBias() {
    if (locationSet) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const circle = new window.google.maps.Circle({
          center: userLocation,
          radius: 50000, // 50km
        });
        autocomplete.setBounds(circle.getBounds());
        locationSet = true;
      },
      (error) => {
        console.warn('Could not get user location for proximity bias:', error);
      }
    );
  }
  autocomplete = new window.google.maps.places.Autocomplete(input, {
    types: ['address'],
    fields: ['formatted_address', 'geometry', 'name'],
  });
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    if (onPlaceSelect && place) {
      onPlaceSelect(place);
    }
  });
  input.addEventListener('focus', setLocationBias, { once: true });
}
