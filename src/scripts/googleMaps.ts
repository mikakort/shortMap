declare global {
  interface Window {
    google: any;
  }
}

export function initializeGoogleMaps(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
}

export function initializeAutocomplete(input: HTMLInputElement): void {
  if (!window.google) {
    console.error('Google Maps not loaded');
    return;
  }

  const autocomplete = new window.google.maps.places.Autocomplete(input, {
    types: ['address'],
    fields: ['formatted_address', 'geometry'],
  });

  // Prevent form submission on enter
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  });

  // Update input with formatted address when place is selected
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    if (place.formatted_address) {
      input.value = place.formatted_address;
    }
  });
}
