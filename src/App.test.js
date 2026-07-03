import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login screen and theme dropdown trigger', () => {
  render(<App />);
  expect(screen.getByText(/Raster DICOM Burner/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Theme/i })).toBeInTheDocument();
});
