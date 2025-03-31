import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="max-w-md mx-auto text-center">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
      <p className="text-muted-foreground mb-8">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-opacity-90 transition-colors">
        Go Back Home
      </Link>
    </div>
  );
};

export default NotFound; 