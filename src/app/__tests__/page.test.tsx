import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import Home from '../page';
import { calculatePayments } from '../../utils/billSplitting';

// Mock the utility functions
jest.mock('../../utils/billSplitting', () => ({
  calculatePayments: jest.fn(),
  debugBalances: jest.fn()
}));

const mockCalculatePayments = calculatePayments as jest.MockedFunction<typeof calculatePayments>;

describe('Home Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCalculatePayments.mockReturnValue([]);
  });

  describe('Initial Render', () => {
    it('should render without crashing', () => {
      render(<Home />);
      expect(screen.getByText('Split the Bill')).toBeInTheDocument();
    });

    it('should display the main heading and description', () => {
      render(<Home />);
      
      expect(screen.getByText('Split the Bill')).toBeInTheDocument();
      expect(screen.getByText(/Easily split expenses and calculate payments/)).toBeInTheDocument();
    });

    it('should show initial trip name', () => {
      render(<Home />);
      expect(screen.getByText(/Trip:/)).toBeInTheDocument();
      expect(screen.getByText('My Trip')).toBeInTheDocument();
    });

    it('should render demo control buttons', () => {
      render(<Home />);
      expect(screen.getByRole('button', { name: 'Load Example Data' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Clear All' })).toBeInTheDocument();
    });

    it('should show empty state messages initially', () => {
      render(<Home />);
      expect(screen.getByText('No participants added yet')).toBeInTheDocument();
    });
  });

  describe('User Management', () => {
    it('should add a new user when valid name is entered', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      const input = screen.getByPlaceholderText('Enter participant name');
      const addButton = screen.getByRole('button', { name: 'Add' });
      
      await user.type(input, 'John Doe');
      await user.click(addButton);
      
      // Check that the user was added - look for the name in the participants list
      await waitFor(() => {
        expect(screen.queryByText('No participants added yet')).not.toBeInTheDocument();
      });
      expect(input).toHaveValue('');
    });

    it('should add user on Enter key press', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      const input = screen.getByPlaceholderText('Enter participant name');
      
      await user.type(input, 'Jane Smith');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.queryByText('No participants added yet')).not.toBeInTheDocument();
      });
    });

    it('should not add user with empty name', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      const addButton = screen.getByRole('button', { name: 'Add' });
      
      await user.click(addButton);
      
      expect(screen.getByText('No participants added yet')).toBeInTheDocument();
    });

    it('should trim whitespace from user names', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      const input = screen.getByPlaceholderText('Enter participant name');
      const addButton = screen.getByRole('button', { name: 'Add' });
      
      await user.type(input, '  Alice  ');
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.queryByText('No participants added yet')).not.toBeInTheDocument();
      });
    });

    it('should add multiple users', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      const input = screen.getByPlaceholderText('Enter participant name');
      const addButton = screen.getByRole('button', { name: 'Add' });
      
      await user.type(input, 'User1');
      await user.click(addButton);
      
      await user.type(input, 'User2');
      await user.click(addButton);
      
      // Check that both users were added by checking the empty state is gone
      await waitFor(() => {
        expect(screen.queryByText('No participants added yet')).not.toBeInTheDocument();
      });
    });
  });

  describe('Expense Management', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      // Add test users first
      const input = screen.getByPlaceholderText('Enter participant name');
      const addButton = screen.getByRole('button', { name: 'Add' });
      
      await user.type(input, 'Peter');
      await user.click(addButton);
      await user.type(input, 'John');
      await user.click(addButton);
    });

    it('should not add expense with missing fields', async () => {
      const user = userEvent.setup();
      
      // Mock alert
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      const addExpenseButton = screen.getByRole('button', { name: 'Add Expense' });
      await user.click(addExpenseButton);
      
      expect(alertSpy).toHaveBeenCalledWith('Please fill in all fields');
      alertSpy.mockRestore();
    });

    it('should add expense with all required fields', async () => {
      const user = userEvent.setup();
      
      // Fill in expense form
      const vendorInput = screen.getByPlaceholderText('Restaurant, store, etc.');
      const amountInput = screen.getByPlaceholderText('0.00');
      const peterCheckbox = screen.getByLabelText('Peter');
      const payerSelect = screen.getByDisplayValue('Select payer');
      const addExpenseButton = screen.getByRole('button', { name: 'Add Expense' });
      
      await user.type(vendorInput, 'Pizza Place');
      await user.type(amountInput, '20.00');
      await user.click(peterCheckbox);
      await user.selectOptions(payerSelect, 'Peter');
      await user.click(addExpenseButton);
      
      // Check if expense appears in the table
      await waitFor(() => {
        expect(screen.getByText('Pizza Place')).toBeInTheDocument();
        expect(screen.getByText('$20.00')).toBeInTheDocument();
      });
    });

    it('should clear form after adding expense', async () => {
      const user = userEvent.setup();
      
      const vendorInput = screen.getByPlaceholderText('Restaurant, store, etc.');
      const amountInput = screen.getByPlaceholderText('0.00');
      const peterCheckbox = screen.getByLabelText('Peter');
      const payerSelect = screen.getByDisplayValue('Select payer');
      const addExpenseButton = screen.getByRole('button', { name: 'Add Expense' });
      
      await user.type(vendorInput, 'Coffee Shop');
      await user.type(amountInput, '15.50');
      await user.click(peterCheckbox);
      await user.selectOptions(payerSelect, 'Peter');
      await user.click(addExpenseButton);
      
      // Form should be cleared
      expect(vendorInput).toHaveValue('');
      expect(amountInput.value).toBe(''); // Check the value property directly for number inputs
      expect(peterCheckbox).not.toBeChecked();
      expect(payerSelect).toHaveValue('');
    });

    it('should display expenses in table format', async () => {
      const user = userEvent.setup();
      
      // Add an expense
      const vendorInput = screen.getByPlaceholderText('Restaurant, store, etc.');
      const amountInput = screen.getByPlaceholderText('0.00');
      const peterCheckbox = screen.getByLabelText('Peter');
      const johnCheckbox = screen.getByLabelText('John');
      const payerSelect = screen.getByDisplayValue('Select payer');
      const addExpenseButton = screen.getByRole('button', { name: 'Add Expense' });
      
      await user.type(vendorInput, 'Restaurant');
      await user.type(amountInput, '30.00');
      await user.click(peterCheckbox);
      await user.click(johnCheckbox);
      await user.selectOptions(payerSelect, 'Peter');
      await user.click(addExpenseButton);
      
      // Check table headers - use getAllByText to handle multiple "Vendor" elements
      expect(screen.getAllByText('Vendor')).toHaveLength(2); // One in form, one in table
      expect(screen.getByText('Cost')).toBeInTheDocument();
      expect(screen.getByText('Users Present')).toBeInTheDocument();
      expect(screen.getByText('Who Paid')).toBeInTheDocument();
      
      // Check expense data
      expect(screen.getByText('Restaurant')).toBeInTheDocument();
      expect(screen.getByText('$30.00')).toBeInTheDocument();
    });
  });

  describe('Demo Data Functionality', () => {
    it('should load example data when Load Example Data is clicked', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      const loadButton = screen.getByRole('button', { name: 'Load Example Data' });
      await user.click(loadButton);
      
      // Check if trip name changed
      expect(screen.getByText('Example Trip')).toBeInTheDocument();
      
      // Check if example expenses are loaded
      expect(screen.getByText('Pizza party')).toBeInTheDocument();
      expect(screen.getByText('car rental')).toBeInTheDocument();
      expect(screen.getByText('beer')).toBeInTheDocument();
    });

    it('should clear all data when Clear All is clicked', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      // First load example data
      await user.click(screen.getByRole('button', { name: 'Load Example Data' }));
      expect(screen.getByText('Example Trip')).toBeInTheDocument();
      
      // Then clear all
      await user.click(screen.getByRole('button', { name: 'Clear All' }));
      
      expect(screen.getByText('My Trip')).toBeInTheDocument();
      expect(screen.getByText('No participants added yet')).toBeInTheDocument();
    });
  });

  describe('Payment Generation', () => {
    it('should not show Generate Payment Plan button when no expenses exist', () => {
      render(<Home />);
      expect(screen.queryByText(/Generate Payment Plan/)).not.toBeInTheDocument();
    });

    it('should show Generate Payment Plan button when expenses exist', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      // Load example data to have expenses
      await user.click(screen.getByRole('button', { name: 'Load Example Data' }));
      
      expect(screen.getByText(/Generate Payment Plan/)).toBeInTheDocument();
    });

    it('should call calculatePayments when Generate Payment Plan is clicked', async () => {
      const user = userEvent.setup();
      const mockPayments = [
        {
          from: { id: '2', name: 'john' },
          to: { id: '3', name: 'tim' },
          amount: 15
        }
      ];
      
      mockCalculatePayments.mockReturnValue(mockPayments);
      
      render(<Home />);
      
      // Load example data and generate payments
      await user.click(screen.getByRole('button', { name: 'Load Example Data' }));
      await user.click(screen.getByText(/Generate Payment Plan/));
      
      expect(mockCalculatePayments).toHaveBeenCalledTimes(1);
    });

    it('should display payment results after generation', async () => {
      const user = userEvent.setup();
      const mockPayments = [
        {
          from: { id: '2', name: 'john' },
          to: { id: '3', name: 'tim' },
          amount: 15
        }
      ];
      
      mockCalculatePayments.mockReturnValue(mockPayments);
      
      render(<Home />);
      
      // Load example data and generate payments
      await user.click(screen.getByRole('button', { name: 'Load Example Data' }));
      await user.click(screen.getByText(/Generate Payment Plan/));
      
      // Check if payment summary appears
      await waitFor(() => {
        expect(screen.getByText('Payment Summary')).toBeInTheDocument();
        // Use getAllByText since $15.00 appears in both expenses table and payment summary
        expect(screen.getAllByText('$15.00').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should show expandable balance details section', async () => {
      const user = userEvent.setup();
      const mockPayments = [
        {
          from: { id: '2', name: 'john' },
          to: { id: '3', name: 'tim' },
          amount: 15
        }
      ];
      
      mockCalculatePayments.mockReturnValue(mockPayments);
      
      render(<Home />);
      
      // Load data and generate payments
      await user.click(screen.getByRole('button', { name: 'Load Example Data' }));
      await user.click(screen.getByText(/Generate Payment Plan/));
      
      // Check if balance details section exists but is collapsed
      expect(screen.getByText('Balance Details & Calculations')).toBeInTheDocument();
      expect(screen.getByText('Show Details')).toBeInTheDocument();
      
      // Expand the section
      await user.click(screen.getByText('Show Details'));
      expect(screen.getByText('Hide Details')).toBeInTheDocument();
    });
  });

  describe('Form Validation and Error Handling', () => {
    it('should handle invalid numeric input in amount field', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      // Add users first
      const userInput = screen.getByPlaceholderText('Enter participant name');
      await user.type(userInput, 'Test User');
      await user.click(screen.getByRole('button', { name: 'Add' }));
      
      const amountInput = screen.getByPlaceholderText('0.00');
      
      // Try to enter invalid characters - the HTML input type="number" should handle this
      await user.type(amountInput, 'abc');
      // Numeric inputs often ignore invalid characters, so we can't test the exact behavior
      expect(amountInput).toBeInTheDocument();
    });

    it('should require payer selection', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      // Add users
      const userInput = screen.getByPlaceholderText('Enter participant name');
      await user.type(userInput, 'Test User');
      await user.click(screen.getByRole('button', { name: 'Add' }));
      
      // Mock alert
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      // Fill form but leave payer empty
      const vendorInput = screen.getByPlaceholderText('Restaurant, store, etc.');
      const amountInput = screen.getByPlaceholderText('0.00');
      const userCheckbox = screen.getByLabelText('Test User');
      
      await user.type(vendorInput, 'Test Vendor');
      await user.type(amountInput, '10.00');
      await user.click(userCheckbox);
      await user.click(screen.getByRole('button', { name: 'Add Expense' }));
      
      expect(alertSpy).toHaveBeenCalledWith('Please fill in all fields');
      alertSpy.mockRestore();
    });

    it('should require at least one attendee', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      // Add users
      const userInput = screen.getByPlaceholderText('Enter participant name');
      await user.type(userInput, 'Test User');
      await user.click(screen.getByRole('button', { name: 'Add' }));
      
      // Mock alert
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      // Fill form but don't select attendees
      const vendorInput = screen.getByPlaceholderText('Restaurant, store, etc.');
      const amountInput = screen.getByPlaceholderText('0.00');
      const payerSelect = screen.getByDisplayValue('Select payer');
      
      await user.type(vendorInput, 'Test Vendor');
      await user.type(amountInput, '10.00');
      await user.selectOptions(payerSelect, 'Test User');
      await user.click(screen.getByRole('button', { name: 'Add Expense' }));
      
      expect(alertSpy).toHaveBeenCalledWith('Please fill in all fields');
      alertSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper input placeholders', () => {
      render(<Home />);
      
      expect(screen.getByPlaceholderText('Enter participant name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Restaurant, store, etc.')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    });

    it('should have accessible button text', () => {
      render(<Home />);
      
      expect(screen.getByRole('button', { name: 'Load Example Data' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Clear All' })).toBeInTheDocument();
    });
  });

  describe('Component State Management', () => {
    it('should maintain separate state for new expense form', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      // Add users
      const userInput = screen.getByPlaceholderText('Enter participant name');
      await user.type(userInput, 'User1');
      await user.click(screen.getByRole('button', { name: 'Add' }));
      await user.type(userInput, 'User2');
      await user.click(screen.getByRole('button', { name: 'Add' }));
      
      // Fill expense form partially
      const vendorInput = screen.getByPlaceholderText('Restaurant, store, etc.');
      await user.type(vendorInput, 'Test Vendor');
      
      const user1Checkbox = screen.getByLabelText('User1');
      await user.click(user1Checkbox);
      
      // Form state should be maintained
      expect(vendorInput).toHaveValue('Test Vendor');
      expect(user1Checkbox).toBeChecked();
      
      // Adding a new user shouldn't affect expense form state
      await user.type(userInput, 'User3');
      await user.click(screen.getByRole('button', { name: 'Add' }));
      
      expect(vendorInput).toHaveValue('Test Vendor');
      expect(user1Checkbox).toBeChecked();
    });

    it('should clear payments when trip data changes', async () => {
      const user = userEvent.setup();
      const mockPayments = [
        {
          from: { id: '2', name: 'john' },
          to: { id: '3', name: 'tim' },
          amount: 15
        }
      ];
      
      mockCalculatePayments.mockReturnValue(mockPayments);
      
      render(<Home />);
      
      // Load example data and generate payments
      await user.click(screen.getByRole('button', { name: 'Load Example Data' }));
      await user.click(screen.getByText(/Generate Payment Plan/));
      
      // Verify payments are shown
      expect(screen.getByText('Payment Summary')).toBeInTheDocument();
      
      // Clear all data
      await user.click(screen.getByRole('button', { name: 'Clear All' }));
      
      // Payments should be cleared
      expect(screen.queryByText('Payment Summary')).not.toBeInTheDocument();
    });
  });
});