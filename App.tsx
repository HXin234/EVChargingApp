import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { createTable } from './src/utils/Database';

const App = () => {
  // This hook runs exactly once when the app opens to initialize your database
  useEffect(() => {
    createTable();
  }, []);

  return <AppNavigator />;
};

export default App; 