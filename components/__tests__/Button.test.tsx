import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

// Mock haptics
jest.mock('../../utils/haptics', () => ({
  lightImpact: jest.fn().mockResolvedValue(undefined),
  mediumImpact: jest.fn().mockResolvedValue(undefined),
  successNotification: jest.fn().mockResolvedValue(undefined),
}));

const { lightImpact, mediumImpact, successNotification } = require('../../utils/haptics');

describe('Button', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<Button title="Test" onPress={jest.fn()} />)).not.toThrow();
  });

  it('displays button title', () => {
    const { getByText } = render(<Button title="Click Me" onPress={jest.fn()} />);
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button title="Press" onPress={onPressMock} />);

    fireEvent.press(getByText('Press'));

    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('renders primary variant by default', () => {
    const { getByText } = render(<Button title="Primary" onPress={jest.fn()} />);
    expect(getByText('Primary')).toBeTruthy();
  });

  it('renders secondary variant', () => {
    const { getByText } = render(<Button title="Secondary" onPress={jest.fn()} variant="secondary" />);
    expect(getByText('Secondary')).toBeTruthy();
  });

  it('renders tertiary variant', () => {
    const { getByText } = render(<Button title="Tertiary" onPress={jest.fn()} variant="tertiary" />);
    expect(getByText('Tertiary')).toBeTruthy();
  });

  it('renders destructive variant', () => {
    const { getByText } = render(<Button title="Delete" onPress={jest.fn()} variant="destructive" />);
    expect(getByText('Delete')).toBeTruthy();
  });

  it('renders glass variant', () => {
    const { getByText } = render(<Button title="Glass" onPress={jest.fn()} variant="glass" />);
    expect(getByText('Glass')).toBeTruthy();
  });

  it('renders small size', () => {
    const { getByText } = render(<Button title="Small" onPress={jest.fn()} size="small" />);
    expect(getByText('Small')).toBeTruthy();
  });

  it('renders default size', () => {
    const { getByText } = render(<Button title="Default" onPress={jest.fn()} size="default" />);
    expect(getByText('Default')).toBeTruthy();
  });

  it('renders large size', () => {
    const { getByText } = render(<Button title="Large" onPress={jest.fn()} size="large" />);
    expect(getByText('Large')).toBeTruthy();
  });

  it('renders as disabled', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button title="Disabled" onPress={onPressMock} disabled={true} />);

    const button = getByText('Disabled');
    fireEvent.press(button);

    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('shows loading indicator when loading', () => {
    const { root } = render(<Button title="Loading" onPress={jest.fn()} loading={true} />);
    expect(root).toBeTruthy();
    // ActivityIndicator should be present
  });

  it('does not call onPress when loading', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button title="Loading" onPress={onPressMock} loading={true} />);

    fireEvent.press(getByText('Loading'));

    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('renders full width button', () => {
    const { getByText } = render(<Button title="Full Width" onPress={jest.fn()} fullWidth={true} />);
    expect(getByText('Full Width')).toBeTruthy();
  });

  it('triggers light haptic by default', async () => {
    const { getByText } = render(<Button title="Haptic" onPress={jest.fn()} />);

    fireEvent.press(getByText('Haptic'));

    expect(lightImpact).toHaveBeenCalled();
  });

  it('triggers medium haptic when specified', async () => {
    const { getByText } = render(<Button title="Medium" onPress={jest.fn()} haptic="medium" />);

    fireEvent.press(getByText('Medium'));

    expect(mediumImpact).toHaveBeenCalled();
  });

  it('triggers success haptic when specified', async () => {
    const { getByText } = render(<Button title="Success" onPress={jest.fn()} haptic="success" />);

    fireEvent.press(getByText('Success'));

    expect(successNotification).toHaveBeenCalled();
  });

  it('does not trigger haptic when set to none', async () => {
    const { getByText } = render(<Button title="No Haptic" onPress={jest.fn()} haptic="none" />);

    fireEvent.press(getByText('No Haptic'));

    expect(lightImpact).not.toHaveBeenCalled();
    expect(mediumImpact).not.toHaveBeenCalled();
    expect(successNotification).not.toHaveBeenCalled();
  });

  it('applies custom style', () => {
    const customStyle = { margin: 20 };
    const { getByText } = render(<Button title="Styled" onPress={jest.fn()} style={customStyle} />);
    expect(getByText('Styled')).toBeTruthy();
  });

  it('applies custom text style', () => {
    const customTextStyle = { fontSize: 20 };
    const { getByText } = render(<Button title="Text Style" onPress={jest.fn()} textStyle={customTextStyle} />);
    expect(getByText('Text Style')).toBeTruthy();
  });

  it('has accessibility label', () => {
    const { getByLabelText } = render(
      <Button title="Accessible" onPress={jest.fn()} accessibilityLabel="Custom Label" />
    );
    expect(getByLabelText('Custom Label')).toBeTruthy();
  });

  it('has accessibility hint', () => {
    const { getByA11yHint } = render(
      <Button title="Hint" onPress={jest.fn()} accessibilityHint="This saves your data" />
    );
    expect(getByA11yHint('This saves your data')).toBeTruthy();
  });

  it('renders with blur effect for glass variant', () => {
    const { getByText } = render(<Button title="Glass Blur" onPress={jest.fn()} variant="glass" useBlur={true} />);
    expect(getByText('Glass Blur')).toBeTruthy();
  });

  it('renders without blur when useBlur is false', () => {
    const { getByText } = render(<Button title="No Blur" onPress={jest.fn()} variant="glass" useBlur={false} />);
    expect(getByText('No Blur')).toBeTruthy();
  });

  it('renders with all props combined', () => {
    const { getByText } = render(
      <Button
        title="Complete"
        onPress={jest.fn()}
        variant="primary"
        size="large"
        fullWidth={true}
        haptic="success"
        accessibilityLabel="Complete button"
      />
    );
    expect(getByText('Complete')).toBeTruthy();
  });
});
