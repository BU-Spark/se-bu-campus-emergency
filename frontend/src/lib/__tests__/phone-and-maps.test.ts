import { appleMapsUrl, googleMapsUrl } from '@/lib/maps';
import { formatPhone } from '@/lib/phone';

describe('formatPhone', () => {
  it('formats US numbers with or without the country code', () => {
    expect(formatPhone('+16173532121')).toBe('(617) 353-2121');
    expect(formatPhone('6173532121')).toBe('(617) 353-2121');
  });

  it('leaves short numbers unchanged', () => {
    expect(formatPhone('911')).toBe('911');
  });
});

describe('map links', () => {
  it('searches for the address in Massachusetts', () => {
    expect(appleMapsUrl('930 Commonwealth Ave., #1200')).toBe(
      'https://maps.apple.com/?q=930%20Commonwealth%20Ave.%2C%20%231200%2C%20MA'
    );
    expect(googleMapsUrl('881 Commonwealth Ave.')).toBe(
      'https://www.google.com/maps/search/?api=1&query=881%20Commonwealth%20Ave.%2C%20MA'
    );
  });
});
