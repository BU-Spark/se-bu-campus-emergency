import { Colors } from '../theme';

describe('theme', () => {
  it('defines light and dark color schemes', () => {
    expect(Colors.light).toBeDefined();
    expect(Colors.dark).toBeDefined();
  });
});
