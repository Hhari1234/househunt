import { resolveImagePath, getPropertyImages, getPropertyCover, PLACEHOLDER_IMAGE } from './images';

describe('resolveImagePath', () => {
  it('returns data URIs unchanged', () => {
    expect(resolveImagePath('data:image/png;base64,AAAA')).toBe('data:image/png;base64,AAAA');
  });

  it('returns absolute URLs unchanged', () => {
    expect(resolveImagePath('https://example.com/a.jpg')).toBe('https://example.com/a.jpg');
  });

  it('maps /uploads paths to the API server', () => {
    expect(resolveImagePath('/uploads/photo.jpg')).toBe('http://localhost:3001/uploads/photo.jpg');
  });

  it('maps public/ assets to the frontend root', () => {
    expect(resolveImagePath('public/assets/Listing1/1.jpg')).toBe('/assets/Listing1/1.jpg');
  });

  it('maps assets/ paths to the frontend root', () => {
    expect(resolveImagePath('assets/hero.jpg')).toBe('/assets/hero.jpg');
  });

  it('returns null for empty input', () => {
    expect(resolveImagePath('')).toBe(null);
    expect(resolveImagePath(null)).toBe(null);
  });
});

describe('getPropertyImages', () => {
  it('returns placeholder when no photos exist', () => {
    expect(getPropertyImages({})).toEqual([PLACEHOLDER_IMAGE]);
    expect(getPropertyImages({ listingPhotoPaths: [] })).toEqual([PLACEHOLDER_IMAGE]);
  });

  it('resolves stored photo paths', () => {
    const property = { listingPhotoPaths: ['public/assets/Listing1/1.jpg', '/uploads/x.jpg'] };
    expect(getPropertyImages(property)).toEqual(['/assets/Listing1/1.jpg', 'http://localhost:3001/uploads/x.jpg']);
  });

  it('filters out unresolvable paths and falls back to placeholder', () => {
    const property = { listingPhotoPaths: ['', null] };
    expect(getPropertyImages(property)).toEqual([PLACEHOLDER_IMAGE]);
  });
});

describe('getPropertyCover', () => {
  it('returns the first image', () => {
    const property = { listingPhotoPaths: ['assets/a.jpg', 'assets/b.jpg'] };
    expect(getPropertyCover(property)).toBe('/assets/a.jpg');
  });

  it('returns placeholder when no images', () => {
    expect(getPropertyCover({})).toBe(PLACEHOLDER_IMAGE);
  });
});