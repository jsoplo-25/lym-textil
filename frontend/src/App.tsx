import React from 'react';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { AppRouter } from './app/router/AppRouter';
import { ToastContainer } from './shared/ui/Toast';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppRouter />
      <ToastContainer />
    </Provider>
  );
};

export default App;

