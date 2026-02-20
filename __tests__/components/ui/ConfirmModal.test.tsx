jest.mock('../../../src/lib/supabase');

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ConfirmModal from '../../../src/components/ui/ConfirmModal';

describe('ConfirmModal', () => {
  const defaultProps = {
    visible: true,
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item?',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { toJSON } = render(<ConfirmModal {...defaultProps} />);
    expect(toJSON()).toBeTruthy();
  });

  it('displays title and message', () => {
    const { getByText } = render(<ConfirmModal {...defaultProps} />);
    expect(getByText('Delete Item')).toBeTruthy();
    expect(getByText('Are you sure you want to delete this item?')).toBeTruthy();
  });

  it('displays default button labels', () => {
    const { getByText } = render(<ConfirmModal {...defaultProps} />);
    expect(getByText('Confirm')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
  });

  it('displays custom button labels', () => {
    const { getByText } = render(
      <ConfirmModal {...defaultProps} confirmLabel="Yes, Delete" cancelLabel="No, Keep" />
    );
    expect(getByText('Yes, Delete')).toBeTruthy();
    expect(getByText('No, Keep')).toBeTruthy();
  });

  it('calls onConfirm when confirm button pressed', () => {
    const onConfirm = jest.fn();
    const { getByText } = render(
      <ConfirmModal {...defaultProps} onConfirm={onConfirm} />
    );
    fireEvent.press(getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('calls onCancel when cancel button pressed', () => {
    const onCancel = jest.fn();
    const { getByText } = render(
      <ConfirmModal {...defaultProps} onCancel={onCancel} />
    );
    fireEvent.press(getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });
});
