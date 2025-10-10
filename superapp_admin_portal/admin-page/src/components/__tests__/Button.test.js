import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from '../common/Button';

test('Button renders correctly', () => {
	const { getByText } = render(<Button>Click Me</Button>);
	const buttonElement = getByText(/click me/i);
	expect(buttonElement).toBeInTheDocument();
});