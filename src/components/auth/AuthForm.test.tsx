import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthForm } from '@/components/auth/AuthForm';

const onSubmit = vi.fn();

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('AuthForm', () => {
  it('renders email and password inputs', () => {
    render(<AuthForm mode="login" onSubmit={onSubmit} />);
    expect(screen.getByLabelText(/email/i)).toBeDefined();
    expect(screen.getByLabelText(/password/i)).toBeDefined();
  });

  it('calls onSubmit with email and password on submit', async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="login" onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('shows confirm password field in register mode', () => {
    render(<AuthForm mode="register" onSubmit={onSubmit} />);
    expect(screen.getByLabelText(/confirm password/i)).toBeDefined();
  });

  it('shows error message when error prop is set', () => {
    render(<AuthForm mode="login" onSubmit={onSubmit} error="Invalid credentials" />);
    expect(document.body.textContent).toContain('Invalid credentials');
  });

  it('disables submit button while loading', () => {
    render(<AuthForm mode="login" onSubmit={onSubmit} isLoading={true} />);
    const button = screen.getByRole('button', { name: 'Please wait...' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
