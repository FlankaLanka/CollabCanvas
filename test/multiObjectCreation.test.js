/**
 * Integration tests for multi-object creation
 */

import { SpatialPlanner } from '../src/services/ai/spatialPlanner.js';

describe('Multi-Object Creation', () => {
  let planner;

  beforeEach(() => {
    planner = new SpatialPlanner();
  });

  describe('Spatial Planning', () => {
    test('3x3 grid creates 9 positions', () => {
      const plan = planner.planGrid(3, 3, 50, 50, 0, 0, 20, 20);
      
      expect(plan.positions).toHaveLength(9);
      expect(plan.rows).toBe(3);
      expect(plan.cols).toBe(3);
      expect(plan.totalWidth).toBe(190); // (50 * 3) + (20 * 2)
      expect(plan.totalHeight).toBe(190);
    });

    test('Row spacing is calculated correctly', () => {
      const plan = planner.planRow(5, 50, 50, 0, 0, 20);
      
      // totalWidth = (50 * 5) + (20 * 4) = 330
      expect(plan.totalWidth).toBe(330);
      expect(plan.positions.length).toBe(5);
      expect(plan.positions[0]).toEqual({ x: 0, y: 0 });
      expect(plan.positions[1]).toEqual({ x: 70, y: 0 }); // 50 + 20
      expect(plan.positions[2]).toEqual({ x: 140, y: 0 }); // 50 + 20 + 50 + 20
    });

    test('Even distribution calculates correct spacing', () => {
      const plan = planner.planEvenDistribution(4, 50, 300, 100);
      
      // Available space = 300 - 200 = 100
      // Spacing = 100 / 5 = 20
      expect(plan.actualSpacing).toBe(20);
      expect(plan.positions.length).toBe(4);
      expect(plan.positions[0].x).toBe(20);
      expect(plan.positions[1].x).toBe(90); // 20 + 50 + 20
    });

    test('Centering works correctly', () => {
      const plan = planner.planRow(3, 50, 50, 0, 0, 20, true, 200);
      
      // Total width = 190, should center at 200
      // Start position = 200 - 95 = 105
      expect(plan.positions[0].x).toBe(105);
      expect(plan.centerX).toBe(200);
    });

    test('Margin is applied correctly', () => {
      const positions = [
        { x: 10, y: 20 },
        { x: 60, y: 20 },
        { x: 10, y: 70 }
      ];
      
      const margined = planner.addMargin(positions, 15);
      
      // Should shift to start at (15, 15)
      expect(margined[0].x).toBe(15);
      expect(margined[0].y).toBe(35);
    });
  });

  describe('Layout Calculations', () => {
    test('Smart spacing for small shapes', () => {
      const spacing = planner.calculateSmartSpacing(50);
      
      // Small shape: 40% buffer = 20, so 50 + 20 = 70
      expect(spacing).toBe(70);
    });

    test('Smart spacing for medium shapes', () => {
      const spacing = planner.calculateSmartSpacing(100);
      
      // Medium shape: 30% buffer = 30, so 100 + 30 = 130
      expect(spacing).toBe(130);
    });

    test('Smart spacing for large shapes', () => {
      const spacing = planner.calculateSmartSpacing(200);
      
      // Large shape: 20% buffer = 40, so 200 + 40 = 240
      expect(spacing).toBe(240);
    });

    test('Minimum spacing is enforced', () => {
      const spacing = planner.calculateSmartSpacing(5);
      
      // Very small shape would give 2px spacing, but minimum is 8
      expect(spacing).toBe(8);
    });
  });

  describe('Complex Layouts', () => {
    test('Grid with centering and margin', () => {
      const plan = planner.planLayout({
        arrangement: 'grid',
        count: 6,
        gridRows: 2,
        gridCols: 3,
        shapeWidth: 40,
        shapeHeight: 30,
        startX: 0,
        startY: 0,
        spacing: 15,
        centerInViewport: true,
        marginSize: 20,
        viewportCenterX: 200,
        viewportCenterY: 150
      });
      
      expect(plan.positions).toHaveLength(6);
      expect(plan.totalWidth).toBe(165); // (40 * 3) + (15 * 2)
      expect(plan.totalHeight).toBe(75); // (30 * 2) + (15 * 1)
    });

    test('Row with even distribution', () => {
      const plan = planner.planLayout({
        arrangement: 'even',
        count: 4,
        shapeWidth: 50,
        shapeHeight: 30,
        startX: 0,
        startY: 100,
        spacing: 0,
        containerWidth: 300
      });
      
      expect(plan.positions).toHaveLength(4);
      expect(plan.totalWidth).toBe(300);
    });
  });

  describe('Edge Cases', () => {
    test('Single shape in row', () => {
      const plan = planner.planRow(1, 50, 30, 100, 200, 20);
      
      expect(plan.positions).toHaveLength(1);
      expect(plan.positions[0]).toEqual({ x: 100, y: 200 });
      expect(plan.totalWidth).toBe(50);
    });

    test('Zero count', () => {
      const plan = planner.planRow(0, 50, 30, 0, 0, 20);
      
      expect(plan.positions).toHaveLength(0);
      expect(plan.totalWidth).toBe(0);
    });

    test('Empty positions array', () => {
      const centered = planner.centerGroup([], 50, 30, 200, 100);
      
      expect(centered).toHaveLength(0);
    });
  });

  describe('Integration Scenarios', () => {
    test('Complete 3x3 grid creation workflow', () => {
      // 1. Plan the grid
      const plan = planner.planGrid(3, 3, 50, 50, 0, 0, 20, 20);
      
      expect(plan.positions).toHaveLength(9);
      expect(plan.rows).toBe(3);
      expect(plan.cols).toBe(3);
      
      // 2. Verify grid structure
      const positions = plan.positions;
      
      // Check first row
      expect(positions[0]).toEqual({ x: 0, y: 0 });
      expect(positions[1]).toEqual({ x: 70, y: 0 }); // 50 + 20
      expect(positions[2]).toEqual({ x: 140, y: 0 }); // 50 + 20 + 50 + 20
      
      // Check second row
      expect(positions[3]).toEqual({ x: 0, y: 70 }); // 50 + 20
      expect(positions[4]).toEqual({ x: 70, y: 70 });
      expect(positions[5]).toEqual({ x: 140, y: 70 });
      
      // Check third row
      expect(positions[6]).toEqual({ x: 0, y: 140 });
      expect(positions[7]).toEqual({ x: 70, y: 140 });
      expect(positions[8]).toEqual({ x: 140, y: 140 });
    });

    test('Row with specific spacing workflow', () => {
      // 1. Plan the row
      const plan = planner.planRow(5, 50, 30, 0, 0, 25);
      
      expect(plan.positions).toHaveLength(5);
      expect(plan.totalWidth).toBe(250); // (50 * 5) + (25 * 4)
      
      // 2. Verify spacing
      const positions = plan.positions;
      for (let i = 1; i < positions.length; i++) {
        const spacing = positions[i].x - (positions[i-1].x + 50);
        expect(spacing).toBe(25);
      }
    });

    test('Centered group with margin workflow', () => {
      // 1. Plan row
      const plan = planner.planRow(4, 60, 40, 0, 0, 30);
      
      // 2. Add margin
      const margined = planner.addMargin(plan.positions, 25);
      
      expect(margined).toHaveLength(4);
      
      // 3. Center the group
      const centered = planner.centerGroup(margined, 60, 40, 200, 150);
      
      expect(centered).toHaveLength(4);
      
      // 4. Verify centering
      const centerX = (Math.min(...centered.map(p => p.x)) + Math.max(...centered.map(p => p.x))) / 2;
      const centerY = (Math.min(...centered.map(p => p.y)) + Math.max(...centered.map(p => p.y))) / 2;
      
      expect(Math.abs(centerX - 200)).toBeLessThan(1);
      expect(Math.abs(centerY - 150)).toBeLessThan(1);
    });
  });
});
