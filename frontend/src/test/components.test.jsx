import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StatCard from '../components/StatCard';
import ConfirmModal from '../components/ConfirmModal';

describe('Frontend Component Tests', () => {
  describe('StatCard', () => {
    it('renders title, value and subtext correctly', () => {
      render(
        <StatCard
          title="Total Documents"
          value="42"
          subtext="Updated just now"
          icon={<span data-testid="icon">icon</span>}
        />
      );

      expect(screen.getByText('Total Documents')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('Updated just now')).toBeInTheDocument();
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
  });

  describe('ConfirmModal', () => {
    it('does not render when isOpen is false', () => {
      const { container } = render(
        <ConfirmModal
          isOpen={false}
          title="Delete Item"
          onConfirm={() => {}}
          onClose={() => {}}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders and responds to confirm and cancel clicks', () => {
      const onConfirm = vi.fn();
      const onClose = vi.fn();

      render(
        <ConfirmModal
          isOpen={true}
          title="Delete Item"
          message="Are you sure you want to delete this document?"
          confirmText="Yes, Delete"
          onConfirm={onConfirm}
          onClose={onClose}
        />
      );

      expect(screen.getByText('Delete Item')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete this document?')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Cancel'));
      expect(onClose).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText('Yes, Delete'));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });
});
