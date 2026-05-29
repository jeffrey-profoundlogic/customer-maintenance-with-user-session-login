import { useState, FormEvent } from 'react';
import { Card, Form, Button, Alert, Container } from 'react-bootstrap';

interface LoginFormProps {
  onLogin: (username: string, password: string) => Promise<void>;
  error: string | null;
}

export function LoginForm({ onLogin, error }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setLoading(true);
    try {
      await onLogin(username.trim(), password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: '100vh' }}
    >
      <Card style={{ width: '100%', maxWidth: '400px' }}>
        <Card.Header className="bg-dark text-white text-center py-3">
          <h5 className="mb-0">Customer Maintenance</h5>
        </Card.Header>
        <Card.Body className="p-4">
          <h6 className="text-muted text-center mb-4">Sign in with your IBM i credentials</h6>

          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="IBM i user profile"
                autoComplete="username"
                autoFocus
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                disabled={loading}
              />
            </Form.Group>

            <Button
              type="submit"
              variant="dark"
              className="w-100"
              disabled={loading || !username.trim() || !password}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
