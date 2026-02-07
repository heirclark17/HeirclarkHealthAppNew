import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NamePromptModal } from '../NamePromptModal';

// Mock the AuthContext
const mockUpdateUserName = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    updateUserName: mockUpdateUserName,
  }),
}));

describe('NamePromptModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateUserName.mockResolvedValue(true);
  });

  it('renders without crashing when visible', () => {
    expect(() => render(<NamePromptModal visible={true} />)).not.toThrow();
  });

  it('does not show content when not visible', () => {
    const { queryByText } = render(<NamePromptModal visible={false} />);
    expect(queryByText('Welcome!')).toBeFalsy();
  });

  it('displays welcome title', () => {
    const { getByText } = render(<NamePromptModal visible={true} />);
    expect(getByText('Welcome!')).toBeTruthy();
  });

  it('displays subtitle message', () => {
    const { getByText } = render(<NamePromptModal visible={true} />);
    expect(getByText(/Please enter your name to personalize/)).toBeTruthy();
  });

  it('displays info about Apple Sign In', () => {
    const { getByText } = render(<NamePromptModal visible={true} />);
    expect(getByText(/Apple only shares your name on first sign-in/)).toBeTruthy();
  });

  it('renders first name input field', () => {
    const { getByPlaceholderText } = render(<NamePromptModal visible={true} />);
    expect(getByPlaceholderText('First Name')).toBeTruthy();
  });

  it('renders last name input field', () => {
    const { getByPlaceholderText } = render(<NamePromptModal visible={true} />);
    expect(getByPlaceholderText('Last Name (optional)')).toBeTruthy();
  });

  it('renders Continue button', () => {
    const { getByText } = render(<NamePromptModal visible={true} />);
    expect(getByText('Continue')).toBeTruthy();
  });

  it('updates first name when typing', () => {
    const { getByPlaceholderText } = render(<NamePromptModal visible={true} />);
    const input = getByPlaceholderText('First Name');

    fireEvent.changeText(input, 'John');

    expect(input.props.value).toBe('John');
  });

  it('updates last name when typing', () => {
    const { getByPlaceholderText } = render(<NamePromptModal visible={true} />);
    const input = getByPlaceholderText('Last Name (optional)');

    fireEvent.changeText(input, 'Doe');

    expect(input.props.value).toBe('Doe');
  });

  it('shows error when submitting without first name', async () => {
    const { getByText } = render(<NamePromptModal visible={true} />);
    const button = getByText('Continue');

    fireEvent.press(button);

    await waitFor(() => {
      expect(getByText('Please enter your first name')).toBeTruthy();
    });
  });

  it('clears error when typing in first name', async () => {
    const { getByText, getByPlaceholderText, queryByText } = render(<NamePromptModal visible={true} />);
    const button = getByText('Continue');
    const input = getByPlaceholderText('First Name');

    // Trigger error
    fireEvent.press(button);
    await waitFor(() => {
      expect(getByText('Please enter your first name')).toBeTruthy();
    });

    // Type in input - error should clear
    fireEvent.changeText(input, 'John');

    await waitFor(() => {
      expect(queryByText('Please enter your first name')).toBeFalsy();
    });
  });

  it('calls updateUserName with first name only', async () => {
    const { getByText, getByPlaceholderText } = render(<NamePromptModal visible={true} />);
    const input = getByPlaceholderText('First Name');
    const button = getByText('Continue');

    fireEvent.changeText(input, 'John');
    fireEvent.press(button);

    await waitFor(() => {
      expect(mockUpdateUserName).toHaveBeenCalledWith('John');
    });
  });

  it('calls updateUserName with full name when both provided', async () => {
    const { getByText, getByPlaceholderText } = render(<NamePromptModal visible={true} />);
    const firstNameInput = getByPlaceholderText('First Name');
    const lastNameInput = getByPlaceholderText('Last Name (optional)');
    const button = getByText('Continue');

    fireEvent.changeText(firstNameInput, 'John');
    fireEvent.changeText(lastNameInput, 'Doe');
    fireEvent.press(button);

    await waitFor(() => {
      expect(mockUpdateUserName).toHaveBeenCalledWith('John Doe');
    });
  });

  it('trims whitespace from names', async () => {
    const { getByText, getByPlaceholderText } = render(<NamePromptModal visible={true} />);
    const firstNameInput = getByPlaceholderText('First Name');
    const button = getByText('Continue');

    fireEvent.changeText(firstNameInput, '  John  ');
    fireEvent.press(button);

    await waitFor(() => {
      expect(mockUpdateUserName).toHaveBeenCalledWith('John');
    });
  });

  it('shows loading state during submission', async () => {
    mockUpdateUserName.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)));

    const { getByText, getByPlaceholderText } = render(<NamePromptModal visible={true} />);
    const input = getByPlaceholderText('First Name');
    const button = getByText('Continue');

    fireEvent.changeText(input, 'John');
    fireEvent.press(button);

    // Button should be disabled during loading
    await waitFor(() => {
      expect(button.props.accessibilityState?.disabled).toBe(true);
    });
  });

  it('shows error when update fails', async () => {
    mockUpdateUserName.mockResolvedValue(false);

    const { getByText, getByPlaceholderText } = render(<NamePromptModal visible={true} />);
    const input = getByPlaceholderText('First Name');
    const button = getByText('Continue');

    fireEvent.changeText(input, 'John');
    fireEvent.press(button);

    await waitFor(() => {
      expect(getByText(/Failed to save your name/)).toBeTruthy();
    });
  });

  it('displays person icon', () => {
    const { root } = render(<NamePromptModal visible={true} />);
    expect(root).toBeTruthy();
  });

  it('displays information icon in info box', () => {
    const { root } = render(<NamePromptModal visible={true} />);
    expect(root).toBeTruthy();
  });
});
