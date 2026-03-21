import React from 'react';

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto py-8">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} <span className="font-bold text-foreground">VisionX</span>. Where innovators connect and ideas take flight.</p>
      </div>
    </footer>
  );
}
