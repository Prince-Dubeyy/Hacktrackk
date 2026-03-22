import React from 'react';

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto py-8">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} <span className="font-bold text-foreground">VisionX</span>. Where innovators connect and ideas take flight.</p>
        <div className="mt-4">
          <a 
            href="https://chat.whatsapp.com/BCx87V8Ld2tE9vORSnqzeq" 
            target="_blank" 
            rel="noreferrer"
            className="text-green-600 hover:text-green-700 font-medium inline-flex items-center gap-2 transition"
          >
            💬 Join our WhatsApp Community
          </a>
        </div>
      </div>
    </footer>
  );
}
