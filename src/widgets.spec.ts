import { expect, describe, it, vi } from 'vitest';
import { initWidgets } from './widgets';

vi.mock('@arcgis/core/views/MapView', () => {
  return {
    default: vi.fn(() => ({})),
  };
});
vi.mock('@arcgis/core/widgets/Home', () => {
  return {
    default: vi.fn(() => ({})),
  };
});
vi.mock('@arcgis/core/widgets/Search', () => {
  return {
    default: vi.fn(() => ({})),
  };
});
vi.mock('@arcgis/core/widgets/Locate', () => {
  return {
    default: vi.fn(() => ({})),
  };
});
vi.mock('@arcgis/core/geometry/Extent', () => {
  return {
    default: vi.fn(() => ({})),
  };
});

describe('widgets', () => {
  it('initializes widgets in view', () => {
    const widgets: unknown[] = [];

    const view: any = {
      ui: {
        add(w: unknown) {
          widgets.push(w);
        },
      },
    };

    initWidgets({ view });
    expect(widgets).toHaveLength(4);
  });
});
