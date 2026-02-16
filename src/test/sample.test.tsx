import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

const SimpleComponent = () => <div>Hello Test</div>;

describe('SimpleComponent', () => {
    it('should render correct text', () => {
        render(<SimpleComponent />);
        expect(screen.getByText('Hello Test')).toBeInTheDocument();
    });
});
