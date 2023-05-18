import React from 'react';

import { MemoryRouter, Route, Switch } from 'react-router-dom';
import { render as renderRTL, waitFor } from '@testing-library/react';
import { auth } from '@strapi/helper-plugin';

import PrivateRoute from '../index';

const ProtectedPage = () => {
  return <div>You are authenticated</div>;
};

const LoginPage = () => {
  return <div>Please login</div>;
};

describe('PrivateRoute', () => {
  let testLocation;

  const render = (initialEntries = []) =>
    renderRTL(
      <MemoryRouter initialEntries={initialEntries}>
        <Switch>
          <Route
            path="/auth/login"
            component={({ location }) => {
              testLocation = location;

              return <LoginPage />;
            }}
          />
          <PrivateRoute
            path="/"
            component={({ location }) => {
              testLocation = location;

              return <ProtectedPage />;
            }}
          />
        </Switch>
      </MemoryRouter>
    );

  afterEach(() => {
    auth.clearToken();
  });

  it('Authenticated users should be able to access protected routes', async () => {
    // Login
    auth.setToken('access-token');

    const { getByText } = render(['/protected']);
    // Should see the protected route
    await waitFor(() => expect(getByText('You are authenticated')));
  });

  describe('unauthenticated users', () => {
    it('should redirect you to the login page', async () => {
      const { getByText } = render(['/']);
      // Should redirected to `/auth/login`
      await waitFor(() => expect(getByText('Please login')).toBeInTheDocument());
    });

    it('should preserver the url when you are redirected', async () => {
      const { getByText } = render(['/settings/user']);

      await waitFor(() => {
        expect(testLocation.pathname).toBe('/auth/login');
        // Should preserve url in the params
        expect(testLocation.search).toBe(`?redirectTo=${encodeURIComponent('/settings/user')}`);

        expect(getByText('Please login')).toBeInTheDocument();
      });
    });

    it('should preserve the url with search params when you are redirected', async () => {
      const { getByText } = render(['/settings/user?hello=world']);

      await waitFor(() => {
        expect(testLocation.pathname).toBe('/auth/login');
        // Should preserve search params
        expect(testLocation.search).toBe(
          `?redirectTo=${encodeURIComponent('/settings/user?hello=world')}`
        );

        expect(getByText('Please login')).toBeInTheDocument();
      });
    });
  });
});
