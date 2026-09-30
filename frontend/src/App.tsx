import React from 'react';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { AppRouter } from './app/router/AppRouter';

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppRouter />
    </Provider>
  );
};

export default App;

