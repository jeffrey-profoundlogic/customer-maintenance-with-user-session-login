import { ReactNode } from 'react';
import { Container, Navbar, Button } from 'react-bootstrap';

interface LayoutProps {
  children: ReactNode;
  username?: string;
  onLogout?: () => void;
}

export function Layout({ children, username, onLogout }: LayoutProps) {
  return (
    <>
      <Navbar bg="dark" variant="dark" className="mb-4">
        <Container>
          <Navbar.Brand>Customer Maintenance</Navbar.Brand>
          {username && onLogout && (
            <Navbar.Text className="ms-auto d-flex align-items-center gap-3">
              <span className="text-white-50">
                Signed in as <strong className="text-white">{username}</strong>
              </span>
              <Button variant="outline-light" size="sm" onClick={onLogout}>
                Sign Out
              </Button>
            </Navbar.Text>
          )}
        </Container>
      </Navbar>
      <Container>{children}</Container>
    </>
  );
}
