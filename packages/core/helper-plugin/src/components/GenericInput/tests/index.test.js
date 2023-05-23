import React from 'react';
import { DesignSystemProvider } from '@strapi/design-system';
import { IntlProvider } from 'react-intl';
import { render, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import GenericInput from '../index';

function ComponentFixture(props) {
  return (
    <IntlProvider locale="en" messages={{}}>
      <DesignSystemProvider locale="en-GB">
        <GenericInput {...props} />
      </DesignSystemProvider>
    </IntlProvider>
  );
}

function setupNumber(props) {
  const NUMBER_FIXTURE_PROPS = {
    type: 'number',
    name: 'number',
    intlLabel: {
      id: 'label.test',
      defaultMessage: 'Default label',
    },
    placeholder: {
      id: 'placeholder.test',
      defaultMessage: 'Default placeholder',
    },
    hint: 'Hint message',
    value: null,
    required: true,
    onChange: jest.fn,
    ...props,
  };

  const rendered = render(<ComponentFixture {...NUMBER_FIXTURE_PROPS} />);
  const input = rendered.container.querySelector('input');

  return {
    ...rendered,
    input,
  };
}

function setupDatetimePicker(props) {
  const DATETIMEPICKER_FIXTURE_PROPS = {
    type: 'datetime',
    name: 'datetime-picker',
    intlLabel: {
      id: 'label.test',
      defaultMessage: 'datetime picker',
    },
    value: null,
    onChange: jest.fn(),
    onClear: jest.fn(),
    ...props,
  };

  return render(<ComponentFixture {...DATETIMEPICKER_FIXTURE_PROPS} />);
}
/**
 * We extend the timeout of these tests because the DS
 * DateTimePicker has a slow rendering issue at the moment.
 * It passes locally, but fails in the CI.
 */
jest.setTimeout(50000);

describe('GenericInput', () => {
  describe('number', () => {
    test('renders and matches the snapshot', () => {
      const { container } = setupNumber();
      expect(container).toMatchSnapshot();
    });

    test('renders an error message', () => {
      const { getByText } = setupNumber({ error: 'Error message' });
      expect(getByText('Error message')).toBeInTheDocument();
    });

    test('renders a number (int) value', () => {
      const { container } = setupNumber({ value: 1 });
      expect(container.querySelector('[type="text"]').value).toBe('1');
    });

    test('renders a number (float) value', () => {
      const { container } = setupNumber({ value: 1.3333 });
      expect(container.querySelector('input').value).toBe('1.3333');
    });

    test('does not call onChange callback on first render', () => {
      const spy = jest.fn();
      setupNumber({ value: null, onChange: spy });
      expect(spy).not.toHaveBeenCalled();
    });

    test('does not call onChange callback if the value does not change', () => {
      const spy = jest.fn();
      const { input } = setupNumber({ value: 23, onChange: spy });

      fireEvent.change(input, { target: { value: 23 } });

      expect(spy).not.toHaveBeenCalledWith();
    });

    test('does call onChange callback with number (int) value', () => {
      const spy = jest.fn();
      const { input } = setupNumber({ value: null, onChange: spy });

      fireEvent.change(input, { target: { value: '23' } });

      expect(spy).toHaveBeenCalledWith({ target: { name: 'number', type: 'number', value: 23 } });
    });

    test('does call onChange callback with number (float) value', () => {
      const spy = jest.fn();
      const { input } = setupNumber({ value: null, onChange: spy });

      fireEvent.change(input, { target: { value: '1.3333' } });

      expect(spy).toHaveBeenCalledWith({
        target: { name: 'number', type: 'number', value: 1.3333 },
      });
    });

    test('does call onChange callback with number (0) value', () => {
      const spy = jest.fn();
      const { input } = setupNumber({ value: null, onChange: spy });

      fireEvent.change(input, { target: { value: '0' } });

      expect(spy).toHaveBeenCalledWith({
        target: { name: 'number', type: 'number', value: 0 },
      });
    });
  });
  describe('json', () => {
    test('renders and matches the snapshot', () => {
      const { container } = render(
        <ComponentFixture
          type="json"
          name="json"
          intlLabel={{
            id: 'label.test',
            defaultMessage: 'Default label',
          }}
          value={null}
          onChange={jest.fn}
        />
      );
      expect(container).toMatchSnapshot();
    });
  });

  describe('datetime', () => {
    test('renders the datetime picker with the correct value for date and time', async () => {
      const user = userEvent.setup();
      const { getByRole } = setupDatetimePicker();

      await user.click(getByRole('combobox', { name: 'Choose date' }));
      await user.click(getByRole('gridcell', { name: /15/ }));

      const today = new Date().setDate(15);
      const formattedDate = new Intl.DateTimeFormat('en-GB').format(today);
      expect(getByRole('combobox', { name: 'Choose date' })).toHaveValue(formattedDate);
      expect(getByRole('combobox', { name: 'Choose time' })).toHaveValue('00:00');
    });

    test('simulate clicking on the Clear button in the date and check if the date and time are empty', async () => {
      const user = userEvent.setup();
      const { getByRole } = setupDatetimePicker();

      await user.click(getByRole('combobox', { name: 'Choose date' }));
      await user.click(getByRole('gridcell', { name: /15/ }));
      await user.click(getByRole('button', { name: 'Clear date' }));

      expect(getByRole('combobox', { name: 'Choose date' })).toHaveValue('');
      expect(getByRole('combobox', { name: 'Choose time' })).toHaveValue('');
    });
  });
});
