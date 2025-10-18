/**
 * Unit tests for SpatialPlanner
 */

import { SpatialPlanner } from '../src/services/ai/spatialPlanner.js';

describe('SpatialPlanner', () => {
  let planner;

  beforeEach(() => {
    planner = new SpatialPlanner();
  });

  describe('planRow', () => {
    test('calculates correct positions for 3 shapes in a row', () => {
      const result = planner.planRow(3, 50, 30, 0, 0, 20);
      
      expect(result.positions).toHaveLength(3);
      expect(result.positions[0]).toEqual({ x: 0, y: 0 });
      expect(result.positions[1]).toEqual({ x: 70, y: 0 }); // 50 + 20
      expect(result.positions[2]).toEqual({ x: 140, y: 0 }); // 50 + 20 + 50 + 20
      expect(result.totalWidth).toBe(190); // (50 * 3) + (20 * 2)
      expect(result.totalHeight).toBe(30);
    });

    test('centers row when centerInViewport is true', () => {
      const result = planner.planRow(3, 50, 30, 0, 0, 20, true, 100);
      
      // Total width = 190, so should start at 100 - 95 = 5
      expect(result.positions[0].x).toBe(5);
      expect(result.centerX).toBe(100);
    });

    test('handles single shape', () => {
      const result = planner.planRow(1, 50, 30, 100, 200, 20);
      
      expect(result.positions).toHaveLength(1);
      expect(result.positions[0]).toEqual({ x: 100, y: 200 });
      expect(result.totalWidth).toBe(50);
    });

    test('handles zero count', () => {
      const result = planner.planRow(0, 50, 30, 0, 0, 20);
      
      expect(result.positions).toHaveLength(0);
      expect(result.totalWidth).toBe(0);
    });
  });

  describe('planGrid', () => {
    test('calculates correct positions for 2x3 grid', () => {
      const result = planner.planGrid(2, 3, 40, 30, 0, 0, 15, 10);
      
      expect(result.positions).toHaveLength(6);
      expect(result.positions[0]).toEqual({ x: 0, y: 0 }); // row 0, col 0
      expect(result.positions[1]).toEqual({ x: 55, y: 0 }); // row 0, col 1 (40 + 15)
      expect(result.positions[2]).toEqual({ x: 110, y: 0 }); // row 0, col 2
      expect(result.positions[3]).toEqual({ x: 0, y: 40 }); // row 1, col 0 (30 + 10)
      expect(result.positions[4]).toEqual({ x: 55, y: 40 }); // row 1, col 1
      expect(result.positions[5]).toEqual({ x: 110, y: 40 }); // row 1, col 2
      
      expect(result.totalWidth).toBe(165); // (40 * 3) + (15 * 2)
      expect(result.totalHeight).toBe(70); // (30 * 2) + (10 * 1)
      expect(result.rows).toBe(2);
      expect(result.cols).toBe(3);
    });

    test('centers grid when centerInViewport is true', () => {
      const result = planner.planGrid(2, 2, 50, 40, 0, 0, 20, 15, true, 100, 80);
      
      // Total width = 140, total height = 95
      // Should start at (100 - 70, 80 - 47.5) = (30, 32.5)
      expect(result.positions[0].x).toBe(30);
      expect(result.positions[0].y).toBe(32.5);
      expect(result.centerX).toBe(100);
      expect(result.centerY).toBe(80);
    });
  });

  describe('planEvenDistribution', () => {
    test('distributes 3 shapes evenly in 300px container', () => {
      const result = planner.planEvenDistribution(3, 50, 300, 100);
      
      expect(result.positions).toHaveLength(3);
      // Available space = 300 - 150 = 150
      // Spacing = 150 / 4 = 37.5
      expect(result.positions[0].x).toBe(37.5);
      expect(result.positions[1].x).toBe(125); // 37.5 + 50 + 37.5
      expect(result.positions[2].x).toBe(212.5); // 125 + 50 + 37.5
      expect(result.actualSpacing).toBe(37.5);
    });

    test('handles single shape in container', () => {
      const result = planner.planEvenDistribution(1, 50, 300, 100);
      
      expect(result.positions).toHaveLength(1);
      expect(result.positions[0]).toEqual({ x: 150, y: 100 }); // Centered
      expect(result.actualSpacing).toBe(0);
    });
  });

  describe('addMargin', () => {
    test('adds margin around group of positions', () => {
      const positions = [
        { x: 10, y: 20 },
        { x: 60, y: 20 },
        { x: 10, y: 70 }
      ];
      
      const result = planner.addMargin(positions, 15);
      
      // Original bounding box: (10, 20) to (60, 70)
      // With 15px margin, should shift to start at (15, 15)
      expect(result[0]).toEqual({ x: 15, y: 35 }); // 10 + 5, 20 + 15
      expect(result[1]).toEqual({ x: 65, y: 35 }); // 60 + 5, 20 + 15
      expect(result[2]).toEqual({ x: 15, y: 85 }); // 10 + 5, 70 + 15
    });
  });

  describe('centerGroup', () => {
    test('centers group of positions', () => {
      const positions = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 0, y: 50 }
      ];
      
      const result = planner.centerGroup(positions, 50, 30, 200, 100);
      
      // Group center is at (50, 25), viewport center is (200, 100)
      // Shift should be (150, 75)
      expect(result[0]).toEqual({ x: 150, y: 75 });
      expect(result[1]).toEqual({ x: 250, y: 75 });
      expect(result[2]).toEqual({ x: 150, y: 125 });
    });
  });

  describe('calculateSmartSpacing', () => {
    test('calculates appropriate spacing for small shapes', () => {
      const spacing = planner.calculateSmartSpacing(50);
      
      // Small shape: 40% buffer = 20, so 50 + 20 = 70
      expect(spacing).toBe(70);
    });

    test('calculates appropriate spacing for medium shapes', () => {
      const spacing = planner.calculateSmartSpacing(100);
      
      // Medium shape: 30% buffer = 30, so 100 + 30 = 130
      expect(spacing).toBe(130);
    });

    test('calculates appropriate spacing for large shapes', () => {
      const spacing = planner.calculateSmartSpacing(200);
      
      // Large shape: 20% buffer = 40, so 200 + 40 = 240
      expect(spacing).toBe(240);
    });

    test('ensures minimum spacing', () => {
      const spacing = planner.calculateSmartSpacing(5);
      
      // Very small shape would give 2px spacing, but minimum is 8
      expect(spacing).toBe(8);
    });
  });

  describe('planLayout', () => {
    test('plans row layout correctly', () => {
      const result = planner.planLayout({
        arrangement: 'row',
        count: 3,
        shapeWidth: 50,
        shapeHeight: 30,
        startX: 0,
        startY: 0,
        spacing: 20
      });
      
      expect(result.positions).toHaveLength(3);
      expect(result.totalWidth).toBe(190);
    });

    test('plans grid layout correctly', () => {
      const result = planner.planLayout({
        arrangement: 'grid',
        count: 6,
        gridRows: 2,
        gridCols: 3,
        shapeWidth: 40,
        shapeHeight: 30,
        startX: 0,
        startY: 0,
        spacing: 15
      });
      
      expect(result.positions).toHaveLength(6);
      expect(result.totalWidth).toBe(165);
      expect(result.totalHeight).toBe(75);
    });

    test('plans even distribution correctly', () => {
      const result = planner.planLayout({
        arrangement: 'even',
        count: 4,
        shapeWidth: 50,
        shapeHeight: 30,
        startX: 0,
        startY: 100,
        spacing: 0,
        containerWidth: 300
      });
      
      expect(result.positions).toHaveLength(4);
      expect(result.totalWidth).toBe(300);
    });
  });
});
