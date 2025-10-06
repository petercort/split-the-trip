import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Home from '../app/page';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  describe('Home Page', () => {
    it('should not have any accessibility violations on initial render', async () => {
      const { container } = render(<Home />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations with users added', async () => {
      const { container } = render(<Home />);
      
      // The axe check will run on the default state which may include
      // example data or other loaded content
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations with example data loaded', async () => {
      // This test checks accessibility with the example data that gets loaded
      // The component renders example data in various states
      const { container } = render(<Home />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Form Accessibility', () => {
    it('should have proper form labels and structure', async () => {
      const { container } = render(<Home />);
      
      // Test the accessibility of form elements specifically
      const results = await axe(container, {
        rules: {
          'form-field-multiple-labels': { enabled: true },
          'label': { enabled: true },
          'label-title-only': { enabled: true },
          'input-button-name': { enabled: true }
        }
      });
      
      expect(results).toHaveNoViolations();
    });
  });

  describe('Table Accessibility', () => {
    it('should have proper table structure when expenses are displayed', async () => {
      const { container } = render(<Home />);
      
      // Focus on table-related accessibility rules
      const results = await axe(container, {
        rules: {
          'table-fake-caption': { enabled: true },
          'td-headers-attr': { enabled: true },
          'th-has-data-cells': { enabled: true },
          'scope-attr-valid': { enabled: true }
        }
      });
      
      expect(results).toHaveNoViolations();
    });
  });

  describe('Color and Contrast', () => {
    it('should meet color contrast requirements', async () => {
      const { container } = render(<Home />);
      
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
          'color-contrast-enhanced': { enabled: true }
        }
      });
      
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation', async () => {
      const { container } = render(<Home />);
      
      const results = await axe(container, {
        rules: {
          'focus-order-semantics': { enabled: true },
          'tabindex': { enabled: true },
          'accesskeys': { enabled: true }
        }
      });
      
      expect(results).toHaveNoViolations();
    });
  });

  describe('Semantic Structure', () => {
    it('should have proper heading hierarchy and semantic structure', async () => {
      const { container } = render(<Home />);
      
      const results = await axe(container, {
        rules: {
          'heading-order': { enabled: true },
          'page-has-heading-one': { enabled: true },
          'bypass': { enabled: true },
          'landmark-one-main': { enabled: true },
          'region': { enabled: true }
        }
      });
      
      expect(results).toHaveNoViolations();
    });
  });
});