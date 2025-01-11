import "./globals.css";

export const metadata = {
  title: "BookMyDev",
  description: "BookMyDev is a platform for hiring developers",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
