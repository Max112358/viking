import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';

// Function to dynamically load components
const importAll = (r) => {
  let components = {};
  r.keys().forEach((item) => {
    const componentName = item.replace('./', '').replace('.js', '');
    components[componentName] = React.lazy(() => import(`./components/${componentName}`));
  });
  return components;
};

// Import all components from the components folder
const components = importAll(require.context('./components', false, /\.js$/));

// Styles
const styles = {
  nav: {
    backgroundColor: '#f8f9fa',
    padding: '10px 0',
    marginBottom: '20px',
  },
  ul: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    justifyContent: 'center',
  },
  li: {
    margin: '0 10px',
  },
  link: {
    textDecoration: 'none',
    color: '#007bff',
    fontWeight: 'bold',
  },
};

function App() {
  return (
    <Router>
      <nav style={styles.nav}>
        <ul style={styles.ul}>
          {Object.keys(components).map((componentName) => (
            <li key={componentName} style={styles.li}>
              <Link to={`/${componentName.toLowerCase()}`} style={styles.link}>
                {componentName.charAt(0).toUpperCase() + componentName.slice(1)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <React.Suspense fallback={<div>Loading...</div>}>
        <Routes>
          {Object.entries(components).map(([componentName, Component]) => (
            <Route
              key={componentName}
              path={`/${componentName.toLowerCase()}`}
              element={<Component />}
            />
          ))}
        </Routes>
      </React.Suspense>
    </Router>
  );
}

export default App;