import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '../app/page';
import { calculatePayments } from '../utils/billSplitting';

// Mock the utility functions
jest.mock('../utils/billSplitting', () => ({
  calculatePayments: jest.fn(),
  debugBalances: jest.fn()
}));

const mockCalculatePayments = calculatePayments as jest.MockedFunction<typeof calculatePayments>;

describe('Bill Splitting Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCalculatePayments.mockReturnValue([]);
  });

  describe('End-to-End User Workflow', () => {
    it('should complete full bill splitting workflow from user creation to payment calculation', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Step 1: Add participants
      const nameInput = screen.getByPlaceholderText('Enter participant name');
      const addButton = screen.getByRole('button', { name: 'Add' });

      await user.type(nameInput, 'Alice');
      await user.click(addButton);
      await user.type(nameInput, 'Bob');
      await user.click(addButton);
      await user.type(nameInput, 'Charlie');
      await user.click(addButton);

      // Verify users are added by checking they appear somewhere in the document
      await waitFor(() => {
        expect(screen.getAllByText('Alice').length).toBeGreaterThanOrEqual(1); // Allow multiple occurrences
        expect(screen.getAllByText('Bob').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Charlie').length).toBeGreaterThanOrEqual(1);
      });

      // Step 2: Add an expense
      const vendorInput = screen.getByPlaceholderText('Restaurant, store, etc.');
      const amountInput = screen.getByPlaceholderText('0.00');
      const aliceCheckbox = screen.getByLabelText('Alice');
      const bobCheckbox = screen.getByLabelText('Bob');
      const payerSelect = screen.getByDisplayValue('Select payer');
      const addExpenseButton = screen.getByRole('button', { name: 'Add Expense' });

      await user.type(vendorInput, 'Restaurant');
      await user.type(amountInput, '60.00');
      await user.click(aliceCheckbox);
      await user.click(bobCheckbox);
      await user.selectOptions(payerSelect, 'Alice');
      await user.click(addExpenseButton);

      // Step 3: Verify expense appears
      expect(screen.getByText('Restaurant')).toBeInTheDocument();
      expect(screen.getByText('$60.00')).toBeInTheDocument();

      // Step 4: Generate payment plan
      const generateButton = screen.getByText(/Generate Payment Plan/);

      // Mock payment calculation result
      const mockPayments = [
        {
          from: { id: '2', name: 'Bob' },
          to: { id: '1', name: 'Alice' },
          amount: 30
        }
      ];
      mockCalculatePayments.mockReturnValue(mockPayments);

      await user.click(generateButton);

      // Step 5: Verify payment calculation
      expect(mockCalculatePayments).toHaveBeenCalledTimes(1);
      await waitFor(() => {
        expect(screen.getByText('Payment Summary')).toBeInTheDocument();
      });
    });

    it('should handle the exact example from the problem statement', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Load the example data
      const loadExampleButton = screen.getByRole('button', { name: 'Load Example Data' });
      await user.click(loadExampleButton);

      // Verify example data is loaded correctly
      expect(screen.getByText('Example Trip')).toBeInTheDocument();

      // Check if users are present by looking for them anywhere in the document
      await waitFor(() => {
        expect(screen.getAllByText('peter').length).toBeGreaterThan(0);
        expect(screen.getAllByText('john').length).toBeGreaterThan(0);
        expect(screen.getAllByText('tim').length).toBeGreaterThan(0);
      });

      // Verify expenses are loaded
      expect(screen.getByText('Pizza party')).toBeInTheDocument();
      expect(screen.getByText('car rental')).toBeInTheDocument();
      expect(screen.getByText('beer')).toBeInTheDocument();

      // Generate payment plan
      const generateButton = screen.getByText(/Generate Payment Plan/);

      // Mock the expected result from the problem statement
      const mockPayments = [
        {
          from: { id: '2', name: 'john' },
          to: { id: '3', name: 'tim' },
          amount: 15
        },
        {
          from: { id: '1', name: 'peter' },
          to: { id: '3', name: 'tim' },
          amount: 10
        }
      ];
      mockCalculatePayments.mockReturnValue(mockPayments);

      await user.click(generateButton);

      // Verify the payment calculation was called
      expect(mockCalculatePayments).toHaveBeenCalledTimes(1);

      // Verify payment results appear
      await waitFor(() => {
        expect(screen.getByText('Payment Summary')).toBeInTheDocument();
      });
    });

    it('should handle complex multi-expense scenarios', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Add users
      const nameInput = screen.getByPlaceholderText('Enter participant name');
      const addButton = screen.getByRole('button', { name: 'Add' });

      const users = ['Alice', 'Bob', 'Charlie', 'David'];
      for (const userName of users) {
        await user.type(nameInput, userName);
        await user.click(addButton);
      }

      // Add multiple expenses
      const expenses = [
        { vendor: 'Dinner', amount: '120.00', attendees: ['Alice', 'Bob', 'Charlie', 'David'], payer: 'Alice' },
        { vendor: 'Taxi', amount: '40.00', attendees: ['Bob', 'Charlie'], payer: 'Bob' },
        { vendor: 'Hotel', amount: '200.00', attendees: ['Alice', 'Bob', 'Charlie', 'David'], payer: 'David' }
      ];

      for (const expense of expenses) {
        const vendorInput = screen.getByPlaceholderText('Restaurant, store, etc.');
        const amountInput = screen.getByPlaceholderText('0.00');
        const payerSelect = screen.getByDisplayValue('Select payer');
        const addExpenseButton = screen.getByRole('button', { name: 'Add Expense' });

        await user.type(vendorInput, expense.vendor);
        await user.type(amountInput, expense.amount);

        // Select attendees
        for (const attendee of expense.attendees) {
          const checkbox = screen.getByLabelText(attendee);
          await user.click(checkbox);
        }

        await user.selectOptions(payerSelect, expense.payer);
        await user.click(addExpenseButton);

        // Verify expense was added
        expect(screen.getByText(expense.vendor)).toBeInTheDocument();
      }

      // Generate payments with complex mock result
      const mockPayments = [
        { from: { id: '2', name: 'Bob' }, to: { id: '4', name: 'David' }, amount: 60 },
        { from: { id: '3', name: 'Charlie' }, to: { id: '1', name: 'Alice' }, amount: 10 },
        { from: { id: '3', name: 'Charlie' }, to: { id: '4', name: 'David' }, amount: 60 }
      ];
      mockCalculatePayments.mockReturnValue(mockPayments);

      const generateButton = screen.getByText(/Generate Payment Plan/);
      await user.click(generateButton);

      expect(mockCalculatePayments).toHaveBeenCalledTimes(1);
      await waitFor(() => {
        expect(screen.getByText('Payment Summary')).toBeInTheDocument();
      });
    });

    it('should persist user selections when switching between forms', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Add users
      const nameInput = screen.getByPlaceholderText('Enter participant name');
      const addButton = screen.getByRole('button', { name: 'Add' });

      await user.type(nameInput, 'Alice');
      await user.click(addButton);
      await user.type(nameInput, 'Bob');
      await user.click(addButton);

      // Start filling expense form
      const vendorInput = screen.getByPlaceholderText('Restaurant, store, etc.');
      await user.type(vendorInput, 'Test Restaurant');

      const aliceCheckbox = screen.getByLabelText('Alice');
      await user.click(aliceCheckbox);

      // Add another user while expense form is partially filled
      await user.type(nameInput, 'Charlie');
      await user.click(addButton);

      // Verify expense form state is maintained
      expect(vendorInput).toHaveValue('Test Restaurant');
      expect(aliceCheckbox).toBeChecked();

      // Charlie should now be available in the form
      expect(screen.getByLabelText('Charlie')).toBeInTheDocument();
    });

    it('should handle edge cases gracefully', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Try to add expense without users
      const addExpenseButton = screen.getByRole('button', { name: 'Add Expense' });
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      await user.click(addExpenseButton);
      expect(alertSpy).toHaveBeenCalledWith('Please fill in all fields');

      // Add users and try expense with missing fields
      const nameInput = screen.getByPlaceholderText('Enter participant name');
      const addButton = screen.getByRole('button', { name: 'Add' });

      await user.type(nameInput, 'Alice');
      await user.click(addButton);

      const vendorInput = screen.getByPlaceholderText('Restaurant, store, etc.');
      await user.type(vendorInput, 'Incomplete Expense');
      // Don't fill amount, attendees, or payer

      await user.click(addExpenseButton);
      expect(alertSpy).toHaveBeenCalledWith('Please fill in all fields');

      alertSpy.mockRestore();
    });
  });

  describe('State Management and Data Persistence', () => {
    it('should clear all data when Clear All is clicked', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Load example data
      await user.click(screen.getByRole('button', { name: 'Load Example Data' }));
      expect(screen.getByText('Example Trip')).toBeInTheDocument();

      // Clear all
      await user.click(screen.getByRole('button', { name: 'Clear All' }));

      // Verify everything is cleared
      expect(screen.getByText('My Trip')).toBeInTheDocument();
      expect(screen.getByText('No participants added yet')).toBeInTheDocument();
      expect(screen.queryByText('Generate Payment Plan')).not.toBeInTheDocument();
    });

    it('should maintain form state correctly during user interactions', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Add users
      const nameInput = screen.getByPlaceholderText('Enter participant name');
      const addButton = screen.getByRole('button', { name: 'Add' });

      await user.type(nameInput, 'User1');
      await user.click(addButton);
      await user.type(nameInput, 'User2');
      await user.click(addButton);

      // Partially fill expense form
      const vendorInput = screen.getByPlaceholderText('Restaurant, store, etc.');
      const amountInput = screen.getByPlaceholderText('0.00');

      await user.type(vendorInput, 'Partial Fill');
      await user.type(amountInput, '25.50');

      // Interact with other parts of the UI
      await user.click(screen.getByRole('button', { name: 'Load Example Data' }));

      // Form should be reset after loading example data
      expect(vendorInput).toHaveValue('');
      expect(amountInput.value).toBe(''); // Check value property directly for number inputs
    });
  });
});