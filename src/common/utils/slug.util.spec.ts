import { generateSlug } from './slug.util';

describe('generateSlug', () => {
  it('converts to lowercase and replaces spaces with hyphens', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });

  it('strips ASCII diacritics', () => {
    expect(generateSlug('café')).toBe('cafe');
  });

  it('converts Vietnamese đ/Đ to d', () => {
    expect(generateSlug('Điện thoại')).toBe('dien-thoai');
  });

  it('handles full Vietnamese phrase', () => {
    expect(generateSlug('Điện thoại & Máy tính bảng')).toBe('dien-thoai-may-tinh-bang');
  });

  it('collapses multiple spaces into one hyphen', () => {
    expect(generateSlug('áo  thun   nam')).toBe('ao-thun-nam');
  });

  it('strips special characters', () => {
    expect(generateSlug('price: $100!')).toBe('price-100');
  });

  it('trims leading and trailing whitespace', () => {
    expect(generateSlug('  áo thun  ')).toBe('ao-thun');
  });

  it('returns empty string for blank input', () => {
    expect(generateSlug('')).toBe('');
  });
});
